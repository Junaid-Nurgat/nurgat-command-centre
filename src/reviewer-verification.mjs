// Local-only controlled rehearsal. Secrets remain inside this closure, never returned.
export const BASE = 'https://ysakhagnlmhwbbmetjjc.supabase.co';
export const PUBLIC_KEY = 'sb_publishable_X-LmUybKfqPO1oku3LVlgg_86ODj9hH';
export const STAGING = 'https://nurgattourszm.app.n8n.cloud/webhook-test/nurgat-original-reviewer-staging-v1';
class VerificationError extends Error {}
export function createVerifier(transport = fetch, now = () => Date.now(), uuid = () => crypto.randomUUID()) {
  let token = null, request = null, requestId = null, busy = false;
  const clear = () => { token = null; request = null; requestId = null; };
  async function http(url, method, body, authenticated = false) {
    const headers = { 'content-type': 'application/json' };
    if (url.startsWith(BASE + '/')) headers.apikey = PUBLIC_KEY;
    if (authenticated) headers.authorization = 'Bearer ' + token;
    let response;
    try {
      response = await transport(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(50000) });
    } catch { throw new VerificationError('Network or test-listener failure. No automatic retry.'); }
    if (!response.ok) {
      // Read only the machine code; never surface raw auth responses or request data.
      let code;
      try { const failure = await response.json(); code = failure?.error_code ?? failure?.code; } catch {}
      if (url === BASE + '/auth/v1/token?grant_type=password') {
        const messages = {
          invalid_credentials: 'Email or password was not accepted. Use your Command Centre staff login; Google, n8n and Supabase dashboard logins may be different.',
          email_not_confirmed: 'This staff account needs email confirmation before sign-in.',
          over_request_rate_limit: 'Too many sign-in attempts. Wait a few minutes before trying again.',
          user_banned: 'This staff account is unavailable. Contact the account owner.',
          email_provider_disabled: 'Email/password sign-in is disabled for this project.'
        };
        throw new VerificationError(messages[code] || (response.status === 429 ? messages.over_request_rate_limit : 'Staff sign-in was rejected (HTTP ' + response.status + ').'));
      }
      throw new VerificationError('Request rejected (HTTP ' + response.status + ').');
    }
    try { return await response.json(); } catch { throw Error('Invalid response.'); }
  }
  async function reviewer() {
    if (!token) throw Error('Sign in personally first.');
    try {
      const user = await http(BASE + '/auth/v1/user', 'GET', undefined, true);
      if (typeof user?.id !== 'string' || user.is_anonymous === true) throw Error('Reviewer identity not verified.');
      const rows = await http(BASE + '/rest/v1/approval_reviewers?select=user_id&active=eq.true&user_id=eq.' + encodeURIComponent(user.id) + '&limit=1', 'GET', undefined, true);
      if (!Array.isArray(rows) || rows.length !== 1 || rows[0].user_id !== user.id) throw Error('Active reviewer required.');
    } catch { clear(); throw new VerificationError('Sign-in succeeded, but active reviewer access could not be verified. No handoff was run.'); }
  }
  return {
    async signIn(email, password) {
      if (busy) throw Error('A check is already running.');
      busy = true; clear();
      try {
        const session = await http(BASE + '/auth/v1/token?grant_type=password', 'POST', { email, password });
        if (typeof session?.access_token !== 'string') throw Error('Sign-in failed.');
        token = session.access_token; // Do not retain refresh tokens or session objects.
        await reviewer();
        requestId = 'ORIGINAL_STAFF_TEST_' + uuid();
        request = Object.freeze({ origin:'LUN', destination:'DXB', departureDate:new Date(now() + 30 * 86400000).toISOString().slice(0,10), returnDate:null, tripType:'ONE_WAY', adults:1, children:0, infants:0, cabin:'ECONOMY', preference:'BEST' });
        return { status:'GENUINE_REVIEWER_LOGIN_VERIFIED' };
      } catch (error) { clear(); throw error instanceof VerificationError ? error : new VerificationError('Sign-in could not be completed. No handoff was run.'); }
      finally { busy = false; }
    },
    async handoff() {
      if (busy) throw Error('A check is already running.');
      busy = true;
      try {
        await reviewer();
        const result = await http(STAGING, 'POST', { jwt:token, request, requestId });
        const flags = ['providerConnected','customerSendAllowed','customerQuoteAvailable','bookingAvailable','ticketIssuanceAllowed'];
        if (result?.ok !== true || result.stage !== 'AI1_TO_AI2_INTERNAL_HANDOFF_DEMO' || flags.some(k => result[k] !== false)) throw Error('Unsafe or incomplete result rejected.');
        if (result.status === 'COMPLETED' && result.handoffCompleted === true && typeof result.plan === 'string' && result.plan.startsWith('GDS RESEARCH PLAN — NOT CONNECTED')) return { status:'STAGING_HANDOFF_COMPLETED', requestId };
        if (result.status === 'DUPLICATE_COMPLETED' && result.handoffCompleted === false && result.duplicate === true) return { status:'DUPLICATE_COMPLETED_WITHOUT_AI_CALL', requestId };
        throw Error('Handoff not completed. Investigate before retrying.');
      } finally { busy = false; }
    },
    async signOut() {
      if (busy) throw Error('Wait for the current check to finish.');
      busy = true;
      try {
        if (token) {
          let response;
          try { response = await transport(BASE + '/auth/v1/logout?scope=local', { method:'POST', headers:{apikey:PUBLIC_KEY, authorization:'Bearer ' + token}, credentials:'omit', redirect:'error', signal:AbortSignal.timeout(10000) }); } catch {}
          if (!response?.ok) throw Error('Local memory cleared; server sign-out could not be confirmed.');
        }
        return {status:'SIGNED_OUT'};
      } finally { clear(); busy = false; }
    }
  };
}
