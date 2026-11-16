'use strict';
// Static staging test page QA: all Supabase calls are mocked by Chromium.
// Never use real staff tokens, external n8n, or provider credentials.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const { chromium } = require('playwright');
const BASE='https://ysakhagnlmhwbbmetjjc.supabase.co';
const JWT='FAKE_TEST_JWT_ONLY';
const headers={
  'content-type':'application/json',
  'access-control-allow-origin':'*',
  'access-control-allow-methods':'POST,OPTIONS',
  'access-control-allow-headers':'apikey,authorization,content-type'
};
const success={
  ok:true,mode:'STAGING_INTERNAL_ONLY',status:'VERIFIED_STAGING_RESPONSE',
  providerConnected:false,customerSendAllowed:false,
  bookingAvailable:false,ticketIssuanceAllowed:false,
  plan:'GDS RESEARCH PLAN — NOT CONNECTED. No real bookings.'
};
(async()=>{
 const html=fs.readFileSync('staging-handoff.html');
 const server=http.createServer((_req,res)=>{
  res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  await page.addInitScript(token=>{
   sessionStorage.setItem('nurgat-auth-v2',JSON.stringify({access_token:token,refresh_token:'FAKE_ONLY'}));
  },JWT);
  const calls=[];
  let currentResponse=success,currentStatus=200;
  await page.route(BASE+'/**',async route=>{
   const req=route.request(),url=new URL(req.url());
   assert.equal(url.pathname,'/functions/v1/nurgat-service-handoff-staging');
   assert.equal(req.method(),'POST');
   assert.equal(req.headers().authorization,'Bearer '+JWT);
   const body=req.postDataJSON();
   calls.push(body);
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
   assert.equal(JSON.stringify(body).includes(JWT),false);
   assert.deepEqual(Object.keys(body.request).sort(),['origin','destination','departureDate',
    'returnDate','tripType','adults','children','infants','cabin','preference'].sort());
   await route.fulfill({status:currentStatus,headers,body:JSON.stringify(currentResponse)});
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#run').click();
  await page.getByText('Success: the secure fictional staging handoff',{exact:false}).waitFor();
  assert.match(await page.locator('#result').innerText(),/NOT CONNECTED/);
  assert.equal(calls.length,1);
  console.log('PASS 1: Approved fictional response displays verified staging success');
  console.log('PASS 2: Only synthetic flight fields sent; staff JWT stays in Authorization header');
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
  console.log('PASS 4: Denied reviewer cannot see a staged result');
  assert.equal(calls.length,3);
  console.log('RESULT: 4/4 staging smoke-page browser tests passed with mocked Supabase.');
 } finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(err=>{console.error('STAGING SMOKE TEST FAILED:',err.stack||err);process.exitCode=1});
