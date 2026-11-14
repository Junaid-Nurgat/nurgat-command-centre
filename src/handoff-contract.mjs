// Server-side-only contract helpers for FUTURE authorized WhatsApp ingress.
// Not deployed, not used by the n8n workflow yet. Never include secrets or PII in this repository.
import { createHmac } from 'node:crypto';

const allowed = new Set(['origin','destination','departureDate','returnDate','tripType','adults','children','infants','cabin','preference']);
const cabins = new Set(['ECONOMY','PREMIUM_ECONOMY','BUSINESS','FIRST']);
const priorities = new Set(['BEST','CHEAPEST','FASTEST','FEWEST_STOPS']);
const calendarDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(value + 'T00:00:00.000Z');
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0,10) !== value ? null : value;
};
function integer(value, lower, upper) {
  return typeof value === 'number' && Number.isInteger(value) && value >= lower && value <= upper;
}
export function normalizeTravelRequest(raw, {today = new Date().toISOString().slice(0,10)} = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Structured travel request required');
  if (Object.keys(raw).length !== allowed.size || Object.keys(raw).some(k => !allowed.has(k))) throw new Error('Unsupported fields; customer PII not accepted');
  const from = raw.origin, to = raw.destination;
  if (typeof from !== 'string' || typeof to !== 'string' || !/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to) || from === to) throw new Error('Invalid airport route');
  const start = calendarDate(raw.departureDate);
  if (!start || !calendarDate(today) || start < today) throw new Error('Invalid departure date');
  const max = new Date(today + 'T00:00:00.000Z');
  max.setUTCMonth(max.getUTCMonth() + 18);
  if (start > max.toISOString().slice(0,10)) throw new Error('Departure outside booking window');
  if (!['ROUND_TRIP','ONE_WAY'].includes(raw.tripType)) throw new Error('Invalid trip type');
  if (raw.tripType === 'ONE_WAY' && raw.returnDate !== null) throw new Error('One-way return must be null');
  if (raw.tripType === 'ROUND_TRIP') {
    const ret = calendarDate(raw.returnDate);
    if (!ret || ret <= start || ret > max.toISOString().slice(0,10)) throw new Error('Invalid return date');
  }
  if (!integer(raw.adults,1,9) || !integer(raw.children,0,8) || !integer(raw.infants,0,9) || raw.infants > raw.adults || raw.adults + raw.children > 9) throw new Error('Invalid passenger counts');
  if (!cabins.has(raw.cabin) || !priorities.has(raw.preference)) throw new Error('Invalid cabin or sorting');
  return Object.fromEntries([...allowed].map(k => [k,raw[k]]));
}
export function stableRequestId({provider, eventId, signingKey}) {
  // Use only trusted, verified event IDs supplied by the approved provider.
  // HMAC avoids storing raw message IDs, and prevents predictable IDs without the private server key.
  if (!['whatsapp-cloud-api','internal-fixture'].includes(provider)) throw new Error('Unapproved source');
  if (typeof eventId !== 'string' || eventId.length < 12 || eventId.length > 256) throw new Error('Invalid event ID');
  if (typeof signingKey !== 'string' || signingKey.length < 32) throw new Error('Secret signing key must be provisioned server-side');
  return 'ev_' + createHmac('sha256', signingKey).update(provider + '\0' + eventId).digest('hex').slice(0,48);
}
export function assertResearchOnly(response) {
  if (!response || response.ok !== true || response.mode !== 'AWAITING_GDS_CONNECTION' ||
    response.providerConnected !== false || response.commandExecutionAllowed !== false ||
    response.customerSendAllowed !== false || response.bookingAvailable !== false ||
    response.ticketIssuanceAllowed !== false || typeof response.plan !== 'string' ||
    response.plan.length > 2500 || !response.plan.startsWith('GDS RESEARCH PLAN — NOT CONNECTED')) {
    throw new Error('Unsafe or unverified AI2 response');
  }
  if (/\b(?:TTP|FXP|ticket issued|booking confirmed|payment received|supplier|wholesale|markup|commission)\b/i.test(response.plan)) throw new Error('Unsupported supplier or booking assertion');
  return {ok:true, status:'RESEARCH_ONLY', customerSendAllowed:false, bookingAvailable:false, ticketIssuanceAllowed:false, plan:response.plan};
}
