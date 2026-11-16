'use strict';
// Mock-only fictional inbox integration tests for the actual staff Command Centre HTML.
// Every Supabase call is intercepted. No real messages, people, GDS, n8n, or bookings.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const {chromium}=require('playwright');
const BASE='https://ysakhagnlmhwbbmetjjc.supabase.co';
const staff='00000000-0000-4000-8000-000000000001';
const headers={
 'content-type':'application/json',
 'access-control-allow-origin':'*',
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
  page.on('pageerror',err=>pageErrors.push(err.message));
  await page.addInitScript(()=>{
   sessionStorage.setItem('nurgat-auth-v2',JSON.stringify({
    access_token:'FAKE_DEMO_INBOX_SESSION',refresh_token:'FAKE_REFRESH'
   }));
  });
  const searches=[],rows=[];
  let response=safe,searchStatus=200,searchDelay=0,postCount=0,lostPostReply=false;
  await page.route(BASE+'/**',async route=>{
   const req=route.request(),url=new URL(req.url());
   const reply=(v,status=200)=>route.fulfill({status,headers,body:JSON.stringify(v)});
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(url.pathname==='/auth/v1/user')return reply({id:staff});
   if(url.pathname==='/rest/v1/approval_reviewers')return reply([{user_id:staff}]);
   assert.equal(req.headers().authorization,'Bearer FAKE_DEMO_INBOX_SESSION');
   if(url.pathname==='/rest/v1/lite_saved_requests'){
    if(req.method()==='GET'){
     const filter=url.searchParams.get('id');
     if(filter?.startsWith('eq.'))return reply(rows.filter(x=>x.id===filter.slice(3)).map(x=>({id:x.id})));
     return reply(rows);
    }
    assert.equal(req.method(),'POST');
    const row=req.postDataJSON();
    assert.equal(row.demo_only,true);
    assert.equal(row.has_draft,true);
    assert.equal(row.reviewed,undefined);
    assert.equal(row.customerName,undefined);
    assert.equal(row.phone,undefined);
    assert.equal(rows.some(x=>x.id===row.id),false,'No duplicate UUID writes');
    rows.push(row);postCount++;
    if(lostPostReply){lostPostReply=false;return route.abort('failed')}
    return reply({});
   }
   assert.equal(url.pathname,'/functions/v1/nurgat-flight-research-demo');
   assert.equal(req.method(),'POST');
   const body=req.postDataJSON();
   assert.equal(typeof body.origin,'string');
   assert.equal(typeof body.destination,'string');
   assert.equal(body.customerName,undefined);
   assert.equal(body.email,undefined);
   assert.equal(body.phone,undefined);
   searches.push(body);
   const capturedResponse=response,capturedStatus=searchStatus,capturedDelay=searchDelay;
   if(capturedDelay)await new Promise(resolve=>setTimeout(resolve,capturedDelay));
   return reply(capturedResponse,capturedStatus);
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#workspace:not(.hidden)').waitFor();
  assert.equal(await page.locator('#demoEnquiryList [data-demo-enquiry]').count(),2);
  assert.match(await page.locator('#fictionalInbox').innerText(),/NOT customer messages/);
  console.log('PASS 1: Clearly labeled mock inbox displays only two built-in fictional samples');

  await page.locator('[data-demo-enquiry="DEMO-INBOX-1"]').click();
  await page.getByText('Fictional draft prepared and request snapshot auto-saved.',{exact:false}).waitFor();
  assert.equal(searches.length,1);
  assert.deepEqual({origin:searches[0].origin,destination:searches[0].destination,tripType:searches[0].tripType,adults:searches[0].adults,returnDate:searches[0].returnDate},
   {origin:'LUN',destination:'DXB',tripType:'ONE_WAY',adults:1,returnDate:null});
  assert.equal(rows.length,1);
  assert.equal(rows[0].selected_id,'DEMO-C');
  assert.match(await page.locator('#quotePreview').innerText(),/UNREVIEWED DEMO/);
  assert.match(await page.locator('#quotePreview').innerText(),/CUSTOMER DELIVERY: LOCKED. BOOKING: DISABLED/);
  console.log('PASS 2: One click turns fictional enquiry into safe unreviewed saved quote');

  await page.locator('[data-tab="search"]').click();
  assert.equal(await page.locator('[data-demo-enquiry="DEMO-INBOX-1"]').isDisabled(),true);
  await page.locator('#saveRequest').click();
  await page.getByText('Saved to your account.',{exact:false}).waitFor();
  assert.equal(rows.length,1);
  assert.equal(postCount,1);
  console.log('PASS 3: Processed fixture is disabled; repeated manual Save is idempotent');

  await page.locator('[data-demo-enquiry="DEMO-INBOX-2"]').click();
  await page.getByText('Fictional draft prepared and request snapshot auto-saved.',{exact:false}).waitFor();
  assert.equal(searches.length,2);
  assert.equal(searches[1].origin,'LUN');
  assert.equal(searches[1].destination,'JNB');
  assert.equal(searches[1].tripType,'ROUND_TRIP');
  assert.equal(searches[1].adults,2);
  assert.ok(searches[1].returnDate>searches[1].departureDate);
  assert.equal(searches[1].preference,'CHEAPEST');
  assert.equal(rows.length,2);
  assert.equal(rows[1].selected_id,'DEMO-A');
  assert.equal(rows[1].markup,0);
  assert.match(await page.locator('#quotePreview').innerText(),/UNREVIEWED DEMO/);
  console.log('PASS 4: Round-trip sample fills distinct values, resets markup and auto-saves');

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#workspace:not(.hidden)').waitFor();
  response={...safe,bookingAvailable:true};
  await page.locator('[data-demo-enquiry="DEMO-INBOX-1"]').click();
  await page.getByText('Demo backend response did not pass safety checks.',{exact:false}).waitFor();
  await page.getByText('Fictional example could not be fully saved.',{exact:false}).waitFor();
  assert.equal(rows.length,2);
  assert.equal(await page.locator('#quotePreview').isVisible(),false);
  assert.equal(await page.locator('[data-demo-enquiry="DEMO-INBOX-1"]').isEnabled(),true);
  console.log('PASS 5: Unsafe fictional backend response yields no saved row or approved draft');

  response=safe;searchStatus=503;
  await page.locator('[data-demo-enquiry="DEMO-INBOX-1"]').click();
  await page.getByText('Request failed (503)',{exact:false}).waitFor();
  assert.equal(rows.length,2);
  assert.equal(await page.locator('#quotePreview').isVisible(),false);
  console.log('PASS 6: Search failure does not falsely process or save inbox item');

  searchStatus=200;lostPostReply=true;
  await page.locator('[data-demo-enquiry="DEMO-INBOX-1"]').click();
  await page.getByText('automatic saving was not confirmed.',{exact:false}).waitFor();
  assert.equal(rows.length,3,'server actually saved despite lost HTTP reply');
  assert.equal(await page.locator('#quotePreview').isVisible(),true);
  const countBeforeRetry=postCount;
  await page.locator('#saveRequest').click();
  await page.getByText('Saved to your account.',{exact:false}).waitFor();
  assert.equal(rows.length,3);
  assert.equal(postCount,countBeforeRetry);
  console.log('PASS 7: Lost save reply keeps draft; manual retry does not duplicate snapshot');

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#workspace:not(.hidden)').waitFor();
  searchDelay=300;
  await page.locator('[data-demo-enquiry="DEMO-INBOX-2"]').click();
  await page.locator('#destination').fill('NBO');
  await page.getByText('Fictional sample cancelled because trip details changed.',{exact:false}).waitFor();
  assert.equal(rows.length,3);
  assert.equal(await page.locator('#quotePreview').isVisible(),false);
  console.log('PASS 8: Editing trip mid-process rejects stale search and prevents database write');

  assert.deepEqual(pageErrors,[]);
  console.log('RESULT: 8/8 fictional inbox Chromium integration tests passed.');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(err=>{console.error('FICTIONAL INBOX TEST FAILED:',err.stack||err);process.exitCode=1});
