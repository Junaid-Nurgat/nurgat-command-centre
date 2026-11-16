'use strict';
// Browser QA: Supabase Auth and Edge requests are mocked, no real credentials.
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const {chromium}=require('playwright');
const BASE='https://ysakhagnlmhwbbmetjjc.supabase.co';
const OLD_JWT='FAKE_OLD_STAFF_JWT_ONLY';
const NEW_JWT='FAKE_NEW_STAFF_JWT_ONLY';
const REFRESH='FAKE_REFRESH_TOKEN_ONLY';
const headers={
  'content-type':'application/json',
  'access-control-allow-origin':'*',
  'access-control-allow-methods':'GET,POST,OPTIONS',
  'access-control-allow-headers':'apikey,authorization,content-type'
};
const success={
  ok:true,mode:'STAGING_INTERNAL_ONLY',status:'VERIFIED_STAGING_RESPONSE',
  providerConnected:false,customerSendAllowed:false,bookingAvailable:false,
  ticketIssuanceAllowed:false,
  plan:'GDS RESEARCH PLAN — NOT CONNECTED. No real bookings.'
};
(async()=>{
 const server=http.createServer((_req,res)=>{
  res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
  res.end(fs.readFileSync('staging-handoff.html'));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  await page.addInitScript(session=>{
   sessionStorage.setItem('nurgat-auth-v2',JSON.stringify(session));
  },{access_token:OLD_JWT,refresh_token:REFRESH});
  let currentResponse=success,currentStatus=200,refuseRefresh=false,rejectOnce=false,alwaysReject=false;
  let refreshCalls=0;
  const edgeCalls=[];
  await page.route(BASE+'/**',async route=>{
   const req=route.request(),url=new URL(req.url());
   const respond=(body,status=200)=>route.fulfill({status,headers,body:JSON.stringify(body)});
   assert.equal(req.method(),'POST');
   if(url.pathname==='/auth/v1/token'){
    assert.equal(url.searchParams.get('grant_type'),'refresh_token');
    assert.equal(req.headers().authorization,undefined);
    assert.equal(req.postDataJSON().refresh_token,REFRESH);
    refreshCalls++;
    if(refuseRefresh)return respond({message:'Invalid refresh token'},400);
    return respond({access_token:NEW_JWT,refresh_token:REFRESH,
      expires_at:Math.floor(Date.now()/1000)+3600});
   }
   assert.equal(url.pathname,'/functions/v1/nurgat-service-handoff-staging');
   const jwt=req.headers().authorization;
   assert([ 'Bearer '+OLD_JWT,'Bearer '+NEW_JWT ].includes(jwt));
   const body=req.postDataJSON();
   edgeCalls.push({body,jwt});
   assert.deepEqual(Object.keys(body).sort(),['request','requestId'].sort());
   assert.equal(body.request.origin,'LUN');
   assert.equal(body.request.destination,'DXB');
   assert.equal(body.request.tripType,'ONE_WAY');
   assert.equal(body.request.returnDate,null);
   assert.equal(body.request.adults,1);
   assert.equal(body.request.children,0);
   assert.equal(body.request.infants,0);
   assert.equal(typeof body.request.departureDate,'string');
   assert.equal('jwt' in body,false);
   assert(!JSON.stringify(body).includes(OLD_JWT));
   assert(!JSON.stringify(body).includes(NEW_JWT));
   assert.deepEqual(Object.keys(body.request).sort(),['origin','destination','departureDate',
    'returnDate','tripType','adults','children','infants','cabin','preference'].sort());
   if(alwaysReject||rejectOnce){
    rejectOnce=false;
    return respond({message:'Invalid JWT'},401);
   }
   return respond(currentResponse,currentStatus);
  });
  const setSession=async obj=>page.evaluate(session=>{
   sessionStorage.setItem('nurgat-auth-v2',JSON.stringify(session));
  },obj);
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#run').click();
  await page.getByText('Success: the secure fictional staging handoff',{exact:false}).waitFor();
  assert.match(await page.locator('#result').innerText(),/NOT CONNECTED/);
  assert.equal(edgeCalls.length,1);
  console.log('PASS 1: Approved fictional response displays verified staging success');
  console.log('PASS 2: Only synthetic trip fields sent; staff JWT stays in Authorization header');

  currentResponse={...success,bookingAvailable:true};
  await page.locator('#run').click();
  await page.getByText('response did not pass safety checks',{exact:false}).waitFor();
  assert.equal(await page.locator('#result').isVisible(),false);
  console.log('PASS 3: Unsafe booking response rejected and prior result hidden');

  currentResponse={ok:false,message:'Approved reviewer required.'};
  currentStatus=403;
  await page.locator('#run').click();
  await page.getByText('Approved reviewer required.',{exact:false}).waitFor();
  assert.equal(await page.locator('#result').isVisible(),false);
  assert.equal(edgeCalls.length,3);
  console.log('PASS 4: Forbidden reviewer cannot access staging result or trigger refresh');

  currentResponse=success;currentStatus=200;
  await setSession({access_token:OLD_JWT,refresh_token:REFRESH,
    expires_at:Math.floor(Date.now()/1000)-50});
  const prevCalls=edgeCalls.length;
  await page.locator('#run').click();
  await page.getByText('Success: the secure fictional staging handoff',{exact:false}).waitFor();
  assert.equal(edgeCalls.length,prevCalls+1);
  assert.equal(edgeCalls.at(-1).jwt,'Bearer '+NEW_JWT);
  assert.equal(refreshCalls,1);
  assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('nurgat-auth-v2')).access_token),NEW_JWT);
  console.log('PASS 5: Expired staff session proactively refreshed before staging request');

  await setSession({access_token:OLD_JWT,refresh_token:REFRESH});
  const prev401=edgeCalls.length;
  rejectOnce=true;
  await page.locator('#run').click();
  await page.getByText('Success: the secure fictional staging handoff',{exact:false}).waitFor();
  assert.deepEqual(edgeCalls.slice(prev401).map(x=>x.jwt),['Bearer '+OLD_JWT,'Bearer '+NEW_JWT]);
  assert.equal(refreshCalls,2);
  console.log('PASS 6: One Invalid JWT response refreshes session then retries once');

  await setSession({access_token:OLD_JWT,refresh_token:REFRESH,
    expires_at:Math.floor(Date.now()/1000)-50});
  const beforeFailed=edgeCalls.length;
  refuseRefresh=true;
  await page.locator('#run').click();
  await page.getByText('Staff session expired. Return to the dashboard and sign in again.',{exact:false}).waitFor();
  assert.equal(edgeCalls.length,beforeFailed);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('nurgat-auth-v2')),null);
  assert.equal(await page.locator('#result').isVisible(),false);
  refuseRefresh=false;
  console.log('PASS 7: Invalid refresh token fails safely without contacting staging endpoint');

  await setSession({access_token:OLD_JWT,refresh_token:REFRESH});
  const beforeRepeat=edgeCalls.length;
  alwaysReject=true;
  await page.locator('#run').click();
  await page.getByText('Fresh staff login token was rejected.',{exact:false}).waitFor();
  assert.deepEqual(edgeCalls.slice(beforeRepeat).map(x=>x.jwt),['Bearer '+OLD_JWT,'Bearer '+NEW_JWT]);
  assert.equal(await page.locator('#result').isVisible(),false);
  alwaysReject=false;
  console.log('PASS 8: Persistent Invalid JWT stops after one retry and shows sign-in guidance');

  console.log('RESULT: 8/8 staging smoke-page browser tests passed with mocked Supabase.');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{
 console.error('STAGING SMOKE TEST FAILED:',e.stack||e);process.exitCode=1;
});
