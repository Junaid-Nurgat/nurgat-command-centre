import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadOnlyFlightAdapter, normalizeFlightSearchRequest, FlightAdapterError } from '../api/flight-search-adapter.mjs';

const request = Object.freeze({
  origin: 'lun', destination: 'DXB', departureDate: '2027-08-10',
  returnDate: '2027-08-22', tripType: 'ROUND_TRIP',
  adults: 2, children: 0, infants: 0, cabin: 'ECONOMY', preference: 'BEST'
});
const fictional = {
  offers: [{
    providerOfferId: 'DEMO-001',
    carrier: 'Fictional Sample Airline',
    currency: 'USD',
    totalMinorUnits: 125000,
    stops: 1,
    durationMinutes: 530,
    expiresAt: null,
    bookingAvailable: true, // Must never become an enabled booking capability.
    fareVerified: true // Must never become a verified fare.
  }]
};
function adapter(search = async () => fictional, other = {}) {
  return createReadOnlyFlightAdapter({
    name: 'fictional-provider', environment: 'MOCK', search, ...other
  });
}

test('normalizes a round-trip request and accepts airport input case-insensitively', () => {
  const x = normalizeFlightSearchRequest(request);
  assert.equal(x.origin, 'LUN');
  assert.equal(x.destination, 'DXB');
  assert.equal(x.returnDate, '2027-08-22');
  assert.equal(Object.isFrozen(x), true);
});

test('one-way requests discard a return date', () => {
  const x = normalizeFlightSearchRequest({ ...request, tripType: 'ONE_WAY' });
  assert.equal(x.returnDate, null);
});

test('rejects invalid airports, calendar dates, trip and passenger counts', () => {
  const examples = [
    { origin: '123' }, { origin: 'DXB' }, { departureDate: '2027-02-30' },
    { tripType: 'ROUND_TRIP', returnDate: '2027-08-01' },
    { tripType: 'RETURN' }, { adults: 0 }, { children: 9 },
    { infants: 3 }, { cabin: 'SECRET' }, { preference: 'UNKNOWN' },
    { adults: 8, children: 2 }
  ];
  for (const change of examples) {
    assert.throws(() => normalizeFlightSearchRequest({ ...request, ...change }),
      e => e instanceof FlightAdapterError && e.code === 'INVALID_REQUEST');
  }
});

test('normalizes provider offers but always keeps customer sending and booking locked', async () => {
  const x = await adapter().searchFlights(request);
  assert.equal(x.ok, true);
  assert.equal(x.stage, 'READ_ONLY_PREPRODUCTION');
  assert.equal(x.provider, 'fictional-provider');
  assert.equal(x.environment, 'MOCK');
  assert.equal(x.offers.length, 1);
  assert.equal(x.offers[0].totalMinorUnits, 125000);
  assert.equal(x.offers[0].sourceProvider, 'fictional-provider');
  assert.equal(x.protections.fareVerified, false);
  assert.equal(x.protections.customerSendAllowed, false);
  assert.equal(x.protections.bookingAvailable, false);
  assert.equal(x.protections.ticketIssuanceAllowed, false);
  assert.equal(x.protections.humanApprovalRequired, true);
  assert.equal('bookingAvailable' in x.offers[0], false);
  assert.equal('fareVerified' in x.offers[0], false);
});

test('allows an empty provider result without inventing availability', async () => {
  const x = await adapter(async () => ({ offers: [] })).searchFlights(request);
  assert.deepEqual(x.offers, []);
});

test('rejects invalid provider responses and duplicate offer IDs', async () => {
  const badReplies = [
    null, {}, { offers: 'wrong' }, { offers: Array(21).fill(fictional.offers[0]) },
    { offers: [{ ...fictional.offers[0], totalMinorUnits: -1 }] },
    { offers: [{ ...fictional.offers[0], totalMinorUnits: 99.99 }] },
    { offers: [{ ...fictional.offers[0], currency: 'USDD' }] },
    { offers: [fictional.offers[0], fictional.offers[0]] }
  ];
  for (const result of badReplies) {
    await assert.rejects(adapter(async () => result).searchFlights(request),
      e => e instanceof FlightAdapterError && e.code === 'INVALID_PROVIDER_RESPONSE');
  }
});

test('masks provider errors so tokens and private details never reach the UI', async () => {
  const leakyError = 'Authorization Bearer PRIVATE_PROVIDER_TOKEN user@example.com';
  await assert.rejects(adapter(async () => { throw new Error(leakyError); }).searchFlights(request),
    e => e.code === 'PROVIDER_UNAVAILABLE' && !e.message.includes('PRIVATE_PROVIDER_TOKEN')
      && !e.message.includes('user@example.com'));
});

test('times out unresponsive providers and requests cancellation', async () => {
  let signal;
  const x = adapter(async (_req, opts) => {
    signal = opts.signal;
    return new Promise(() => {});
  }, { timeoutMs: 25 });
  await assert.rejects(x.searchFlights(request),
    e => e.code === 'PROVIDER_TIMEOUT');
  assert.equal(signal.aborted, true);
});

test('rejects production mode and invalid transport configuration', () => {
  assert.throws(() => createReadOnlyFlightAdapter({
    name: 'unapproved', environment: 'PRODUCTION', search: async () => ({ offers: [] })
  }), /MOCK or SANDBOX/);
  assert.throws(() => createReadOnlyFlightAdapter({
    name: 'no-transport', environment: 'MOCK'
  }), /MOCK or SANDBOX/);
});

test('passes normalized request and abort signal into a sandbox transport', async () => {
  let received;
  const x = createReadOnlyFlightAdapter({
    name: 'future-authorized-provider', environment: 'SANDBOX',
    search: async (req, options) => {
      received = { req, signal: options.signal };
      return { offers: [] };
    }
  });
  const result = await x.searchFlights(request);
  assert.equal(received.req.origin, 'LUN');
  assert.equal(received.signal instanceof AbortSignal, true);
  assert.equal(result.environment, 'SANDBOX');
  assert.equal(result.protections.bookingAvailable, false);
  assert.equal(typeof x.bookFlight, 'undefined');
  assert.equal(typeof x.issueTicket, 'undefined');
});
