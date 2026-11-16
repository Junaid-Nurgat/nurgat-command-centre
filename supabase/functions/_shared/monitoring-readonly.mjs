// Nurgat Tours read-only n8n DAILY snapshot response gate.
// Never return raw n8n data-table rows, error summaries, keys, or incident text.
// This module is pure (Node-testable); the Edge entrypoint supplies the I/O.
const ALLOWED_ORIGIN='https://junaid-nurgat.github.io';
function respond(status,body,origin){
 return new Response(JSON.stringify(body),{
  status,
  headers:{
   'content-type':'application/json; charset=utf-8',
   'cache-control':'no-store, private',
   'vary':'Origin',
   ...(origin===ALLOWED_ORIGIN?{
    'access-control-allow-origin':ALLOWED_ORIGIN,
    'access-control-allow-methods':'GET, OPTIONS',
    'access-control-allow-headers':'authorization, apikey, content-type'
   }:{})
  }
 });
}
function integers(v){return Number.isSafeInteger(v)&&v>=0&&v<=100000000}
export function projectDailySnapshot(raw,nowMs=Date.now()){
 if(!Array.isArray(raw)||raw.length>50)throw Error('Invalid snapshot list');
 if(raw.length===0)return {
  ok:true,mode:'READ_ONLY_MONITOR',connected:true,hasSnapshot:false,
  message:'No daily monitoring snapshot is available yet.',
  noCustomerData:true,actionsAllowed:false
 };
 // Strictly use the server-generated numeric counts and timestamp; never pass on
 // n8n error summaries, workflow identifiers, text fields, notification data etc.
 const eligible=raw.filter(r=>r&&typeof r==='object'&&!Array.isArray(r)&&
  typeof r.checked_at==='string'&&/^\d{4}-\d\d-\d\dT/.test(r.checked_at)&&
  Number.isFinite(Date.parse(r.checked_at))&&
  integers(r.failures_24h)&&integers(r.open_incidents)&&integers(r.known_tests));
 if(eligible.length!==raw.length)throw Error('Invalid snapshot fields');
 eligible.sort((a,b)=>Date.parse(b.checked_at)-Date.parse(a.checked_at));
 const s=eligible[0],timestamp=Date.parse(s.checked_at);
 const age=nowMs-timestamp;
 return {
  ok:true,mode:'READ_ONLY_MONITOR',connected:true,hasSnapshot:true,
  checkedAt:new Date(timestamp).toISOString(),
  fresh:age>=-300000&&age<=30*3600000,
  failures24h:s.failures_24h,
  unreviewedIncidents:s.open_incidents,
  knownTestEvents:s.known_tests,
  noCustomerData:true,actionsAllowed:false
 };
}
export function createMonitoringReader({authorizeReviewer,getRows,isConfigured}){
 if(typeof authorizeReviewer!=='function'||typeof getRows!=='function'||typeof isConfigured!=='function')throw Error('Missing monitor dependencies');
 return async function(req){
  const origin=req.headers.get('origin');
  if(origin!==ALLOWED_ORIGIN)return respond(403,{ok:false,code:'MONITOR_ORIGIN_DENIED'},origin);
  if(req.method==='OPTIONS')return new Response(null,{
   status:204,
   headers:{'access-control-allow-origin':ALLOWED_ORIGIN,
    'access-control-allow-methods':'GET, OPTIONS',
    'access-control-allow-headers':'authorization, apikey, content-type',
    'cache-control':'no-store','vary':'Origin'}
  });
  if(req.method!=='GET')return respond(405,{ok:false,code:'MONITOR_READ_ONLY'},origin);
  const auth=req.headers.get('authorization')||'';
  if(!/^Bearer [A-Za-z0-9._~-]{24,4096}$/.test(auth))
   return respond(401,{ok:false,code:'MONITOR_SIGN_IN_REQUIRED'},origin);
  const jwt=auth.slice(7);
  try{
   const actor=await authorizeReviewer(jwt);
   if(!actor)return respond(403,{ok:false,code:'MONITOR_REVIEWER_REQUIRED'},origin);
  }catch{return respond(503,{ok:false,code:'MONITOR_AUTH_UNAVAILABLE'},origin)}
  // Never call n8n until staff permissions are verified.
  if(!isConfigured())return respond(503,{ok:false,code:'MONITOR_NOT_CONNECTED'},origin);
  let rows;
  try{rows=await getRows()}
  catch{return respond(502,{ok:false,code:'MONITOR_SOURCE_UNAVAILABLE'},origin)}
  try{return respond(200,projectDailySnapshot(rows),origin)}
  catch{return respond(502,{ok:false,code:'MONITOR_INVALID_SNAPSHOT'},origin)}
 };
}
