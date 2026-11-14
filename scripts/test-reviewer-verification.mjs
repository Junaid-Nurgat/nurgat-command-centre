import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createVerifier, BASE, STAGING} from '../src/reviewer-verification.mjs';
const safe={ok:true,stage:'AI1_TO_AI2_INTERNAL_HANDOFF_DEMO',status:'COMPLETED',handoffCompleted:true,providerConnected:false,customerSendAllowed:false,customerQuoteAvailable:false,bookingAvailable:false,ticketIssuanceAllowed:false,plan:'GDS RESEARCH PLAN — NOT CONNECTED. Test only.'};
function harness(options={}) {
  const calls=[];
  const mock=async(url,init)=>{
    calls.push({url,init});
    let value;
    if(url.includes('/token?')) value={access_token:'fixture-secret-not-real',refresh_token:'do-not-retain'};
    else if(url.endsWith('/user')) value={id:'reviewer-fixture',is_anonymous:options.anonymous??false};
    else if(url.includes('/approval_reviewers?')) value=options.rows??[{user_id:'reviewer-fixture'}];
    else if(url.includes('/logout?')) return {ok:!options.logoutFailure};
    else if(url===STAGING) {if(options.networkFailure)throw Error('SECRET error must not escape');value=options.result??safe;}
    else throw Error('Unexpected destination');
    return {ok:true,json:async()=>value};
  };
  return {client:createVerifier(mock,()=>Date.parse('2026-11-14'),()=> 'fixed-fixture-id'),calls};
}
let h=harness();
await assert.rejects(h.client.handoff(),/Sign in personally first/);
assert.equal(h.calls.length,0);
assert.deepEqual(await h.client.signIn('fixture@example.invalid','dummy'),{status:'GENUINE_REVIEWER_LOGIN_VERIFIED'});
const first=await h.client.handoff(), second=await h.client.handoff();
assert.equal(first.status,'STAGING_HANDOFF_COMPLETED');
assert.equal(first.requestId,second.requestId);
const sent=h.calls.filter(c=>c.url===STAGING);
assert.equal(sent.length,2);
assert.equal(sent[0].init.body,sent[1].init.body);
assert.equal(sent[0].init.redirect,'error');
assert.equal(JSON.parse(sent[0].init.body).request.departureDate,'2026-12-14');
assert.equal(Object.keys(JSON.parse(sent[0].init.body).request).length,10);
assert(!JSON.stringify(first).includes('fixture-secret'));
assert(!h.calls.some(c=>c.url.includes('/webhook/')));
assert(!h.calls.slice(1).some(c=>c.init.body?.includes('dummy')||c.init.body?.includes('do-not-retain')));
await h.client.signOut();
assert(h.calls.some(c=>c.url===BASE+'/auth/v1/logout?scope=local'));
await assert.rejects(h.client.handoff());
for(const rows of [[],[{user_id:'someone-else'}],[{user_id:'reviewer-fixture'},{user_id:'extra'}]]) {
  h=harness({rows});await assert.rejects(h.client.signIn('x','x'));assert(!h.calls.some(c=>c.url===STAGING));
}
h=harness({anonymous:true});await assert.rejects(h.client.signIn('x','x'));
for(const result of [{...safe,customerSendAllowed:true},{...safe,providerConnected:true},{...safe,ticketIssuanceAllowed:undefined},{...safe,status:'DUPLICATE_IN_PROGRESS'},{...safe,plan:'Live booking'}]) {
  h=harness({result});await h.client.signIn('x','x');await assert.rejects(h.client.handoff());
}
h=harness({result:{...safe,status:'DUPLICATE_COMPLETED',handoffCompleted:false,duplicate:true}});
await h.client.signIn('x','x');assert.equal((await h.client.handoff()).status,'DUPLICATE_COMPLETED_WITHOUT_AI_CALL');
h=harness({networkFailure:true});await h.client.signIn('x','x');await assert.rejects(h.client.handoff(),/^Error: Network or test-listener failure/);assert.equal(h.calls.filter(c=>c.url===STAGING).length,1);
h=harness({logoutFailure:true});await h.client.signIn('x','x');await assert.rejects(h.client.signOut(),/memory cleared/);await assert.rejects(h.client.handoff());
const source=readFileSync(new URL('../src/reviewer-verification.mjs',import.meta.url),'utf8');
assert(!/localStorage|sessionStorage|console\./.test(source));
const graph=JSON.parse(readFileSync(new URL('./fixtures/original-staff-staging.json',import.meta.url),'utf8'));
assert.equal(graph.active,false);assert.equal(graph.activeVersionId,null);
assert.equal(graph.settings.errorWorkflow,'');
assert.equal(graph.settings.saveManualExecutions,false);assert.equal(graph.settings.saveExecutionProgress,false);
assert.equal(graph.settings.saveDataErrorExecution,'none');assert.equal(graph.settings.saveDataSuccessExecution,'none');
for(const n of graph.nodes){
  assert(!/gmail|whatsapp|executeWorkflow|executeCommand|tool/i.test(n.type));
  if(n.type.endsWith('.httpRequest'))assert(n.parameters.url.startsWith(BASE+'/rest/v1/'));
}
const values={};
function run(name,input){
  const node=graph.nodes.find(n=>n.name===name);
  const result=vm.runInNewContext('(function(){'+node.parameters.jsCode+'})()',{$input:{first:()=>({json:input}),all:()=>[{json:input}]},$:(key)=>({first:()=>({json:values[key]})})});
  values[name]=result[0]?.json;return result[0]?.json;
}
const flight={origin:'LUN',destination:'DXB',departureDate:new Date(Date.now()+30*86400000).toISOString().slice(0,10),returnDate:null,tripType:'ONE_WAY',adults:1,children:0,infants:0,cabin:'ECONOMY',preference:'BEST'};
const body={jwt:'eyJ'+'a'.repeat(120),requestId:'ORIGINAL_STAFF_TEST_FIXTURE',request:flight};
for(const changed of [{...body,requestId:'NON_STAGING_FIXTURE'},{...body,jwt:null},{...body,request:{...flight,customerName:'Fictional'}},{...body,request:{...flight,destination:'JNB'}}])assert.throws(()=>run('Allowlist AI1 Request',{body:changed}));
run('Allowlist AI1 Request',{body});
assert.throws(()=>run('Verify Atomic Lease Token',{action:'PROCESS'}));
run('Verify Atomic Lease Token',{action:'PROCESS',leaseToken:'00000000-0000-4000-8000-000000000001'});
assert.throws(()=>run('Build Safe GDS Research Context',{}));
const context=run('Build Safe GDS Research Context',{user_id:'fixture'});assert(!JSON.stringify(context).includes(body.jwt));
const plan=run('Block Commands and Return Dry-Run Plan',{output:safe.plan});
run('Enforce AI2 Read-Only Safety Gate',plan);
assert.throws(()=>run('Enforce AI2 Read-Only Safety Gate',{...plan,commandExecutionAllowed:true}));
assert.throws(()=>run('Respond With Safe Completed Plan',{completed:false}));
assert.equal(run('Respond With Safe Completed Plan',{completed:true}).status,'COMPLETED');
assert.equal(run('Return Duplicate Without AI Call',{action:'DUPLICATE_COMPLETED'}).handoffCompleted,false);
assert.equal(run('Return Duplicate Without AI Call',{action:'CONFLICT'}).ok,false);
console.log('PASS: reviewer client failure paths, secret isolation, immutable retry, staging graph and real gate code. Auth/AI HTTP responses are simulated here.');
