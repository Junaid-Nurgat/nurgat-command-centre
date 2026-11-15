// Isolated staff login check — static safety assertions, no HTTP calls or actual login.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../staff-login-check.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length,1,'Exactly one embedded script');
assert.doesNotThrow(()=>new Function(scripts[0][1]),'Client-side script parses');
for(const token of ['id="loginForm"','id="password"','id="endpointCheck"','id="signOut"',
'/auth/v1/token?grant_type=password','/auth/v1/user','/rest/v1/approval_reviewers',
'/rest/v1/rpc/claim_ai_handoff',"p_request_id:'INVALID'",'pagehide','No customer messages, real flight searches'])
 assert.ok(html.includes(token),'Expected safe login test behavior: '+token);
assert.ok(!/localStorage\.|sessionStorage\./.test(html),'No persistent browser session storage');
assert.ok(!/wa\.me\/|sendMessage\(|nurgat-gds-command-planner-demo-v1/.test(html),'No live customer or GDS actions');
assert.ok(!/service_role|sb_secret_|SUPABASE_SERVICE_KEY/.test(html),'No elevated Supabase keys');
assert.ok(html.includes("response.status===400&&/invalid request id/i.test(message)"),'Only verified invalid-ID error counts as successful no-write test');
console.log('PASS: standalone staff sign-in checker syntax, ephemeral session, reviewer RLS and no-write RPC contract.');

assert.ok(html.includes('/webhook-test/nurgat-original-reviewer-staging-v1'));
assert.ok(!html.includes('/webhook/nurgat-original-reviewer-staging-v1'));
assert.ok(html.includes("d.status==='COMPLETED'&&d.handoffCompleted===true"));
assert.ok(html.includes("d.customerSendAllowed===false"));
assert.ok(html.includes("d.bookingAvailable===false"));
assert.ok(html.includes("d.ticketIssuanceAllowed===false"));
assert.ok(html.includes("if(!handoffFixture)handoffFixture="),'Retry preserves request ID');
