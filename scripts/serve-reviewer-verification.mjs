// Serves two fixed public files only. Never accepts passwords or proxies requests.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
const files = new Map([
  ['/', ['../reviewer-verification.html','text/html; charset=utf-8']],
  ['/src/reviewer-verification.mjs',['../src/reviewer-verification.mjs','text/javascript; charset=utf-8']]
]);
http.createServer(async(req,res)=>{
  if(req.method!=='GET'||req.headers.host!=='127.0.0.1:8765'||!files.has(req.url)){res.writeHead(404).end();return;}
  const [file,type]=files.get(req.url);
  try {
    const data=await readFile(new URL(file,import.meta.url));
    res.writeHead(200,{'content-type':type,'cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; connect-src https://ysakhagnlmhwbbmetjjc.supabase.co https://nurgattourszm.app.n8n.cloud; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"}).end(data);
  } catch {res.writeHead(500).end();}
}).listen(8765,'127.0.0.1',()=>console.log('Private verification page: http://127.0.0.1:8765 — press Ctrl+C to stop.'));
