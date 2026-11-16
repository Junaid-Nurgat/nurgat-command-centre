// Nurgat Tours — STAGING ONLY, no real customers or provider/GDS operations.
// The browser's reviewer session is verified at Supabase; only a separate
// server-to-server service credential goes to n8n.
const ORIGIN = 'https://junaid-nurgat.github.io';
const REQUEST_KEYS = ['origin','destination','departureDate','returnDate','tripType',
  'adults','children','infants','cabin','preference'];
const LOCKED = Object.freeze({
  providerConnected: false, customerSendAllowed: false,
  bookingAvailable: false, ticketIssuanceAllowed: false
});
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': ORIGIN,
    vary: 'Origin',
    'x-content-type-options': 'nosniff'
  }
});
const validDate = (value, today) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < today) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === value;
};
const isUUID = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function validateStagingPayload(body, today) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(k => !['requestId','request'].includes(k))) return null;
  const { requestId, request: r } = body;
  if (typeof requestId !== 'string' || !/^STAGE_[A-Za-z0-9_-]{12,64}$/.test(requestId) ||
      !r || typeof r !== 'object' || Array.isArray(r) ||
      Object.keys(r).some(k => !REQUEST_KEYS.includes(k)) ||
      REQUEST_KEYS.some(k => !Object.hasOwn(r, k))) return null;
  // Match the agency's existing fictional single-passenger staging fixture.
  if (r.origin !== 'LUN' || r.destination !== 'DXB' ||
      !validDate(r.departureDate, today) || r.returnDate !== null ||
      r.tripType !== 'ONE_WAY' || r.adults !== 1 || r.children !== 0 ||
      r.infants !== 0 || r.cabin !== 'ECONOMY' || r.preference !== 'BEST') return null;
  return {
    requestId,
    request: Object.fromEntries(REQUEST_KEYS.map(k => [k,r[k]]))
  };
}

export function createStagingHandoff({ authorizeReviewer, serviceCredential, dispatch,
  now = () => new Date() } = {}) {
  if (typeof authorizeReviewer !== 'function' || typeof serviceCredential !== 'function' ||
      typeof dispatch !== 'function' || typeof now !== 'function') {
    throw new TypeError('A reviewer verifier, service credential loader and dispatcher are required.');
  }
  return async function handle(req) {
    if (req.headers.get('origin') !== ORIGIN) return json({ok:false,message:'Staff dashboard required.'},403);
    if (req.method === 'OPTIONS') return new Response(null,{status:204,headers:{
      'access-control-allow-origin': ORIGIN,
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'authorization, apikey, content-type',
      vary: 'Origin'
    }});
    if (req.method !== 'POST') return json({ok:false,message:'POST required.'},405);
    const match = req.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i);
    const staffJwt = match?.[1];
    if (!staffJwt || staffJwt.length > 5000) return json({ok:false,message:'Staff sign-in required.'},401);
    let actorId;
    try { actorId = await authorizeReviewer(staffJwt); }
    catch { return json({ok:false,message:'Staff authorization unavailable.'},503); }
    if (!isUUID(actorId)) return json({ok:false,message:'Approved reviewer required.'},403);
    if (!(req.headers.get('content-type') || '').toLowerCase().includes('application/json'))
      return json({ok:false,message:'JSON required.'},400);
    let raw;
    try { raw = await req.text(); }
    catch { return json({ok:false,message:'Could not read request.'},400); }
    if (raw.length > 2500) return json({ok:false,message:'Staging request is too large.'},413);
    let body;
    try { body = JSON.parse(raw); } catch { return json({ok:false,message:'Invalid JSON.'},400); }
    const fixture = validateStagingPayload(body, now().toISOString().slice(0,10));
    if (!fixture) return json({ok:false,message:'Only the approved fictional staging request is supported.'},400);
    const secret = serviceCredential();
    // Never silently fall back to a staff JWT, publishable key, or hard-coded demo password.
    if (typeof secret !== 'string' || secret.length < 32)
      return json({ok:false,message:'Staging service authentication is not configured.'},503);
    // Only the verified actor ID, a stable request ID and the fictional fixture travel fields
    // are sent to n8n. NEVER forward reusable staff access/refresh tokens.
    const outgoing = Object.freeze({
      ...fixture, actorId, mode:'STAGING_INTERNAL_ONLY', ...LOCKED
    });
    let answer;
    try { answer = await dispatch(outgoing, secret); }
    catch { return json({ok:false,message:'Internal staging handoff is unavailable. No booking occurred.'},502); }
    if (!answer || answer.ok !== true || answer.mode !== 'STAGING_INTERNAL_ONLY' ||
        answer.providerConnected !== false || answer.customerSendAllowed !== false ||
        answer.bookingAvailable !== false || answer.ticketIssuanceAllowed !== false ||
        typeof answer.plan !== 'string' || !answer.plan.startsWith('GDS RESEARCH PLAN — NOT CONNECTED') ||
        answer.plan.length > 2500) {
      return json({ok:false,message:'Unsafe or invalid staging handoff response.'},502);
    }
    return json({
      ok: true, mode:'STAGING_INTERNAL_ONLY', status:'VERIFIED_STAGING_RESPONSE',
      plan: answer.plan, ...LOCKED
    });
  };
}
