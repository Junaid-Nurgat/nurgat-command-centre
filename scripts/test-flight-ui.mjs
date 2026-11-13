// Nurgat Tours Flight Research static and logic tests — zero third-party dependencies.
// Not an authenticated browser/E2E test. Does not contact a provider or a customer.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match,'Dashboard script found');
assert.doesNotThrow(()=>new Function(match[1]),'Dashboard JavaScript compiles');
const required=[
 'id="flight-research"','id="flightResearchForm"','id="frResults"',
 'id="frSelectedPanel"','id="frCompareTable"','id="frAskForm"',
 'id="frUseBackend"','function frSelectFlight','function frAnswerFor',
 "client.flightDemo(", "async function flightDemo(payload)",
 "mode!=='FICTIONAL_DEMO_ONLY'", "fareVerified!==false",
 "customerSendAllowed!==false", "bookingAvailable!==false",
 "ticketIssuanceAllowed!==false", "frClearSelection()", "frCompare(offers)"
];
for(const marker of required)assert.ok(html.includes(marker),'Missing safeguard/UI marker: '+marker);
assert.ok(html.includes('NOT REAL FLIGHTS'),'Demo result warning visible');
assert.ok(html.includes('No GDS search was performed'),'No fake live search claim');
const source=match[1];
const start=source.indexOf('function frAnswerFor(intent){');
const end=source.indexOf('const frDateToday=',start);
assert.ok(start>0&&end>start,'Research helper functions found');
const logic=source.slice(start,end);
const context={
 frCurrentOffers:[
  {airline:'Sample Air A',flight:'DEMO-A',duration:785,stops:1,price:890,note:'Balanced example'},
  {airline:'Sample Air B',flight:'DEMO-B',duration:1020,stops:2,price:735,note:'Lowest sample total'},
  {airline:'Sample Air C',flight:'DEMO-C',duration:645,stops:0,price:1190,note:'Shortest sample itinerary'}
 ],
 frSelectedFlight:'DEMO-B',
 frDuration: m=>Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'m',
 document:{querySelectorAll:()=>[]},
 $:()=>({addEventListener(){},textContent:''}),
};
vm.runInNewContext(logic,context);
assert.match(context.frAnswerFor('cheapest'),/Sample Air B.*USD 735/);
assert.match(context.frAnswerFor('fastest'),/Sample Air C.*10h 45m/);
assert.match(context.frAnswerFor('fewest'),/Sample Air C.*0/);
assert.match(context.frAnswerFor('selected'),/Sample Air B/);
assert.match(context.frAnswerFor('baggage'),/not available/i);
assert.match(context.frAnswerFor('rules'),/unavailable/i);
assert.match(context.frAnswerFor('availability'),/No real availability/i);
assert.match(context.frAnswerFor('unknown'),/cannot independently research flights/i);
assert.equal(context.frIntent('Which demo option costs the least?'),'unknown','Unknown language does not fabricate an answer');
assert.equal(context.frIntent('Find the cheapest flight'),'cheapest');
assert.equal(context.frIntent('Shortest flight duration'),'fastest');
assert.equal(context.frIntent('Is baggage included?'),'baggage');
assert.equal(context.frIntent('What are cancellation fees?'),'rules');
console.log('PASS: dashboard syntax, all critical controls, safe data contract markers and research helper scenarios.');
