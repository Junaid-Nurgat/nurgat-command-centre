// Nurgat Tours service-authenticated, read-only STAGING Edge Function.
// NOT DEPLOYED. Do not enable until agency-owned n8n Header Auth credentials
// and the matching Supabase server-only secrets have been configured.
// Deploy with JWT verification enabled; NEVER expose this secret in the UI.
import { createStagingHandoff } from '../_shared/staging-handoff.mjs';

const base = Deno.env.get('SUPABASE_URL');
const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
const allowedTestUrl =
  'https://nurgattourszm.app.n8n.cloud/webhook-test/nurgat-staff-service-auth-staging-v1';

async function authorizeReviewer(jwt) {
  if (!base || !publishableKey) throw Error('Staff auth not configured');
  const headers = { authorization: 'Bearer ' + jwt, apikey: publishableKey };
  const userResponse = await fetch(base + '/auth/v1/user', { headers });
  if (!userResponse.ok) return null;
  const user = await userResponse.json();
  if (typeof user?.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id))
    return null;
  const url = new URL(base + '/rest/v1/approval_reviewers');
  url.searchParams.set('select','user_id');
  url.searchParams.set('active','eq.true');
  url.searchParams.set('user_id','eq.' + user.id);
  url.searchParams.set('limit','1');
  // User-scoped JWT: no service_role key and no RLS bypass.
  const check = await fetch(url, { headers });
  if (!check.ok) throw Error('Reviewer lookup unavailable');
  const rows = await check.json();
  return Array.isArray(rows) && rows.length === 1 && rows[0].user_id === user.id
    ? user.id : null;
}

async function dispatch(payload, serviceSecret) {
  const configured = Deno.env.get('NURGAT_STAGING_N8N_TEST_URL');
  // Disallow production webhooks or arbitrary external URLs in this fixture-only code.
  if (configured !== allowedTestUrl) throw Error('Approved staging endpoint not configured');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(allowedTestUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-nurgat-service-key': serviceSecret
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) throw Error('Staging n8n rejected');
    const body = await response.text();
    if (body.length > 3600) throw Error('Oversized staging response');
    return JSON.parse(body);
  } finally { clearTimeout(timer); }
}

const handle = createStagingHandoff({
  authorizeReviewer,
  serviceCredential: () => Deno.env.get('NURGAT_STAGING_SERVICE_KEY'),
  dispatch
});
Deno.serve(handle);
