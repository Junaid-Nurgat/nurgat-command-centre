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

function upstreamError(code) {
  const error = new Error('Staging request could not be completed.');
  error.code = code;
  return error;
}

async function dispatch(payload, serviceSecret) {
  const configured = Deno.env.get('NURGAT_STAGING_N8N_TEST_URL');
  // Fixed test-only endpoint: never send this service credential to an arbitrary URL.
  if (configured !== allowedTestUrl) throw upstreamError('STAGING_TEST_URL_MISSING');
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
    // Classify *status codes only*. Never expose upstream bodies, headers, or credentials.
    if (!response.ok) {
      if (response.status === 401 || response.status === 403)
        throw upstreamError('STAGING_N8N_AUTH_REJECTED');
      if (response.status === 404 || response.status === 410)
        throw upstreamError('STAGING_N8N_LISTENER_NOT_READY');
      throw upstreamError('STAGING_N8N_HTTP_FAILURE');
    }
    const body = await response.text();
    if (body.length > 3600) throw upstreamError('STAGING_N8N_INVALID_RESPONSE');
    let parsed;
    try { parsed = JSON.parse(body); }
    catch { throw upstreamError('STAGING_N8N_INVALID_RESPONSE'); }
    return parsed;
  } catch (error) {
    if (error?.name === 'AbortError') throw upstreamError('STAGING_N8N_TIMEOUT');
    if (error?.code && typeof error.code === 'string' &&
        error.code.startsWith('STAGING_')) throw error;
    throw upstreamError('STAGING_N8N_NETWORK_FAILURE');
  } finally { clearTimeout(timer); }
}

const handle = createStagingHandoff({
  authorizeReviewer,
  serviceCredential: () => Deno.env.get('NURGAT_STAGING_SERVICE_KEY'),
  dispatch
});
Deno.serve(handle);
