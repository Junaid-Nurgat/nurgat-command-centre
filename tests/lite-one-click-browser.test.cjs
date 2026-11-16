'use strict';
// One-click quotation drafting QA for the actual Command Centre HTML.
// All Supabase requests are intercepted. No live provider, customer, or n8n use.
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const {chromium}=require('playwright');

const BASE='https://ysakhagnlmhwbbmetjjc.supabase.co';
const reviewerId='00000000-0000-4000-8000-000000000001';
const headers={
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
  const page=await browser.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.addInitScript(()=>{
   sessionStorage.setItem('nurgat-auth-v2',JSON.stringify({
    access_token:'FAKE_ISOLATED_STAFF_ACCESS',refresh_token:'FAKE_ISOLATED_REFRESH'
   }));
  });
  const calls=[],snapshots=[];
  let posts=0,failCheckOnce=false,failWriteAfterCommitOnce=false;
  let response=safe,status=200,delayMs=0;
  await page.route(BASE+'/**',async route=>{
   const req=route.request(),url=new URL(req.url());
   const reply=(data,code=200)=>route.fulfill({status:code,headers,body:JSON.stringify(data)});
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(url.pathname==='/auth/v1/user')return reply({id:reviewerId});
   if(url.pathname==='/rest/v1/approval_reviewers')return reply([{user_id:reviewerId}]);
   if(url.pathname==='/rest/v1/lite_saved_requests'){
    assert.equal(req.headers().authorization,'Bearer FAKE_ISOLATED_STAFF_ACCESS');
    if(req.method()==='GET'){
     if(failCheckOnce){failCheckOnce=false;return route.abort('failed')}
     const idFilter=url.searchParams.get('id');
     if(idFilter?.startsWith('eq.'))return reply(snapshots.filter(x=>x.id===idFilter.slice(3)).map(x=>({id:x.id})));
     return reply(snapshots);
    }
    assert.equal(req.method(),'POST');
    const row=req.postDataJSON();
    assert.equal(row.demo_only,true);
    assert.equal(row.has_draft,true);
    assert.equal(typeof row.id,'string');
    assert.equal('customerName' in row,false);
    assert.equal('staffToken' in row,false);
    assert.equal(snapshots.some(x=>x.id===row.id),false,'same snapshot should not POST twice');
    snapshots.push(row);posts++;
    if(failWriteAfterCommitOnce){failWriteAfterCommitOnce=false;return route.abort('failed')}
    return reply({});
   }
   assert.equal(url.pathname,'/functions/v1/nurgat-flight-research-demo');
   assert.equal(req.method(),'POST');
   assert.equal(req.headers().authorization,'Bearer FAKE_ISOLATED_STAFF_ACCESS');
   const body=req.postDataJSON();
   assert.equal(body.origin,'LUN');
   assert.equal(body.destination,'DXB');
   assert.equal(JSON.stringify(body).includes('customerName'),false);
   calls.push(body);
   const captured=response,capturedStatus=status,capturedDelay=delayMs;
   if(capturedDelay)await new Promise(resolve=>setTimeout(resolve,capturedDelay));
   return reply(captured,capturedStatus);
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#workspace:not(.hidden)').waitFor();
  await page.locator('#autoDraft').click();
  await page.locator('#quotePreview:not(.hidden)').waitFor();
  await page.getByText('Auto-saved a FICTIONAL request snapshot.',{exact:false}).waitFor();
  assert.equal(calls.length,1,'one click should make one search');
  assert.equal(snapshots.length,1,'one click should also save the snapshot');
  assert.equal(posts,1);
  assert.equal(snapshots[0].selected_id,'DEMO-C');
  assert.equal(snapshots[0].demo_only,true);
  assert.match(await page.locator('#quotePreview').innerText(),/Sample Air C/);
  assert.match(await page.locator('#quotePreview').innerText(),/FICTIONAL FLIGHT — NOT A CUSTOMER QUOTE/);
  assert.match(await page.locator('#quotePreview').innerText(),/CUSTOMER DELIVERY: LOCKED. BOOKING: DISABLED./);
  assert.match(await page.locator('#quotePreview').innerText(),/UNREVIEWED DEMO/);
  assert.equal(await page.locator('#reviewQuote').isEnabled(),true);
  console.log('PASS 1: One click prepares and auto-saves an unreviewed, non-sendable fictional draft');

  await page.locator('#saveRequest').click();
  await page.getByText('Saved to your account.',{exact:false}).waitFor();
  assert.equal(posts,1);
  assert.equal(snapshots.length,1);
  console.log('PASS 2: Manual Save on the same fictional snapshot does not create duplicate rows');

  await page.locator('#reviewQuote').click();
  assert.match(await page.locator('#quotePreview').innerText(),/REVIEWED DEMO ONLY/);
  assert.match(await page.locator('#quotePreview').innerText(),/CUSTOMER DELIVERY: LOCKED/);
  assert.equal(snapshots[0].reviewed,undefined);
  console.log('PASS 3: Manual review remains separate, not persisted and never unlocks customer sending');

  await page.locator('[data-tab="search"]').click();
  await page.locator('#preference').selectOption('CHEAPEST');
  await page.locator('#autoDraft').click();
  await page.locator('#quotePreview:not(.hidden)').waitFor();
  await page.getByText('Auto-saved a FICTIONAL request snapshot.',{exact:false}).waitFor();
  assert.equal(calls.length,2);
  assert.equal(snapshots.length,2);
  assert.equal(snapshots[1].selected_id,'DEMO-A');
  assert.match(await page.locator('#quotePreview').innerText(),/Sample Air A/);
  assert.match(await page.locator('#quotePreview').innerText(),/UNREVIEWED DEMO/);
  console.log('PASS 4: Changing preference auto-saves a distinct sample and resets review');

  response={...safe,bookingAvailable:true};
  await page.locator('[data-tab="search"]').click();
  await page.locator('#preference').selectOption('FASTEST');
  await page.locator('#autoDraft').click();
  await page.getByText('Demo backend response did not pass safety checks.',{exact:false}).waitFor();
  assert.equal(await page.locator('#quotePreview').isVisible(),false);
  assert.equal(calls.length,3);
  assert.equal(await page.locator('#autoDraft').isEnabled(),true);
  assert.equal(snapshots.length,2);
  console.log('PASS 5: Unsafe server response fails closed with no draft or saved snapshot');

  response=safe;status=503;
  await page.locator('#autoDraft').click();
  await page.getByText('Request failed (503)',{exact:false}).waitFor();
  assert.equal(calls.length,4);
  assert.equal(await page.locator('#quotePreview').isVisible(),false);
  assert.equal(await page.locator('#autoDraft').isEnabled(),true);
  assert.equal(snapshots.length,2);
  console.log('PASS 6: Search outage leaves no draft or snapshot; control can be retried');

  status=200;delayMs=300;
  const before=calls.length;
  await page.locator('#autoDraft').click();
  await page.locator('#autoDraft:disabled').waitFor();
  await page.locator('#destination').fill('JNB');
  await page.locator('#destination').fill('DXB');
  await page.waitForTimeout(450);
  assert.equal(calls.length,before+1);
  assert.equal(await page.locator('#quotePreview').isVisible(),false);
  assert.equal(await page.locator('#autoDraft').isEnabled(),true);
  assert.equal(snapshots.length,2);
  console.log('PASS 7: Mid-search trip edits cancel stale drafts and database writes');

  delayMs=0;status=200;response=safe;
  failCheckOnce=true;
  await page.locator('#autoDraft').click();
  await page.getByText('Could not verify saved status.',{exact:false}).waitFor();
  await page.getByText('automatic saving was not confirmed.',{exact:false}).waitFor();
  assert.equal(await page.locator('#quotePreview').isVisible(),true);
  assert.match(await page.locator('#quotePreview').innerText(),/UNREVIEWED DEMO/);
  assert.equal(snapshots.length,2);
  console.log('PASS 8: Autosave lookup failure leaves the unreviewed draft and no database write');

  await page.locator('#saveRequest').click();
  await page.getByText('Saved to your account.',{exact:false}).waitFor();
  assert.equal(snapshots.length,3);
  assert.equal(snapshots[2].selected_id,'DEMO-C');
  console.log('PASS 9: Staff can retry an autosave failure manually without losing the draft');

  await page.locator('[data-tab="search"]').click();
  await page.locator('#preference').selectOption('FEWEST_STOPS');
  failWriteAfterCommitOnce=true;
  const beforeLostWrite=posts;
  await page.locator('#autoDraft').click();
  await page.getByText('Save could not be confirmed.',{exact:false}).waitFor();
  assert.equal(snapshots.length,4,'server committed one row before reply was lost');
  assert.equal(posts,beforeLostWrite+1);
  assert.equal(await page.locator('#quotePreview').isVisible(),true);
  await page.locator('#saveRequest').click();
  await page.getByText('Saved to your account.',{exact:false}).waitFor();
  assert.equal(snapshots.length,4);
  assert.equal(posts,beforeLostWrite+1);
  console.log('PASS 10: Lost POST reply retry finds the original saved UUID; no duplicate');

  assert.deepEqual(pageErrors,[]);
  console.log('RESULT: 10/10 one-click auto-save browser tests passed.');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error('ONE-CLICK TEST FAILED:',e.stack||e);process.exitCode=1});
