/**
 * Nurgat Tours — provider-neutral, read-only flight-search adapter.
 *
 * PRE-PRODUCTION ONLY: This module has no network URL, provider credentials,
 * customer message, booking, payment, or ticket-issuance method.
 * A future provider-specific backend transport can be injected after authorization.
 */
const AIRPORT = /^[A-Z]{3}$/;
const CURRENCY = /^[A-Z]{3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CABINS = new Set(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']);
const PREFERENCES = new Set(['BEST', 'CHEAPEST', 'FASTEST', 'FEWEST_STOPS']);
const ERROR_MESSAGES = Object.freeze({
  INVALID_REQUEST: 'Check the flight-search details and try again.',
  INVALID_PROVIDER_RESPONSE: 'The flight provider returned unexpected data. No quote was created.',
  PROVIDER_TIMEOUT: 'The flight provider took too long. Try again later.',
  PROVIDER_UNAVAILABLE: 'The flight provider is temporarily unavailable. Try again later.'
});

export class FlightAdapterError extends Error {
  constructor(code) {
    super(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.PROVIDER_UNAVAILABLE);
    this.name = 'FlightAdapterError';
    this.code = code;
  }
}

const invalid = () => { throw new FlightAdapterError('INVALID_REQUEST'); };
const badResponse = () => { throw new FlightAdapterError('INVALID_PROVIDER_RESPONSE'); };

function calendarDate(value) {
  if (typeof value !== 'string' || !DATE.test(value)) return false;
  const year = Number(value.slice(0, 4));
  if (year < 2020 || year > 2100) return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function normalizeFlightSearchRequest(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) invalid();
  const origin = typeof raw.origin === 'string' ? raw.origin.trim().toUpperCase() : '';
  const destination = typeof raw.destination === 'string' ? raw.destination.trim().toUpperCase() : '';
  const tripType = raw.tripType;
  const departureDate = raw.departureDate;
  const returnDate = tripType === 'ONE_WAY' ? null : raw.returnDate;
  const cabin = raw.cabin;
  const preference = raw.preference;
  const adults = raw.adults;
  const children = raw.children;
  const infants = raw.infants;
  if (!AIRPORT.test(origin) || !AIRPORT.test(destination) || origin === destination) invalid();
  if (!calendarDate(departureDate) || !['ROUND_TRIP', 'ONE_WAY'].includes(tripType)) invalid();
  if (tripType === 'ROUND_TRIP' && (!calendarDate(returnDate) || returnDate <= departureDate)) invalid();
  if (!CABINS.has(cabin) || !PREFERENCES.has(preference)) invalid();
  if (!Number.isInteger(adults) || adults < 1 || adults > 9
      || !Number.isInteger(children) || children < 0 || children > 8
      || !Number.isInteger(infants) || infants < 0 || infants > adults
      || adults + children > 9) invalid();
  return Object.freeze({
    origin, destination, departureDate, returnDate, tripType,
    adults, children, infants, cabin, preference
  });
}

function normalizeOffers(raw, providerName, environment) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.offers)
      || raw.offers.length > 20) badResponse();
  const used = new Set();
  const offers = raw.offers.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) badResponse();
    const { providerOfferId, carrier, currency, totalMinorUnits, stops, durationMinutes, expiresAt } = item;
    if (typeof providerOfferId !== 'string' || !providerOfferId.trim()
        || providerOfferId.length > 256 || used.has(providerOfferId)
        || typeof carrier !== 'string' || !carrier.trim() || carrier.length > 80
        || typeof currency !== 'string' || !CURRENCY.test(currency)
        || !Number.isSafeInteger(totalMinorUnits) || totalMinorUnits < 0
        || !Number.isInteger(stops) || stops < 0 || stops > 8
        || !Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 10080
        || (expiresAt != null && (typeof expiresAt !== 'string'
           || Number.isNaN(Date.parse(expiresAt))))) badResponse();
    used.add(providerOfferId);
    return {
      providerOfferId, carrier, currency, totalMinorUnits, stops,
      durationMinutes, expiresAt: expiresAt ?? null,
      sourceProvider: providerName, sourceEnvironment: environment
    };
  });
  return offers;
}

/**
 * @param {{name:string, environment:'MOCK'|'SANDBOX',
 *   search:(normalizedRequest:object, options:{signal:AbortSignal})=>Promise<{offers:object[]}>,
 *   timeoutMs?:number}} config
 */
export function createReadOnlyFlightAdapter({ name, environment, search, timeoutMs = 8000 } = {}) {
  if (typeof name !== 'string' || !name.trim() || name.length > 80
      || !['MOCK', 'SANDBOX'].includes(environment)
      || typeof search !== 'function'
      || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) {
    throw new TypeError('Adapter requires a named MOCK or SANDBOX search transport and a valid timeout.');
  }
  return Object.freeze({
    provider: name,
    environment,
    async searchFlights(rawRequest) {
      const request = normalizeFlightSearchRequest(rawRequest);
      const controller = new AbortController();
      let timer;
      try {
        const providerResult = await Promise.race([
          Promise.resolve().then(() => search(request, { signal: controller.signal })),
          new Promise((_, reject) => {
            timer = setTimeout(() => {
              controller.abort();
              reject(new FlightAdapterError('PROVIDER_TIMEOUT'));
            }, timeoutMs);
          })
        ]);
        const offers = normalizeOffers(providerResult, name, environment);
        return {
          ok: true,
          stage: 'READ_ONLY_PREPRODUCTION',
          provider: name,
          environment,
          offers,
          protections: {
            fareVerified: false,
            customerSendAllowed: false,
            bookingAvailable: false,
            ticketIssuanceAllowed: false,
            humanApprovalRequired: true
          }
        };
      } catch (error) {
        // Never return underlying provider errors: they may contain credentials or PII.
        if (error instanceof FlightAdapterError) throw error;
        throw new FlightAdapterError('PROVIDER_UNAVAILABLE');
      } finally {
        clearTimeout(timer);
      }
    }
  });
}
