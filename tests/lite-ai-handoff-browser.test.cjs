'use strict';
// Nurgat Tours staff → Supabase Edge handoff QA in real Chromium.
// ALL remote Supabase requests are intercepted. No real tokens, n8n executions,
// customer information, provider searches, bookings or sends.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const { chromium } = require('playwright');

const BASE = 'https://ysakhagnlmhwbbmetjjc.supabase.co';
const REVIEWER_ID = '00000000-0000-4000-8000-000000000001';
const TOKEN = 'FAKE_ISOLATED_TEST_SESSION_ONLY';
const headers = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'authorization, apikey, content-type'
};
const flights = {
  ok: true, mode: 'FICTIONAL_DEMO_ONLY', providerConnected: false,
  fareVerified: false, customerSendAllowed: false, bookingAvailable: false,
  ticketIssuanceAllowed: false,
  offers: [
    { id: 'DEMO-A', airline: 'Sample Air A', currency: 'USD', illustrativeTotal: 650, durationMinutes: 790, stops: 1 },
    { id: 'DEMO-B', airline: 'Sample Air B', currency: 'USD', illustrativeTotal: 735, durationMinutes: 910, stops: 2 },
    { id: 'DEMO-C', airline: 'Sample Air C', currency: 'USD', illustrativeTotal: 890, durationMinutes: 540, stops: 0 }
  ]
};
const safeAI = {
  ok: true, source: 'NURGAT_AI_DEMO', demoOnly: true, providerConnected: false,
  customerSendAllowed: false, bookingAvailable: false,
  answer: 'Demo research: Sample Air C has zero stops in these fictional samples.'
};
const safePlan = {
  ok: true, mode: 'AWAITING_GDS_CONNECTION', providerConnected: false,
  commandExecutionAllowed: false, customerSendAllowed: false,
  bookingAvailable: false, customerQuoteAvailable: false,
  plan: 'GDS RESEARCH PLAN — NOT CONNECTED. This is a research checklist. No live search or booking occurred.'
};

