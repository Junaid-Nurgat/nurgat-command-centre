// Agency-only, read-only n8n daily monitoring snapshot bridge.
// Authorization: verified Supabase staff JWT AND active reviewer RLS lookup.
// With no approved server-only n8n API key, this endpoint fails closed (503).
// DO NOT include n8n API keys in GitHub, browser code, logs, or chat.
import { createMonitoringReader } from '../_shared/monitoring-readonly.mjs';

const base=Deno.env.get('SUPABASE_URL');
const anonKey=Deno.env.get('SUPABASE_ANON_KEY');
const fixedN8nUrl='https://nurgattourszm.app.n8n.cloud/api/v1/data-tables/vFF80c81c9xNM3LK/rows?limit=25&sortBy=checked_at%3Adesc';

async function authorizeReviewer(jwt){
 if(!base||!anonKey||!base.startsWith('https://'))throw Error('Auth unavailable');
 const headers={authorization:'Bearer '+jwt,apikey:anonKey};
 const res=await fetch(base+'/auth/v1/user',{headers,redirect:'error'});
 if(!res.ok)return null;
 const user=await res.json();
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user?.id||''))return null;
 const url=new URL(base+'/rest/v1/approval_reviewers');
 url.searchParams.set('select','user_id');
 url.searchParams.set('active','eq.true');
 url.searchParams.set('user_id','eq.'+user.id);
 url.searchParams.set('limit','1');
 const check=await fetch(url,{headers,redirect:'error'});
 if(!check.ok)throw Error('Reviewer lookup unavailable');
 const rows=await check.json();
 return Array.isArray(rows)&&rows.length===1&&rows[0]?.user_id===user.id?user.id:null;
}

function apiKey(){
 const key=Deno.env.get('NURGAT_MONITOR_N8N_API_KEY');
 // No request, dummy, expired, weak or missing credential may be used.
 return typeof key==='string'&&key.length>=32?key:null;
}
async function readRows(){
 const key=apiKey();
 if(!key)throw Error('Unconfigured');
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),8000);
 try{
  const response=await fetch(fixedN8nUrl,{
   method:'GET',redirect:'error',
   headers:{'accept':'application/json','X-N8N-API-KEY':key},
   cache:'no-store',signal:controller.signal
  });
  if(!response.ok)throw Error('n8n unavailable');
  if(Number(response.headers.get('content-length')||0)>65536)throw Error('Oversized n8n response');
  const body=await response.text();
  if(body.length>65536)throw Error('Oversized n8n response');
  const parsed=JSON.parse(body);
  if(!parsed||!Array.isArray(parsed.data))throw Error('Unexpected n8n response');
  return parsed.data;
 }finally{clearTimeout(timer)}
}
Deno.serve(createMonitoringReader({
 authorizeReviewer,
 isConfigured:()=>Boolean(apiKey()),
 getRows:readRows
}));
