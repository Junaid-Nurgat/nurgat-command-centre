'use strict';
// Browser tests for the local demo issue monitor. All remote traffic is mocked.
// No real customer data, credentials, n8n executions, or live GDS traffic.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const {chromium}=require('playwright');

const BASE='https://ysakhagnlmhwbbmetjjc.supabase.co';
const STAFF='00000000-0000-4000-8000-000000000001';
const HEADERS={
 'content-type':'application/json','access-control-allow-origin':'*',
 'access-control-allow-methods':'GET,POST,OPTIONS',
 'access-control-allow-headers':'authorization,apikey,content-type'
};
const safe={
 ok:true,mode:'FICTIONAL_DEMO_ONLY',providerConnected:false,fareVerified:false,
 customerSendAllowed:false,bookingAvailable:false,ticketIssuanceAllowed:false,
 offers:[
  {id:'DEMO-A',airline:'Sample Air A',currency:'USD',illustrativeTotal:650,durationMinutes:1100,stops:1},
  {id:'DEMO-B',airline:'Sample Air B',currency:'USD',illustrativeTotal:735,durationMinutes:870,stops:1},
  {id:'DEMO-C',airline:'Sample Air C',currency:'USD',illustrativeTotal:890,durationMinutes:500,stops:0}
 ]
};
(async()=>{
 const server=http.createServer((_req,res)=>{
  res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
  res.end(fs.readFileSync('index.html'));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage(),pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.addInitScript(()=>{
   sessionStorage.setItem('nurgat-auth-v2',JSON.stringify({
    access_token:'FAKE_MONITOR_ACCESS_TOKEN',refresh_token:'FAKE_MONITOR_REFRESH'
   }));
  });
  const records=[];
  let demoStatus=200,failLookup=false,searchRequests=0,savedWrites=0;
  await page.route(BASE+'/**',async route=>{
   const req=route.request(),url=new URL(req.url());
   const reply=(data,code=200)=>route.fulfill({status:code,headers:HEADERS,body:JSON.stringify(data)});
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:HEADERS});
   if(url.pathname==='/auth/v1/user')return reply({id:STAFF});
   if(url.pathname==='/rest/v1/approval_reviewers')return reply([{user_id:STAFF}]);
   assert.equal(req.headers().authorization,'Bearer FAKE_MONITOR_ACCESS_TOKEN');
   if(url.pathname==='/auth/v1/logout')return reply({});
   if(url.pathname==='/functions/v1/nurgat-flight-research-demo'){
    assert.equal(req.method(),'POST');searchRequests++;
    return reply(demoStatus===200?safe:{message:'Unsafe upstream diagnostic SHOULD NOT appear in issue monitor'},demoStatus);
   }
   if(url.pathname==='/rest/v1/lite_saved_requests'){
    if(req.method()==='GET'){
     if(failLookup){failLookup=false;return route.abort('failed')}
     const id=url.searchParams.get('id')?.replace(/^eq\./,'');
     return reply(records.filter(x=>x.id===id).map(x=>({id:x.id})));
    }
    assert.equal(req.method(),'POST');
    const body=req.postDataJSON();
    assert.equal(body.demo_only,true);
    assert.equal(body.has_draft,true);
    assert.equal(body.customerName,undefined);
    records.push(body);savedWrites++;
    return reply({});
   }
   throw Error('Unexpected mock request: '+url.pathname);
  });

  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#workspace:not(.hidden)').waitFor();
  assert.equal(await page.locator('#demoIssueBanner').isVisible(),false);
  await page.locator('[data-tab="monitor"]').click();
  assert.match(await page.locator('#monitorStatus').innerText(),/No issues noticed in this browser session/);
  assert.match(await page.locator('#step-monitor').innerText(),/not a live n8n monitoring feed/);
  assert.equal(await page.locator('#clearMonitorIssues').isDisabled(),true);
  console.log('PASS 1: Monitor explicitly identifies a browser-only demo session, not live n8n status');

  demoStatus=503;
  await page.locator('[data-tab="search"]').click();
  await page.locator('#searchButton').click();
  await page.getByText('Fictional workflow needs attention',{exact:false}).waitFor();
  assert.equal(await page.locator('#demoIssueCount').innerText(),'1');
  await page.locator('#viewDemoIssues').click();
  assert.equal(await page.locator('#monitorIssues article').count(),1);
  assert.match(await page.locator('#monitorIssues').innerText(),/Fictional search issue/);
  const visibleIssues=await page.locator('#monitorIssues').innerText();
  assert.doesNotMatch(visibleIssues,/Unsafe upstream diagnostic|FAKE_MONITOR_ACCESS_TOKEN|Bearer|customer/i);
  console.log('PASS 2: Search failure automatically raises a safe, redacted staff issue notice');

  await page.locator('#clearMonitorIssues').click();
  assert.equal(await page.locator('#monitorIssues article').count(),0);
  assert.equal(await page.locator('#demoIssueBanner').isVisible(),false);
  assert.equal(await page.locator('#clearMonitorIssues').isDisabled(),true);
  console.log('PASS 3: Clearing local notices resets the banner without backend writes');

  demoStatus=200;failLookup=true;
  await page.locator('[data-tab="search"]').click();
  await page.locator('#autoDraft').click();
  await page.getByText('automatic saving was not confirmed.',{exact:false}).waitFor();
  assert.equal(await page.locator('#quotePreview').isVisible(),true);
  assert.match(await page.locator('#quotePreview').innerText(),/UNREVIEWED DEMO/);
  assert.equal(await page.locator('#demoIssueCount').innerText(),'1');
  assert.equal(records.length,0);
  await page.locator('#viewDemoIssues').click();
  assert.match(await page.locator('#monitorIssues').innerText(),/Fictional save issue/);
  assert.doesNotMatch(await page.locator('#monitorIssues').innerText(),/FAKE_MONITOR_ACCESS_TOKEN|Bearer/);
  console.log('PASS 4: Autosave lookup failure raises safe issue while preserving unreviewed draft');

  await page.locator('#saveRequest').click();
  await page.getByText('Saved to your account.',{exact:false}).waitFor();
  assert.equal(records.length,1);
  assert.equal(savedWrites,1);
  assert.equal(searchRequests,2);
  console.log('PASS 5: Staff can retry saving; monitoring never changes saved data or approvals');

  await page.locator('#logout').click();
  await page.locator('#login:not(.hidden)').waitFor();
  assert.equal(await page.locator('#demoIssueBanner').isVisible(),false);
  assert.equal(await page.locator('#monitorIssues article').count(),0);
  console.log('PASS 6: Logging out clears staff-session-only issue notices');

  assert.deepEqual(pageErrors,[]);
  console.log('RESULT: 6/6 staff-session demo monitoring browser tests passed.');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error('DEMO MONITOR TEST FAILED:',e.stack||e);process.exitCode=1});
