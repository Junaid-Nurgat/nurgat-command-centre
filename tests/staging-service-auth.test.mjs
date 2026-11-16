import test from 'node:test';
import assert from 'node:assert/strict';
import { createStagingHandoff, validateStagingPayload }
  from '../supabase/functions/_shared/staging-handoff.mjs';

const reviewerId = '00000000-0000-4000-8000-000000000001';
const origin = 'https://junaid-nurgat.github.io';
const day = new Date(Date.now()+70*86400000).toISOString().slice(0,10);
const fixture = Object.freeze({
  requestId: 'STAGE_1234567890ABCDEFG',
  request: {
    origin:'LUN', destination:'DXB', departureDate:day, returnDate:null,
    tripType:'ONE_WAY', adults:1, children:0, infants:0,
    cabin:'ECONOMY', preference:'BEST'
  }
});
const goodAnswer = {
  ok:true, mode:'STAGING_INTERNAL_ONLY', providerConnected:false,
  customerSendAllowed:false, bookingAvailable:false, ticketIssuanceAllowed:false,
  plan:'GDS RESEARCH PLAN — NOT CONNECTED. This is a fictional test only.'
};
const secret = 'FAKE_TEST_ONLY_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
const req = (body=fixture,{token='FAKE_STAFF_JWT',method='POST',site=origin,headers={}}={}) =>
  new Request('https://example.test/staging',{
    method, headers:{
      origin: site, authorization: 'Bearer '+token,
      'content-type':'application/json', ...headers
    },
    ...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})
  });
const make = (extra={}) => {
  const calls=[];
  const handle=createStagingHandoff({
    authorizeReviewer: async token=>token==='FAKE_STAFF_JWT'?reviewerId:null,
    serviceCredential: ()=>secret,
    dispatch: async(payload,serviceKey)=>{calls.push({payload,serviceKey});return goodAnswer;},
    ...extra
  });
  return {handle,calls};
};
const read = async res=>({status:res.status,body:await res.json()});

test('1: staging handoff succeeds only for approved fictional fixture',async()=>{
  const {handle,calls}=make();
  const result=await read(await handle(req()));
  assert.equal(result.status,200);
  assert.equal(result.body.mode,'STAGING_INTERNAL_ONLY');
  assert.equal(result.body.providerConnected,false);
  assert.equal(result.body.customerSendAllowed,false);
  assert.equal(result.body.bookingAvailable,false);
  assert.equal(result.body.ticketIssuanceAllowed,false);
  assert.equal(calls.length,1);
});

test('2: n8n payload does not contain staff or refresh JWT, only server credential header secret',async()=>{
  const {handle,calls}=make();
  await handle(req());
  const {payload,serviceKey}=calls[0];
  assert.equal(serviceKey,secret);
  assert.equal(payload.actorId,reviewerId);
  assert.equal(payload.requestId,fixture.requestId);
  assert.equal(payload.mode,'STAGING_INTERNAL_ONLY');
  assert.deepEqual(payload.request,fixture.request);
  assert.equal(JSON.stringify(payload).includes('FAKE_STAFF_JWT'),false);
  assert.equal(JSON.stringify(payload).includes('FAKE_REFRESH'),false);
  assert.equal(JSON.stringify(payload).includes(secret),false);
  assert.equal(Object.keys(payload).some(k=>/jwt|token|secret/i.test(k)),false);
});

test('3: no token or invalid session is denied before n8n dispatch',async()=>{
  const {handle,calls}=make();
  const missing=await read(await handle(req(fixture,{headers:{authorization:''}})));
  const bad=await read(await handle(req(fixture,{token:'WRONG'})));
  assert.equal(missing.status,401);
  assert.equal(bad.status,403);
  assert.equal(calls.length,0);
});

test('4: staff verification outage fails closed and no dispatch occurs',async()=>{
  const {handle,calls}=make({authorizeReviewer:async()=>{throw Error('sensitive auth details');}});
  const result=await read(await handle(req()));
  assert.equal(result.status,503);
  assert.equal(JSON.stringify(result.body).includes('sensitive'),false);
  assert.equal(calls.length,0);
});

test('5: origin and method checks do not replace reviewer authentication',async()=>{
  const {handle,calls}=make();
  assert.equal((await handle(req(fixture,{site:'https://unapproved.example'}))).status,403);
  assert.equal((await handle(req(fixture,{method:'GET'}))).status,405);
  assert.equal((await handle(req(fixture,{token:'WRONG'}))).status,403);
  assert.equal(calls.length,0);
});

