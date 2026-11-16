'use strict';
// Staff UI tests for a read-only monitoring bridge (mocked Supabase, no real key).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const {chromium}=require('playwright');
const BASE='https://ysakhagnlmhwbbmetjjc.supabase.co';
const STAFF='00000000-0000-4000-8000-000000000001';
const H={
 'content-type':'application/json',
 'access-control-allow-origin':'*',
 'access-control-allow-methods':'GET,POST,OPTIONS',
 'access-control-allow-headers':'authorization,apikey,content-type'
};
const safe={
 ok:true,mode:'READ_ONLY_MONITOR',connected:true,hasSnapshot:true,
 checkedAt:'2026-11-16T06:00:01.990Z',fresh:true,
 failures24h:0,unreviewedIncidents:0,knownTestEvents:3,
 noCustomerData:true,actionsAllowed:false,
 error_summary:'PRIVATE RAW ERROR NEVER DISPLAY'
};
(async()=>{
 const server=http.createServer((_req,res)=>{
  res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(fs.readFileSync('index.html'));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.addInitScript(()=>{
   sessionStorage.setItem('nurgat-auth-v2',JSON.stringify({
    access_token:'FAKE_STAFF_READONLY_MONITOR_TOKEN',refresh_token:'FAKE_REFRESH'
   }));
  });
  let code=503,result={ok:false,code:'MONITOR_NOT_CONNECTED'},reads=0;
  await page.route(BASE+'/**',async route=>{
   const request=route.request(),url=new URL(request.url());
   const reply=(body,status=200)=>route.fulfill({status,headers:H,body:JSON.stringify(body)});
   if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:H});
   if(url.pathname==='/auth/v1/user')return reply({id:STAFF});
   if(url.pathname==='/rest/v1/approval_reviewers')return reply([{user_id:STAFF}]);
   if(url.pathname==='/auth/v1/logout')return reply({});
   assert.equal(url.pathname,'/functions/v1/nurgat-monitor-readonly');
   assert.equal(request.method(),'GET');
   assert.equal(request.headers().authorization,'Bearer FAKE_STAFF_READONLY_MONITOR_TOKEN');
   assert.equal(request.postData(),null,'no body, no passenger info');
   reads++;
   return reply(result,code);
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#workspace:not(.hidden)').waitFor();
  assert.equal(reads,0);
  console.log('PASS 1: Read-only n8n data is never requested before staff opens Issues');

  await page.locator('[data-tab="monitor"]').click();
  await page.getByText('Secure n8n snapshot unavailable or not connected.',{exact:false}).waitFor();
  assert.equal(reads,1);
  assert.equal(await page.locator('#n8nSnapshotSummary').isVisible(),false);
  console.log('PASS 2: Missing server credential is clearly unavailable; no invented health values');

  code=200;result=safe;
  await page.locator('#refreshN8nSnapshot').click();
  await page.getByText('Read-only n8n daily snapshot retrieved.',{exact:false}).waitFor();
  const summary=await page.locator('#n8nSnapshotSummary').innerText();
  assert.match(summary,/Unreviewed incidents in snapshot: 0/);
  assert.match(summary,/Known test events: 3/);
  assert.doesNotMatch(summary,/PRIVATE RAW ERROR|FAKE_STAFF_READONLY_MONITOR_TOKEN/);
  assert.match(await page.locator('#n8nReadOnlySnapshot').innerText(),/not a live all-clear/);
  console.log('PASS 3: Staff sees only whitelisted counts and a clear last-snapshot caveat');

  result={...safe,fresh:false};
  await page.locator('#refreshN8nSnapshot').click();
  await page.getByText('STaLE or dated incorrectly.',{exact:false}).waitFor();
  assert.equal(await page.locator('#n8nSnapshotSummary').isVisible(),true);
  console.log('PASS 4: Outdated data is explicitly stale instead of falsely reassuring');

  result={ok:true,mode:'READ_ONLY_MONITOR',connected:true,hasSnapshot:false,noCustomerData:true,actionsAllowed:false};
  await page.locator('#refreshN8nSnapshot').click();
  await page.getByText('no daily snapshot has been recorded yet.',{exact:false}).waitFor();
  assert.equal(await page.locator('#n8nSnapshotSummary').isVisible(),false);
  console.log('PASS 5: Empty upstream data never appears as a healthy zero-incident report');

  result={...safe,actionsAllowed:true};
  await page.locator('#refreshN8nSnapshot').click();
  await page.getByText('Monitoring response did not pass safety checks.',{exact:false}).waitFor();
  assert.equal(await page.locator('#n8nSnapshotSummary').isVisible(),false);
  console.log('PASS 6: Unsafe monitoring permissions or malformed contract are rejected');

  code=403;result={ok:false,code:'MONITOR_REVIEWER_REQUIRED'};
  await page.locator('#refreshN8nSnapshot').click();
  await page.getByText('Not authorized to view monitoring.',{exact:false}).waitFor();
  assert.equal(await page.locator('#n8nSnapshotSummary').isVisible(),false);
  console.log('PASS 7: Reviewer authorization failures never expose previously displayed counts');

  await page.locator('#logout').click();
  await page.locator('#login:not(.hidden)').waitFor();
  assert.equal(await page.locator('#n8nSnapshotSummary').isVisible(),false);
  assert.match(await page.locator('#n8nSnapshotStatus').textContent(),/Sign in to check/);
  assert.deepEqual(errors,[]);
  console.log('PASS 8: Logout clears any cached UI snapshot; no JS errors');

  console.log('RESULT: 8/8 read-only live-monitor UI browser tests passed.');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(err=>{console.error('MONITOR UI TEST FAILED:',err.stack||err);process.exitCode=1});