(async () => {
  const source = fs.readFileSync('index.html');
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(source);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.addInitScript(token => {
      sessionStorage.setItem('nurgat-auth-v2', JSON.stringify({
        access_token: token, refresh_token: 'FAKE_REFRESH_TOKEN'
      }));
    }, TOKEN);

    let activeReviewer = true;
    let aiReply = safeAI;
    let planReply = safePlan;
    let aiStatus = 200;
    const edgeCalls = [];
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.route(`${BASE}/**`, async route => {
      const req = route.request();
      const url = new URL(req.url());
      const path = url.pathname;
      const method = req.method();
      const reply = (body, status = 200) => route.fulfill({
        status, headers, body: JSON.stringify(body)
      });
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (path === '/auth/v1/user' && method === 'GET') return reply({ id: REVIEWER_ID });
      if (path === '/rest/v1/approval_reviewers' && method === 'GET') {
        return reply(activeReviewer ? [{ user_id: REVIEWER_ID }] : []);
      }
      if (path.startsWith('/functions/v1/')) {
        assert.equal(method, 'POST');
        assert.equal(req.headers().authorization, 'Bearer ' + TOKEN,
          'Edge calls must use the authenticated staff session');
        const body = req.postDataJSON();
        edgeCalls.push({ path, body });
        if (path === '/functions/v1/nurgat-flight-research-demo') return reply(flights);
        if (path === '/functions/v1/nurgat-staff-flight-ai-demo') return reply(aiReply, aiStatus);
        if (path === '/functions/v1/nurgat-gds-planner-demo') return reply(planReply);
      }
      throw new Error('Unexpected remote request in isolated browser QA: ' + method + ' ' + path);
    });

    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#workspace:not(.hidden)').waitFor();
    assert.equal(await page.locator('#login').isVisible(), false);
    console.log('PASS 1: Approved staff session opens the workspace after auth checks');

    await page.locator('#searchButton').click();
    await page.locator('#offers .offer').first().waitFor();
    await page.locator('[data-tab="ai"]').click();
    await page.locator('#aiQuestion').fill('Which sample flight has fewer stops?');
    await page.locator('#aiButton').click();
    await page.getByText('AI answered about fictional flight context only.').waitFor();
    assert.match(await page.locator('#aiAnswer').innerText(), /^Demo research:/);
    const aiCall = edgeCalls.find(c => c.path.endsWith('nurgat-staff-flight-ai-demo'));
    assert.deepEqual(Object.keys(aiCall.body).sort(), ['question', 'selectedId']);
    assert.equal(aiCall.body.selectedId, null);
    assert.equal('jwt' in aiCall.body, false, 'The browser must not send the JWT inside the payload');
    console.log('PASS 2: Fictional staff AI routes through authenticated Supabase Edge');

    await page.locator('#planButton').click();
    await page.getByText('Ready for API integration; no commands executed.').waitFor();
    assert.match(await page.locator('#planAnswer').innerText(), /NOT CONNECTED/);
    const planCall = edgeCalls.find(c => c.path.endsWith('nurgat-gds-planner-demo'));
    assert.deepEqual(Object.keys(planCall.body).sort(),
      ['adults','cabin','children','departureDate','destination','infants','origin','preference','returnDate','tripType'].sort());
    assert.equal(planCall.body.origin, 'LUN');
    assert.equal(planCall.body.destination, 'DXB');
    assert.equal('jwt' in planCall.body, false);
    console.log('PASS 3: GDS planner receives only allowed trip fields and no JWT in body');

    aiReply = { ...safeAI, bookingAvailable: true };
    await page.locator('#aiButton').click();
    await page.getByText('AI output failed demo checks.').waitFor();
    assert.equal(await page.locator('#aiAnswer').isVisible(), false);
    aiReply = safeAI;
    console.log('PASS 4: Unsafe AI booking flag fails closed, hiding any old answer');

    planReply = { ...safePlan, providerConnected: true };
    await page.locator('#planButton').click();
    await page.getByText('GDS plan failed safety verification.').waitFor();
    assert.equal(await page.locator('#planAnswer').isVisible(), false);
    planReply = safePlan;
    console.log('PASS 5: False provider-connected claim is blocked by the client');

    aiStatus = 503;
    aiReply = { ok: false, message: 'AI demo service unavailable. No booking occurred.' };
    await page.locator('#aiButton').click();
    await page.getByText('AI demo service unavailable. No booking occurred.').waitFor();
    assert.equal(await page.locator('#aiAnswer').isVisible(), false);
    aiStatus = 200;
    aiReply = safeAI;
    console.log('PASS 6: Service failure shows a safe error without an AI answer');

    const callsBeforeInput = edgeCalls.length;
    await page.locator('#aiQuestion').fill('Contact me at user@example.com');
    await page.locator('#aiButton').click();
    await page.getByText('Use a short question without personal details', { exact: false }).waitFor();
    assert.equal(edgeCalls.length, callsBeforeInput);
    console.log('PASS 7: Personal contact details are rejected before handoff');

    activeReviewer = false;
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#login:not(.hidden)').waitFor();
    assert.equal(await page.locator('#workspace').isVisible(), false);
    assert.equal(edgeCalls.length, callsBeforeInput, 'No new calls after reviewer access is revoked');
    assert.equal(pageErrors.length, 0, pageErrors.join('\n'));
    console.log('PASS 8: Unapproved reviewer is denied access before any AI request');

    assert(edgeCalls.every(c => c.path.startsWith('/functions/v1/')));
    console.log('RESULT: 8/8 real-browser staff handoff tests passed with mocked Supabase.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(e => {
  console.error('HANDOFF BROWSER TEST FAILED:', e.stack || e);
  process.exitCode = 1;
});
