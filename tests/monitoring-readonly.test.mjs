import assert from 'node:assert/strict';
import {projectDailySnapshot,createMonitoringReader} from '../supabase/functions/_shared/monitoring-readonly.mjs';
const O='https://junaid-nurgat.github.io';
const jwt='TEST_ONLY_FAKE_SESSION_TOKEN_VALID_LENGTH_123456';
const base={checked_at:'2026-11-16T06:00:01.990Z',failures_24h:0,open_incidents:0,known_tests:3,
 status:'NO_UNREVIEWED_FAILURES_RECORDED',error_summary:'RAW PRIVATE INCIDENT TEXT MUST NEVER APPEAR',
 X_N8N_API_KEY:'DO_NOT_EXPOSE_ANY_KEYS',workflow_id:'PRIVATE_WORKFLOW_REFERENCE'};
const t=Date.parse('2026-11-16T12:00:00.000Z');
function request(method='GET',origin=O,authorization='Bearer '+jwt){
 return new Request('https://ysakhagnlmhwbbmetjjc.supabase.co/functions/v1/nurgat-monitor-readonly',
 {method,headers:{origin,authorization}});
}
const parsed=projectDailySnapshot([base],t);
assert.deepEqual(parsed,{
 ok:true,mode:'READ_ONLY_MONITOR',connected:true,hasSnapshot:true,
 checkedAt:'2026-11-16T06:00:01.990Z',fresh:true,
 failures24h:0,unreviewedIncidents:0,knownTestEvents:3,
 noCustomerData:true,actionsAllowed:false});
assert.equal(JSON.stringify(parsed).includes('RAW PRIVATE'),false);
assert.equal(JSON.stringify(parsed).includes('PRIVATE_WORKFLOW'),false);
console.log('PASS 1: Valid daily snapshot exposes only whitelisted counts and timestamp');

const ordered=projectDailySnapshot([
 {...base,checked_at:'2026-11-14T06:00:00Z',open_incidents:4},
 {...base,checked_at:'2026-11-16T06:00:01.990Z',open_incidents:1}
],t);
assert.equal(ordered.unreviewedIncidents,1);
console.log('PASS 2: Latest snapshot is selected even if upstream rows are unsorted');

assert.equal(projectDailySnapshot([base],Date.parse('2026-11-18T12:00:00Z')).fresh,false);
assert.equal(projectDailySnapshot([{...base,checked_at:'2026-11-17T12:00:00Z'}],t).fresh,false);
console.log('PASS 3: Old or future-dated source snapshots never claim freshness');

assert.equal(projectDailySnapshot([],t).hasSnapshot,false);
console.log('PASS 4: Empty source is explicit, not a falsely healthy zero-incident report');

for(const bad of [
 null,{data:[base]},[{...base,known_tests:'3'}],[{...base,open_incidents:-1}],
 [{...base,checked_at:'invalid'}],Array(51).fill(base)
])assert.throws(()=>projectDailySnapshot(bad,t));
console.log('PASS 5: Malformed rows and counts fail closed');

let authCalls=0,reads=0,connected=true,authorized=true,failRead=false,failAuth=false;
const handler=createMonitoringReader({
 authorizeReviewer:async()=>{authCalls++;if(failAuth)throw Error('PRIVATE AUTH ERROR');return authorized?'reviewer-id':null},
 isConfigured:()=>connected,
 getRows:async()=>{reads++;if(failRead)throw Error('RAW PRIVATE UPSTREAM ERROR');return [base]}
});
let r=await handler(request('GET','https://attacker.invalid'));
assert.equal(r.status,403);
assert.equal(authCalls,0);assert.equal(reads,0);
console.log('PASS 6: Cross-origin request rejected before any authorization or upstream call');

r=await handler(request('POST'));assert.equal(r.status,405);
assert.equal(reads,0);
console.log('PASS 7: Function exposes GET only—no incident mutation paths');

r=await handler(request('GET',O,'Bearer bad'));
assert.equal(r.status,401);assert.equal(authCalls,0);
console.log('PASS 8: Missing or malformed staff token is rejected without contacting n8n');

authorized=false;r=await handler(request());
assert.equal(r.status,403);assert.equal(reads,0);
console.log('PASS 9: Non-reviewer cannot access upstream monitoring, regardless of JWT');

authorized=true;failAuth=true;r=await handler(request());
assert.equal(r.status,503);assert.equal(reads,0);
failAuth=false;
console.log('PASS 10: Reviewer lookup outage fails closed with no upstream call');

connected=false;r=await handler(request());
assert.equal(r.status,503);
assert.equal((await r.json()).code,'MONITOR_NOT_CONNECTED');
assert.equal(reads,0);
connected=true;
console.log('PASS 11: Missing server-only API credential produces clear not-connected status');

failRead=true;r=await handler(request());
assert.equal(r.status,502);
const privateErrorBody=JSON.stringify(await r.json());
assert.equal(privateErrorBody.includes('RAW PRIVATE'),false);
failRead=false;
console.log('PASS 12: Upstream error does not leak raw incident contents or credentials');

r=await handler(request());
assert.equal(r.status,200);
assert.equal(r.headers.get('cache-control'),'no-store, private');
const body=await r.json();
assert.equal(body.mode,'READ_ONLY_MONITOR');
assert.equal(body.open_incidents,undefined);
assert.equal(body.knownTestEvents,3);
assert.equal(JSON.stringify(body).includes('RAW PRIVATE'),false);
console.log('PASS 13: Authorized reader gets only sanitized, non-actionable daily counts');

r=await handler(request('OPTIONS',O,''));
assert.equal(r.status,204);
assert.equal(r.headers.get('access-control-allow-origin'),O);
assert.equal(reads,2,'preflight never reads n8n');
console.log('PASS 14: CORS preflight is narrow, non-reading, and allowed only for staff origin');

console.log('RESULT: 14/14 isolated monitoring bridge security tests passed.');
