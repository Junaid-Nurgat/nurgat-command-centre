'use strict';
// Browser QA for the real Lite HTML; every Supabase request is mocked.
// No production credentials, customer data, GDS, or database writes.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const { chromium } = require('playwright');

const REVIEWER_ID = '00000000-0000-4000-8000-000000000001';
const BASE = 'https://ysakhagnlmhwbbmetjjc.supabase.co';
const jsonHeaders = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-allow-headers': 'authorization, apikey, content-type, prefer'
};
const demoFlights = {
  ok: true, mode: 'FICTIONAL_DEMO_ONLY', providerConnected: false,
  fareVerified: false, customerSendAllowed: false, bookingAvailable: false,
  ticketIssuanceAllowed: false,
  offers: [
    { id: 'DEMO-A', airline: 'Sample Air A', currency: 'USD', illustrativeTotal: 650, durationMinutes: 1100, stops: 1 },
    { id: 'DEMO-B', airline: 'Sample Air B', currency: 'USD', illustrativeTotal: 735, durationMinutes: 870, stops: 1 },
    { id: 'DEMO-C', airline: 'Sample Air C', currency: 'USD', illustrativeTotal: 890, durationMinutes: 500, stops: 0 }
  ]
};

(async () => {
  const html = fs.readFileSync('index.html');
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    const records = [];
    let postCount = 0;
    let failCheckOnce = false, malformedCheckOnce = false;
    let failBeforeWriteOnce = false, failAfterWriteOnce = false;
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on('pageerror', err => { console.error('PAGE ERROR:', err.message); });
    await page.addInitScript(() => {
      sessionStorage.setItem('nurgat-auth-v2', JSON.stringify({ access_token: 'FICTIONAL_LOCAL_TEST_TOKEN', refresh_token: 'FICTIONAL_LOCAL_REFRESH' }));
    });
    await page.route(`${BASE}/**`, async route => {
      const req = route.request();
      const url = new URL(req.url());
      const method = req.method();
      const reply = (data, status = 200) => route.fulfill({ status, headers: jsonHeaders, body: JSON.stringify(data) });
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: jsonHeaders });
      if (url.pathname === '/auth/v1/user' && method === 'GET') return reply({ id: REVIEWER_ID });
      if (url.pathname === '/rest/v1/approval_reviewers' && method === 'GET') return reply([{ user_id: REVIEWER_ID }]);
      if (url.pathname === '/functions/v1/nurgat-flight-research-demo' && method === 'POST') return reply(demoFlights);
      if (url.pathname === '/rest/v1/lite_saved_requests') {
        if (method === 'GET') {
          const filter = url.searchParams.get('id');
          if (filter?.startsWith('eq.') && failCheckOnce) {
            failCheckOnce = false;
            return route.abort('failed');
          }
          if (filter?.startsWith('eq.') && malformedCheckOnce) {
            malformedCheckOnce = false;
            return reply({ unexpected: 'not a list' });
          }
          const rows = filter?.startsWith('eq.') ? records.filter(r => r.id === filter.slice(3)) : records;
          return reply(rows.slice().sort((a,b) => b.created_at.localeCompare(a.created_at)));
        }
        if (method === 'POST') {
          const row = req.postDataJSON();
          if (failBeforeWriteOnce) {
            failBeforeWriteOnce = false;
            return route.abort('failed');
          }
          if (records.some(r => r.id === row.id)) return reply({ message: 'Duplicate ID' }, 409);
          postCount++;
          records.push({ ...row, created_at: new Date().toISOString() });
          if (failAfterWriteOnce) {
            failAfterWriteOnce = false;
            return route.abort('failed'); // The database saved it, but the browser lost the response.
          }
          return reply({});
        }
      }
      throw new Error(`Unexpected Supabase request: ${method} ${url.pathname}`);
    });

    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#workspace:not(.hidden)').waitFor();
    assert.equal(await page.locator('#login').isVisible(), false);
    console.log('PASS 1: Staff workspace opens with mocked authentication');

    await page.locator('#tabSaved').click();
    await page.locator('#step-saved:not(.hidden)').waitFor();
    await page.locator('#refreshSaved').click();
    await page.getByText('No saved requests yet.').waitFor();
    console.log('PASS 2: Saved navigation and list refresh work');

    await page.locator('[data-tab="search"]').click();
    await page.locator('#searchButton').click();
    await page.locator('#offers .offer').first().waitFor();
    const sample = page.locator('#offers .offer').filter({ hasText: 'Sample Air B' });
    await sample.getByRole('button', { name: 'Select this sample' }).click();
    await page.locator('[data-tab="results"]').click();
    await page.locator('#markupExact').fill('125');
    await page.locator('#markupExact').dispatchEvent('change');
    await page.locator('[data-tab="quote"]').click();
    await page.locator('#makeQuote').click();
    await page.locator('#reviewQuote').click();
    assert.match(await page.locator('#quotePreview').innerText(), /USD 860/);
    assert.match(await page.locator('#quotePreview').innerText(), /REVIEWED DEMO ONLY/);
    assert.match(await page.locator('#quotePreview').innerText(), /CUSTOMER DELIVERY: LOCKED/);
    console.log('PASS 3: USD 860 fictional quote reviewed; customer sending locked');

    await page.locator('#saveRequest').dblclick();
    await page.getByText('Saved to your account.', { exact: false }).waitFor();
    await page.locator('#saveRequest').click();
    await page.locator('[data-tab="saved"]').click();
    await page.locator('#refreshSaved').click();
    await page.getByText('1 saved snapshot(s).').waitFor();
    assert.equal(await page.locator('#savedList article.offer').count(), 1);
    assert.equal(records.length, 1);
    assert.equal(postCount, 1, 'Identical repeated saves must POST only once');
    assert.equal(records[0].markup, 125);
    assert.equal(records[0].selected_id, 'DEMO-B');
    assert.equal(records[0].has_draft, true);
    console.log('PASS 4: Double-click plus repeat makes exactly one saved snapshot');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#workspace:not(.hidden)').waitFor();
    await page.locator('#tabSaved').click();
    await page.locator('#savedList article.offer').first().waitFor();
    assert.equal(await page.locator('#savedList article.offer').count(), 1);
    await page.locator('#savedList article.offer').first().getByRole('button', { name: 'Reopen' }).click();
    await page.locator('#quotePreview:not(.hidden)').waitFor();
    const reopenedText = await page.locator('#quotePreview').innerText();
    assert.match(reopenedText, /UNREVIEWED DEMO/);
    assert.match(reopenedText, /CUSTOMER DELIVERY: LOCKED/);
    assert.equal(postCount, 1);
    console.log('PASS 5: Saved draft survives refresh; demo review resets safely');

    // On reopening, the draft is intentionally unreviewed. Test failures without losing on-screen work.
    failCheckOnce = true;
    await page.locator('#saveRequest').click();
    await page.getByText('Could not verify saved status.', { exact: false }).waitFor();
    assert.equal(records.length, 1, 'Failed status lookup must never trigger a write');
    assert.match(await page.locator('#quotePreview').innerText(), /UNREVIEWED DEMO/);
    await page.locator('#saveRequest').click();
    await page.getByText('Saved to your account.', { exact: false }).waitFor();
    assert.equal(records.length, 2);
    assert.equal(postCount, 2);
    console.log('PASS 6: Failed save-status lookup preserves draft and retries safely');

    // Unexpected JSON is not an empty list: fail closed rather than create an unverified duplicate.
    await page.locator('[data-tab="results"]').click();
    await page.locator('#markupExact').fill('130');
    await page.locator('#markupExact').dispatchEvent('change');
    await page.locator('[data-tab="quote"]').click();
    await page.locator('#makeQuote').click();
    malformedCheckOnce = true;
    await page.locator('#saveRequest').click();
    await page.getByText('Could not verify saved status.', { exact: false }).waitFor();
    assert.equal(records.length, 2);
    await page.locator('#saveRequest').click();
    await page.getByText('Saved to your account.', { exact: false }).waitFor();
    assert.equal(records.length, 3);
    console.log('PASS 7: Unexpected status payload causes no write and safe retry');

    // A failed POST before server commit must leave the current draft available to retry.
    await page.locator('[data-tab="results"]').click();
    await page.locator('#markupExact').fill('140');
    await page.locator('#markupExact').dispatchEvent('change');
    await page.locator('[data-tab="quote"]').click();
    await page.locator('#makeQuote').click();
    failBeforeWriteOnce = true;
    await page.locator('#saveRequest').click();
    await page.getByText('Save could not be confirmed.', { exact: false }).waitFor();
    assert.equal(records.length, 3);
    await page.locator('#saveRequest').click();
    await page.getByText('Saved to your account.', { exact: false }).waitFor();
    assert.equal(records.length, 4);
    console.log('PASS 8: Write failed before commit; retry saves exactly one copy');

    // A lost response AFTER the server committed is the risky case: retry must reuse its ID.
    await page.locator('[data-tab="results"]').click();
    await page.locator('#markupExact').fill('150');
    await page.locator('#markupExact').dispatchEvent('change');
    await page.locator('[data-tab="quote"]').click();
    await page.locator('#makeQuote').click();
    failAfterWriteOnce = true;
    await page.locator('#saveRequest').click();
    await page.getByText('Save could not be confirmed.', { exact: false }).waitFor();
    assert.equal(records.length, 5, 'Mock server committed despite lost response');
    const countAfterLostResponse = postCount;
    await page.locator('#saveRequest').click();
    await page.getByText('Saved to your account.', { exact: false }).waitFor();
    assert.equal(records.length, 5, 'Retry cannot create another record');
    assert.equal(postCount, countAfterLostResponse, 'Retry must not POST again');
    console.log('PASS 9: Lost response after commit recovered without duplicate POST');

    console.log('RESULT: 9/9 real-browser tests passed with mocked Supabase.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(e => { console.error('BROWSER TEST FAILED:', e.stack || e); process.exitCode = 1; });
