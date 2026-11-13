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
 'id="frMarkupSlider"','id="frMarkupExact"','function frSetMarkup',
 'id="frLiveAiForm"','id="frLiveAiQuestion"','id="frLiveAiButton"',
 'id="frGdsPlanButton"','id="frGdsPlan"',
 'id="frQuoteCreate"','id="frQuoteReview"','id="frQuoteCopy"',
 'id="frQuoteDiscard"','id="frQuoteDraftPanel"',
 'function frQuoteText(q)','function frQuoteInvalidate(reason)',
 'frQuoteInvalidate(\'Selected flight changed.\')',
 'frQuoteInvalidate(\'Markup changed.\')',
 'frQuoteInvalidate(\'Travel details changed.\')',

 "async function gdsPlanDemo(requestPayload)", "client.gdsPlanDemo(request)",
 "mode!=='AWAITING_GDS_CONNECTION'", "commandExecutionAllowed!==false",
 "async function flightAiDemo(payload)","client.flightAiDemo(",
 "source!=='NURGAT_AI_DEMO'","data?.customerSendAllowed!==false",
 'function frRefreshMarkup','function frTotal','data-fr-demo-total',
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
 frTotal: f=>f.price+0,
 frMoney: n=>'USD '+Number(n).toLocaleString('en-US'),
 document:{querySelectorAll:()=>[]},
 $:()=>({addEventListener(){},textContent:''}),
};
vm.runInNewContext(logic,context);
assert.match(context.frAnswerFor('cheapest'),/Sample Air B.*USD 735/);
context.frTotal=f=>f.price+125;
assert.match(context.frAnswerFor('cheapest'),/Sample Air B.*USD 860/,'Helper reflects simulated markup');
assert.match(context.frAnswerFor('selected'),/Sample Air B.*USD 860/,'Selected option reflects simulated markup');
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

// Internal quote preview is explicitly non-deliverable.
assert.ok(html.includes('Customer delivery locked.'),'Demo quotation sending remains blocked');
const quoteStart=source.indexOf('function frQuoteText(q){');
const quoteEnd=source.indexOf('function frQuoteRender(){',quoteStart);
assert.ok(quoteStart>=0&&quoteEnd>quoteStart,'Quote preview formatter exists');
const quoteContext={
 frDuration:m=>Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'m',
 frMoney:n=>'USD '+n.toLocaleString('en-US')
};
vm.runInNewContext(source.slice(quoteStart,quoteEnd),quoteContext);
const testDraft={ref:'TEST-001',status:'DRAFT',route:'LUN → DXB',departure:'2026-12-15',
 tripType:'ONE_WAY',returnDate:null,adults:1,children:0,infants:0,cabin:'ECONOMY',
 airline:'Sample Air B',flightId:'DEMO-B',duration:1020,stops:2,price:735,markup:125};
const watermarked=quoteContext.frQuoteText(testDraft);
assert.match(watermarked,/INTERNAL TRAINING ONLY/);
assert.match(watermarked,/NOT A CUSTOMER QUOTE/);
assert.match(watermarked,/NEVER SEND/);
assert.match(watermarked,/USD 860/);
assert.match(watermarked,/Customer delivery: LOCKED/);
testDraft.status='REVIEWED';
assert.match(quoteContext.frQuoteText(testDraft),/REVIEWED DEMO ONLY/);
assert.match(quoteContext.frQuoteText(testDraft),/Customer delivery: LOCKED/);

console.log('PASS: dashboard syntax, all critical controls, safe data contract markers and research helper and quote-review scenarios.');