test('6: same-origin OPTIONS allows auth headers without running n8n',async()=>{
  const {handle,calls}=make();
  const response=await handle(req(null,{method:'OPTIONS',token:'WRONG'}));
  assert.equal(response.status,204);
  assert.match(response.headers.get('access-control-allow-headers'),/authorization/);
  assert.equal(calls.length,0);
});

test('7: only one test fixture accepted; customer data, price and other trips denied',async()=>{
  const invalids=[
    { ...fixture, customerName:'Test Person' },
    { ...fixture, request:{...fixture.request,destination:'LHR'} },
    { ...fixture, request:{...fixture.request,adultName:'Test Person'} },
    { ...fixture, request:{...fixture.request,markup:300} },
    { ...fixture, request:{...fixture.request,adults:2} },
    { ...fixture, request:{...fixture.request,returnDate:'2027-01-01'} },
    { ...fixture, request:{...fixture.request,departureDate:'2020-01-01'} },
    { ...fixture, request:{...fixture.request,departureDate:'2027-02-30'} },
    { ...fixture, requestId:'unsafe id' },
    { ...fixture, request:{origin:'LUN'} }
  ];
  const {handle,calls}=make();
  for(const data of invalids){
    const response=await read(await handle(req(data)));
    assert.equal(response.status,400,JSON.stringify(data));
  }
  assert.equal(calls.length,0);
});

test('8: invalid request content-type or malformed JSON rejected',async()=>{
  const {handle,calls}=make();
  assert.equal((await handle(req('{"bad"'))).status,400);
  assert.equal((await handle(req(fixture,{headers:{'content-type':'text/plain'}}))).status,400);
  assert.equal(calls.length,0);
});

test('9: missing service credential fails closed, without staff JWT fallback',async()=>{
  const {handle,calls}=make({serviceCredential:()=>undefined});
  const result=await read(await handle(req()));
  assert.equal(result.status,503);
  assert.match(result.body.message,/not configured/);
  assert.equal(calls.length,0);
});

test('10: n8n outage does not disclose upstream details',async()=>{
  const {handle}=make({dispatch:async()=>{throw Error('Authorization: SECRET_HEADER and account@agency.tld');}});
  const result=await read(await handle(req()));
  assert.equal(result.status,502);
  assert.equal(JSON.stringify(result.body).includes('SECRET_HEADER'),false);
  assert.equal(JSON.stringify(result.body).includes('account@agency'),false);
});

test('11: unsafe n8n outputs cannot enable booking or claim provider connectivity',async()=>{
  for(const patch of [
    {bookingAvailable:true}, {customerSendAllowed:true}, {ticketIssuanceAllowed:true},
    {providerConnected:true}, {ok:false}, {mode:'PRODUCTION'},
    {plan:'Approved fare confirmed'}, {plan:'GDS RESEARCH PLAN — NOT CONNECTED'+'.'.repeat(2600)}
  ]){
    const {handle}=make({dispatch:async()=>({...goodAnswer,...patch})});
    assert.equal((await handle(req())).status,502,JSON.stringify(patch));
  }
});

test('12: output is restricted to safety fields even if n8n includes extra data',async()=>{
  const {handle}=make({dispatch:async()=>({...goodAnswer,token:'LEAK_ME',customerEmail:'none@test.invalid'})});
  const result=await read(await handle(req()));
  assert.equal(result.status,200);
  assert.equal('token' in result.body,false);
  assert.equal('customerEmail' in result.body,false);
});

test('13: same request ID is preserved across calls; gateway never books or sends',async()=>{
  const {handle,calls}=make();
  await handle(req());await handle(req());
  assert.equal(calls.length,2);
  assert.equal(calls[0].payload.requestId,calls[1].payload.requestId);
  assert.equal(calls[0].payload.bookingAvailable,false);
  assert.equal(calls[0].payload.customerSendAllowed,false);
  // Downstream idempotency is a separate requirement; no side effects here.
});

test('14: validator only allows complete fictional staging requests',()=>{
  const today=new Date().toISOString().slice(0,10);
  assert.deepEqual(validateStagingPayload(fixture,today),fixture);
  assert.equal(validateStagingPayload({ ...fixture, unknown:true },today),null);
});

console.log('Staging security contract: no real n8n requests, staff tokens, or customer actions.');
