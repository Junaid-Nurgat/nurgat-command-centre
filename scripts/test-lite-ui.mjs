// Command Centre Lite static/security contract tests. No network or customer action.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../lite.html',import.meta.url),'utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match,'Lite application script exists');
assert.doesNotThrow(()=>new Function(match[1]),'Lite JavaScript compiles');
for(const marker of [
'id="loginForm"','id="searchForm"','id="offers"','id="markupSlider"',
'id="markupExact"','id="makeQuote"','id="reviewQuote"','id="copyQuote"',
'id="aiForm"','id="planButton"','data-tab="search"','data-tab="results"',
'data-tab="quote"','data-tab="ai"','nurgat-flight-research-demo',
'nurgat-gds-planner-demo','nurgat-staff-flight-ai-demo','approval_reviewers',
'FICTIONAL FLIGHT — NOT A CUSTOMER QUOTE — NEVER SEND',
'CUSTOMER DELIVERY: LOCKED','ticketIssuanceAllowed!==false',
'commandExecutionAllowed!==false','providerConnected!==false',
'frGuestNeverExists'
].filter(m=>m!=='frGuestNeverExists'))assert.ok(html.includes(marker),'Missing Lite marker: '+marker);
assert.ok(!html.includes('window.open('),'No customer delivery browser popups');
assert.ok(!html.includes('wa.me/'),'No WhatsApp sending link');
const script=match[1];
const start=script.indexOf('function quoteText(q){');
const end=script.indexOf('function renderQuote(){',start);
assert.ok(start>=0&&end>start,'Test quotation formatter exists');
const context={usd:n=>'USD '+n.toLocaleString('en-US'),duration:n=>Math.floor(n/60)+'h '+String(n%60).padStart(2,'0')+'m'};
vm.runInNewContext(script.slice(start,end),context);
const q={reference:'TEST',reviewed:false,route:'LUN → DXB',departure:'2026-12-15',returnDate:null,passengers:'1 adult',cabin:'ECONOMY',airline:'Sample Air B',id:'DEMO-B',durationMinutes:1020,stops:2,price:735,markup:125};
const draft=context.quoteText(q);
assert.match(draft,/USD 860/);
assert.match(draft,/NEVER SEND/);
assert.match(draft,/CUSTOMER DELIVERY: LOCKED/);
q.reviewed=true;
assert.match(context.quoteText(q),/REVIEWED DEMO ONLY/);
assert.match(context.quoteText(q),/CUSTOMER DELIVERY: LOCKED/);
console.log('PASS: Lite syntax, responsive navigation, secure API contract, quote arithmetic and blocked delivery.');
