import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/checkUser\(\);\s*$/, '');
const elements=new Map();
function el(id){if(!elements.has(id))elements.set(id,{value:'',textContent:'',disabled:false,required:false,classList:{add(){},remove(){},toggle(){}},addEventListener(type,fn){this[type]=fn},replaceChildren(){},append(){},setAttribute(){},click(){return this.clickHandler?.()}});return elements.get(id)}
const document={getElementById:el,querySelectorAll:()=>[],createElement:()=>({classList:{},append(){},addEventListener(){}})};
// Preserve the registered makeQuote click handler in the DOM stub.
for(const id of ['makeQuote']){const e=el(id);e.addEventListener=function(type,fn){this.clickHandler=fn};}
const context=vm.createContext({document,sessionStorage:{getItem:()=>null},window:{scrollTo(){}},Date,console,crypto:{randomUUID:()=> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},confirm:()=>true,fetch:()=>{throw Error('Unexpected network')},navigator:{clipboard:{}}});
vm.runInContext(script,context);
const row={id:'saved-id',demo_only:true,origin:'LUN',destination:'DXB',departure_date:'2026-12-20',return_date:'2026-12-27',trip_type:'ROUND_TRIP',adults:1,children:0,infants:0,cabin:'ECONOMY',preference:'BEST',selected_id:'DEMO-B',markup:150,has_draft:true};
context.row=row;
vm.runInContext("user={id:'staff-a'}; token={access_token:'DO_NOT_SAVE'}; restoreFields(row); searchContext=searchData(); offers=[{id:'DEMO-B',airline:'Sample Air B',price:735,durationMinutes:1020,stops:2}]; selected='DEMO-B'; $('makeQuote').click();",context);
assert.equal(vm.runInContext('quote.price+quote.markup',context),885);
assert.equal(vm.runInContext('quote.reviewed',context),false);
const snap=JSON.parse(vm.runInContext('JSON.stringify(snapshotData())',context));
assert.equal(snap.has_draft,true);assert.equal(snap.selected_id,'DEMO-B');assert.equal(snap.markup,150);
assert.ok(!JSON.stringify(snap).includes('DO_NOT_SAVE'));assert.ok(!('reviewed' in snap));
el('returnDate').value='2026-12-28';
assert.equal(vm.runInContext('snapshotData().has_draft',context),false,'Changed travel fields cannot save a stale draft');
context.row={...row,trip_type:'ONE_WAY',return_date:null,selected_id:null,has_draft:false};
vm.runInContext('restoreFields(row)',context);
assert.equal(el('returnDate').disabled,true);assert.equal(vm.runInContext('searchData().returnDate',context),null);
vm.runInContext('setLoggedOut()',context);
assert.equal(vm.runInContext('savedRows.length',context),0);
assert.equal(vm.runInContext('pendingSave',context),null);
console.log('PASS: saved request round-trip, draft total, reset review, stale-draft exclusion, one-way restore, credential exclusion and logout cleanup.');
