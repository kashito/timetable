'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=process.env.GENERATOR_TEST_SOURCE||path.resolve(__dirname,'..');
function historyPage(url,stored=null){
 const nodes=new Map(),events={},storage=new Map();let installed=false;
 if(stored)storage.set('history:'+new URL(url).pathname,JSON.stringify(stored));
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',dispatchEvent:()=>{},closest:()=>({}),before:()=>{installed=true;}});return nodes.get(id);};
 const document={readyState:'loading',addEventListener:(n,f)=>events[n]=f,dispatchEvent:()=>{},createElement:()=>({}),querySelector:()=>null,
  getElementById:id=>id==='historyControls'?(installed?{}:null):['historyEarlier','historyToday','historyJump','historyLabel','gridWrap'].includes(id)?node(id):null};
 const context=vm.createContext({Date,URL,Event,JSON,document,location:new URL(url),sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},history:{state:null,replaceState:(s,t,u)=>context.location=new URL(u)}});
 context.window=context;vm.runInContext(fs.readFileSync(path.join(root,'history-window.js'),'utf8'),context);
 return {c:context,h:context.HistoryWindow,install:()=>events.DOMContentLoaded(),e:node,storage};
}
test('linked creation date is active before DOM controls exist',()=>{const p=historyPage('https://fixture.test/schedule_generator.php?linkedDate=2026-09-22');assert.equal(p.h.start(),'2026-09-22');p.install();assert.equal(p.e('historyJump').value,'2026-09-22');});
test('new linking date overrides the previous date in return URL',()=>{const p=historyPage('https://fixture.test/schedule_generator.php?date=2026-09-20&linkedDate=2026-09-22');assert.equal(p.h.start(),'2026-09-22');p.install();assert.equal(p.c.location.searchParams.get('date'),'2026-09-22');});
test('generator redirect entry also honors linking date',()=>{assert.equal(historyPage('https://fixture.test/schedule_generator.html?linkedDate=2026-09-22').h.start(),'2026-09-22');});
test('past linking date stays available',()=>{const p=historyPage('https://fixture.test/schedule_generator.php?linkedDate=2026-08-01');assert(p.h.includes('2026/08/01'));assert.equal(p.h.start(),'2026-08-01');});
test('newly added lesson date updates controls, URL and session',()=>{const p=historyPage('https://fixture.test/schedule_generator.php?linkedDate=2026-09-22');p.install();p.h.goTo('2026-09-24');assert.equal(p.e('historyJump').value,'2026-09-24');assert.equal(p.c.location.searchParams.get('date'),'2026-09-24');assert.equal(p.c.location.searchParams.get('linkedDate'),'2026-09-24');assert.equal(JSON.parse(p.storage.get('history:/schedule_generator.php')).anchor,'2026-09-24');assert.equal(historyPage(p.c.location.href).h.start(),'2026-09-24');});
test('manual Today remains usable and does not revert to the old linking date on reload',()=>{const p=historyPage('https://fixture.test/schedule_generator.php?linkedDate=2026-09-22');p.install();p.e('historyToday').onclick();const today=new Date().toLocaleDateString('sv-SE');assert.equal(p.h.start(),today);assert.equal(historyPage(p.c.location.href).h.start(),today);});
test('previous seven days works after linking',()=>{const p=historyPage('https://fixture.test/schedule_generator.php?linkedDate=2026-09-22');p.install();p.e('historyEarlier').onclick();assert.equal(p.h.start(),'2026-09-15');assert.equal(historyPage(p.c.location.href).h.start(),'2026-09-15');});
test('manual date change persists rather than stale linkedDate',()=>{const p=historyPage('https://fixture.test/schedule_generator.php?linkedDate=2026-09-22');p.install();p.e('historyJump').onchange({target:{value:'2026-09-25'}});assert.equal(historyPage(p.c.location.href).h.start(),'2026-09-25');});
test('teacher page still uses date instead of generator linkedDate',()=>{const p=historyPage('https://fixture.test/teacher2026summer.html?date=2026-09-21&linkedDate=2026-09-22');assert.equal(p.h.start(),'2026-09-21');p.install();assert.equal(p.c.location.searchParams.get('date'),'2026-09-21');});
test('student page does not rewrite its URL',()=>{const url='https://fixture.test/student.html?date=2026-09-21';const p=historyPage(url);p.install();assert.equal(p.c.location.href,url);});
test('malformed programmatic date does not change current view',()=>{const p=historyPage('https://fixture.test/schedule_generator.php?date=2026-09-21');p.h.goTo('not-a-date');assert.equal(p.h.start(),'2026-09-21');});
function viewport(){
 let heightShift=0;const grid={scrollTop:350,scrollLeft:400,getBoundingClientRect:()=>({top:100,bottom:700}),querySelector:()=>({getBoundingClientRect:()=>({bottom:172})}),querySelectorAll:()=>cells};
 const cells=[0,1,2].map(i=>({dataset:{date:'2026/09/'+(22+i),slot:'⑦',room:'青'},getBoundingClientRect:()=>({top:100+i*200+heightShift-grid.scrollTop,bottom:300+i*200+heightShift-grid.scrollTop})}));
 const c=vm.createContext({document:{getElementById:id=>id==='gridWrap'?grid:null},StaffAuth:{ready:new Promise(()=>{})},console});c.window=c;
 vm.runInContext(fs.readFileSync(path.join(root,'generator-view.js'),'utf8'),c);
 return {view:c.GeneratorView,grid,cells,shift:n=>heightShift=n};
}
test('calendar rerender retains visible date and horizontal scroll',()=>{const p=viewport(),saved=p.view.capture();p.grid.scrollTop=p.grid.scrollLeft=0;p.view.restore(saved);assert.equal(p.grid.scrollTop,350);assert.equal(p.grid.scrollLeft,400);});
test('an added row above the viewport retains the same visible date/room offset',()=>{const p=viewport(),saved=p.view.capture();p.shift(80);p.grid.scrollTop=0;p.view.restore(saved);assert.equal(p.grid.scrollTop,430);const cell=p.cells.find(e=>e.dataset.date===saved.anchor.date);assert.equal(cell.getBoundingClientRect().top-100,saved.anchor.offset);});
