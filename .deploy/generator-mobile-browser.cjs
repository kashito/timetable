// Production entry markup with synthetic local HTTP only.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {boundary}=require('./homework-detail-browser.cjs');
const date='2026/10/07';
const now='2026-10-07T03:00:00Z';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const width of [320,390,1280]){
  const mobile=width<700,context=await browser.newContext({viewport:{width,height:840},timezoneId:'Asia/Tokyo',isMobile:mobile,hasTouch:mobile});
  try{
   const p=await context.newPage(), errors=[], writes=[];
   p.on('pageerror',err=>errors.push(err.message));
   p.setDefaultTimeout(14000);
   await p.clock.setFixedTime(new Date(now));
   await boundary(context,{linked:true});
   await context.route('**/lesson_add_api.php*',r=>{
    if(r.request().method()!=='POST')return r.fallback();
    const payload=r.request().postDataJSON();writes.push(payload);
    return r.fulfill({json:{ok:true,row:{...payload.row,_sourceKey:'fixture:generated'}}});
   });
   await context.route('**/lesson_resize_api.php*',r=>{
    if(r.request().method()!=='POST')return r.fallback();
    const payload=r.request().postDataJSON();writes.push(payload);
    return r.fulfill({json:{ok:true,start:payload.expectedStart,end:payload.time}});
   });
   await p.goto('https://test.local/schedule_generator.php');
   await p.locator('#grid .generator-slot').first().waitFor({state:'attached'});
   const grid=p.locator('#grid .generator-grid');
   const stats=()=>p.evaluate(()=>({
    cols:getComputedStyle(document.querySelector('.generator-grid')).gridTemplateColumns.split(' ').length,
    body:document.documentElement.scrollWidth,ww:innerWidth,
    grid:document.getElementById('gridWrap').scrollWidth,gridClient:document.getElementById('gridWrap').clientWidth
   }));
   const slot=(room,number)=>p.locator('.generator-slot[data-date="'+date+'"][data-room="'+room+'"][data-slot="'+number+'"]');
   const linked=slot('青','①').locator('.generator-linked-card').first();
   const target=slot('黄','④');
   const press=el=>mobile?el.tap():el.click();
   await linked.waitFor();
   const observed=await stats();
   assert.equal(observed.cols,mobile?1:12,JSON.stringify(observed));
   assert(observed.body<=observed.ww+1,JSON.stringify(observed));
   assert(mobile?observed.grid<=observed.gridClient+1:observed.grid>observed.gridClient+500,JSON.stringify(observed));
   if(mobile){
    const second=slot('青','②');
    assert((await second.boundingBox()).y>(await linked.boundingBox()).y,'time slots stack');
    assert.match(await second.locator('.generator-mobile-slot-label').innerText(),/②.*14:20.*連結授業の続き/s);
    assert(!await target.isVisible(),'empty room is collapsed');
    const room=p.locator('.generator-mobile-room[data-lane="'+date+'|黄"]');
    await press(room);
    assert.equal(await room.getAttribute('aria-expanded'),'true');
    const add=target.locator('.add-cell');
    assert((await add.boundingBox()).height>=44,'accessible add touch target');
    assert.equal(await add.evaluate(e=>e.closest('.generator-slot').getBoundingClientRect().right<=innerWidth),true);
    await press(linked.locator('.generator-mobile-resize'));
    let dlg=p.locator('.generator-time-dialog');
    await dlg.waitFor();
    await dlg.locator('select').selectOption('end');
    await dlg.locator('input').fill('15:05');
    await press(dlg.getByRole('button',{name:'時刻を保存'}));
    await dlg.waitFor({state:'detached'});
    assert.equal(writes[0].edge,'end');assert.equal(writes[0].time,'15:05');assert.equal(writes[0].expectedEnd,'15:00');
    await target.waitFor(); // Expanded room remains reachable after the refresh.
   }else{
    assert(await target.isVisible());
    assert(!await p.locator('.generator-mobile-room').first().isVisible());
    assert(!await linked.locator('.generator-mobile-resize').isVisible());
    assert(await linked.locator('.lesson-resize-handle').first().isVisible());
    assert((await linked.boundingBox()).width>(await slot('青','①').boundingBox()).width,'desktop linked card still spans columns');
   }
   await press(target.locator('.add-cell'));
   await p.locator('#modal:not(.hidden)').waitFor();
   assert.equal(await p.locator('#fDate').inputValue(),'2026-10-07');
   assert.equal(await p.locator('#fSlot').inputValue(),'④');
   assert.equal(await p.locator('#fRoomSelect').inputValue(),'黄');
   await press(p.locator('#classTreeOpen'));
   await press(p.locator('.class-tree-choice[data-class-value="検証クラス"]'));
   await press(p.locator('#saveAdd'));
   await p.waitForFunction(()=>document.getElementById('modal').classList.contains('hidden'));
   assert.equal(writes.at(-1).action,'add');
   assert.equal(writes.at(-1).row['時間番号'],'④');
   assert.equal(writes.at(-1).row['教室'],'黄');
   assert.deepEqual(errors,[]);
   if(process.env.GENERATOR_MOBILE_SCREENSHOTS)await p.screenshot({path:process.env.GENERATOR_MOBILE_SCREENSHOTS+'-'+width+'.png'});
   console.log('PASS '+width+' px: authenticated generator markup, horizontal containment, linked card, room navigation, and create request'+(mobile?', resize request':''));
  }finally{await context.close();}
 }}finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
