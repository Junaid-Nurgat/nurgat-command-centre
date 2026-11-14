// Offline security contract test; runs without credentials, external calls or real users.
import assert from 'node:assert/strict';
import { normalizeTravelRequest, stableRequestId, assertResearchOnly } from '../src/handoff-contract.mjs';

const flight = {origin:'LUN',destination:'DXB',departureDate:'2026-12-15',returnDate:null,tripType:'ONE_WAY',adults:1,children:0,infants:0,cabin:'ECONOMY',preference:'BEST'};
const time = {today:'2026-11-14'};
const valid = normalizeTravelRequest(flight,time);
assert.deepEqual(valid, flight);
const round = {...flight,tripType:'ROUND_TRIP',returnDate:'2026-12-31'};
assert.deepEqual(normalizeTravelRequest(round,time),round);

const reject = (v, message) => assert.throws(()=>normalizeTravelRequest(v,time),Error,message);
reject({...flight,customerPhone:'260000000'},'unexpected personal data');
reject({...flight,customerName:'Example'},'unexpected name');
reject({...flight,adults:0},'zero adults');
reject({...flight,adults:1.5},'fractional passenger');
reject({...flight,infants:2},'infants exceed adults');
reject({...flight,children:9},'total exceeds limit');
reject({...flight,origin:'DXB'},'same route');
reject({...flight,origin:'lux'},'invalid airport');
reject({...flight,departureDate:'2026-11-31'},'invalid day');
reject({...flight,departureDate:'2026-10-03'},'past');
reject({...flight,departureDate:'2030-10-03'},'beyond window');
reject({...flight,returnDate:'2026-12-31'},'one-way return rejected');
reject({...round,returnDate:'2026-12-14'},'return before departure');
reject({...round,returnDate:'2026-12-33'},'invalid return');
reject({...flight,cabin:'UNKNOWN'},'cabin not allowed');
reject({...flight,preference:'INSTRUCTIONS'},'untrusted priority');

const signingKey = 'a-private-key-not-committed-in-real-use-1234567'; // fixture-only dummy
const event = {provider:'internal-fixture',eventId:'fictional-provider-message-id-123456',signingKey};
const id = stableRequestId(event);
assert.match(id,/^ev_[a-f0-9]{48}$/);
assert.equal(stableRequestId(event),id,'same signed event should dedupe');
assert.notEqual(stableRequestId({...event,eventId:event.eventId+'2'}),id,'different events must not collide');
assert.throws(()=>stableRequestId({...event,signingKey:'short'}));
assert.throws(()=>stableRequestId({...event,provider:'unknown-provider'}));

const safe = {ok:true,mode:'AWAITING_GDS_CONNECTION',providerConnected:false,commandExecutionAllowed:false,customerSendAllowed:false,bookingAvailable:false,ticketIssuanceAllowed:false,plan:'GDS RESEARCH PLAN — NOT CONNECTED. Research requirements only.'};
assert.equal(assertResearchOnly(safe).customerSendAllowed,false);
assert.throws(()=>assertResearchOnly({...safe,customerSendAllowed:true}));
assert.throws(()=>assertResearchOnly({...safe,providerConnected:true}));
assert.throws(()=>assertResearchOnly({...safe,plan:'Live seat available for payment'}));
assert.throws(()=>assertResearchOnly({...safe,plan:'GDS RESEARCH PLAN — NOT CONNECTED. Ticket issued'}));
console.log('PASS: server-side handoff schema, no-PII, stable dedupe IDs and AI2 safety contract.');
