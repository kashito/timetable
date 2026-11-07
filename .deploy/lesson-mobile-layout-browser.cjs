// Isolated real-page regression: all HTTP is synthetic, no production data or sessions.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {boundary}=require('./homework-detail-browser.cjs');
const root=path.resolve(__dirname,'..'),groupId='a'.repeat(24),date='2026-10-07';
const screenshots=process.env.LESSON_MOBILE_SCREENSHOTS;
const viewports=[{name:'phone',width:390,height:844},{name:'small-phone',width:320,height:740},{name:'desktop',width:1280,height:1000}];
const selected=process.env.LESSON_MOBILE_CASE;
const press=(locator,mobile)=>mobile?locator.tap():locator.click();
async function run(browser,viewport,entry){
 const linked=entry==='linked',mobile=viewport.width<600;
 const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},timezoneId:'Asia/Tokyo',isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage(),errors=[],notes=[],notePosts=[];let failRecord=false,failNote=false;
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
 await page.clock.setFixedTime(new Date('2026-10-07T03:00:00Z'));
 const fixtures=await boundary(context,{linked});
 await context.route('**/staff_auth_api.php*',route=>route.fulfill({json:{ok:true,user:{id:'fixture',name:'検証講師',role:'teacher'},csrf:'fixture'}}));
 await context.route('**/shared_notes_api.php*',async route=>{
  const req=route.request();if(req.method()==='POST'){
   const body=req.postDataJSON();if(failNote)return route.fulfill({status:500,json:{ok:false,error:'検証用の先生連絡保存失敗'}});
   notePosts.push(body);if(body.action==='post')notes.push({id:'note'+notes.length,text:body.text,completionHistory:[],author:'検証講師',createdAt:'2026-10-07T03:00:00Z',assignees:[],done:false,todo:false,canManage:true,canComplete:true,version:'1'});
  }
  return route.fulfill({json:{ok:true,notes,counts:{},staff:[]}});
 });
 await context.route('**/lesson_*_api.php*',async route=>{
  if(failRecord&&route.request().method()==='POST'&&/lesson_(record|group)_api\.php/.test(route.request().url()))return route.fulfill({status:500,json:{ok:false,error:'検証用のカルテ保存失敗'}});
  if(route.request().method()==='POST'&&route.request().url().includes('lesson_group_api.php')){const body=route.request().postDataJSON();if(body.homeworkTaskRefs)fixtures.records['GROUP:'+groupId].homeworkTaskRefs=body.homeworkTaskRefs;}
  return route.fallback();
 });
 const id={due:linked?'groupDueHomework':'lessonDueHomework',memo:linked?'groupMemo':'lessonRecordMemo',next:linked?'groupHomework':'lessonHomework',teacher:linked?'groupSharedMemo':'teacherMemo',save:linked?'groupSave':'opsSave',message:linked?'groupMessage':'opsMsg'};
 const open=async()=>{
  if(linked){await page.goto('https://test.local/lesson_group.html?id='+groupId);await page.locator('#groupContent:not([hidden])').waitFor();}
  else{if(!page.url().includes('teacher2026summer'))await page.goto('https://test.local/'+(entry==='whole'?'teacher2026summer.html':'teacher2026summer_vertical.html')+'?teacher='+encodeURIComponent('検証講師'));const card=page.locator('#schedule .event[data-date="'+date+'"]').first();await card.waitFor();if(entry==='whole'&&viewport.width<350)await card.dispatchEvent('click');else await card.click();await page.locator('#teacherOpsModal:not(.hidden)').waitFor();}
  await page.waitForFunction(ids=>ids.every(id=>document.getElementById(id)?._homeworkItems),[id.due,id.next]);
  await page.locator('.lesson-detail-teachers').waitFor();
 };
 const editor=kind=>page.locator('#'+id[kind]).evaluate(e=>{e._homeworkItems.root.dataset.mobileTestEditor=e.id;});
 const input=kind=>page.locator('[data-mobile-test-editor="'+id[kind]+'"] .homework-item-text').first();
 async function bindEditors(){await editor('due');await editor('next');}
 try{
  await open();await bindEditors();
  const blocks=await page.locator('.lesson-detail-due,.lesson-detail-karte,.lesson-detail-next,.lesson-detail-teachers').evaluateAll(nodes=>nodes.map(e=>['due','karte','next','teachers'].find(k=>e.classList.contains('lesson-detail-'+k))));
  assert.deepEqual(blocks,['due','karte','next','teachers'],'same panel order across entry points');
  for(const [field,section] of [['due','due'],['memo','karte'],['next','next'],['teacher','teachers']])assert.equal(await page.locator('#'+id[field]).evaluate((e,selector)=>!!e.closest(selector),'.lesson-detail-'+section),true,field+' in its own card');
  const dimensions=await page.locator('.lesson-detail-due,.lesson-detail-next').evaluateAll(nodes=>nodes.map(e=>({width:e.getBoundingClientRect().width,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right})));
  assert(dimensions.every(x=>x.width>180&&(!mobile||x.left>=-1&&x.right<=viewport.width+1)),'homework card width');
  if(mobile){
   const fontSizes=await page.locator('.lesson-detail-due .homework-item-text,.lesson-detail-next .homework-item-text,#'+id.memo+',#'+id.teacher).evaluateAll(nodes=>nodes.map(e=>parseFloat(getComputedStyle(e).fontSize)));
   assert(fontSizes.every(size=>size>=16),'mobile inputs prevent automatic zoom: '+fontSizes.join(','));
   const tapTargets=await page.locator('#'+id.save+',.lesson-detail-due .homework-item-add,.lesson-detail-next .homework-item-add').evaluateAll(nodes=>nodes.map(e=>({text:e.textContent,height:e.getBoundingClientRect().height})));
   assert(tapTargets.every(x=>x.height>=44),'44px tap controls: '+JSON.stringify(tapTargets));
  }
  await input('due').fill('今回だけの予習 P12');await input('next').fill('次回までの復習 P20');await page.locator('#'+id.memo).fill('理解度とつまずきを記録\n次回は復習から開始');
  // Japanese IME Enter must not accidentally create an extra homework row.
  const before=await page.locator('[data-mobile-test-editor="'+id.next+'"] .homework-item-text').count();
  await input('next').dispatchEvent('keydown',{key:'Enter',code:'Enter',isComposing:true});
  assert.equal(await page.locator('[data-mobile-test-editor="'+id.next+'"] .homework-item-text').count(),before,'IME conversion preserves item count');
  // Normal Enter adds a row, removal synchronizes the hidden serialized source.
  await input('next').press('Enter');
  const nextRows=page.locator('[data-mobile-test-editor="'+id.next+'"] .homework-item-row');
  assert.equal(await nextRows.count(),before+1);await nextRows.nth(1).locator('.homework-item-text').fill('追加して削除する宿題');
  assert((await page.locator('#'+id.next).inputValue()).includes('追加して削除する宿題'));
  await press(nextRows.nth(1).locator('.homework-item-remove'),mobile);assert.equal(await nextRows.count(),before);
  assert(!(await page.locator('#'+id.next).inputValue()).includes('追加して削除する宿題'));
  // Optional deadline controls are operable and date/time metadata survives saving.
  const options=nextRows.first().locator('.homework-item-options');
  if(!await options.evaluate(e=>e.open))await press(options.locator('summary'),mobile);
  const dueDate=nextRows.first().locator('.homework-item-due'),dueTime=nextRows.first().locator('.homework-item-due-time');
  await dueDate.fill('2026-10-09');await dueTime.fill('18:30');
  await dueDate.fill('');assert.equal(await dueTime.isDisabled(),true);assert.equal(await dueTime.inputValue(),'');
  await dueDate.fill('2026-10-09');assert.equal(await dueTime.isEnabled(),true);await dueTime.fill('18:30');
  await page.locator('#'+id.teacher).fill('先生向け：次回はプリントを用意');
  failNote=true;await press(page.locator('#'+id.save),mobile);await page.waitForFunction(id=>document.getElementById(id).textContent.includes('先生連絡保存失敗'),id.message);
  assert.equal(await page.locator('#'+id.teacher).inputValue(),'先生向け：次回はプリントを用意');assert.equal(await page.locator('#'+id.memo).inputValue(),'理解度とつまずきを記録\n次回は復習から開始');
  failNote=false;failRecord=true;await press(page.locator('#'+id.save),mobile);await page.waitForFunction(id=>document.getElementById(id).textContent.includes('カルテ保存失敗'),id.message);
  assert.equal(await input('due').inputValue(),'今回だけの予習 P12');assert.equal(await input('next').inputValue(),'次回までの復習 P20');
  failRecord=false;await press(page.locator('#'+id.save),mobile);
  if(linked)await page.waitForFunction(()=>document.getElementById('groupMessage').textContent.includes('保存しました'));
  else await page.locator('#teacherOpsModal').waitFor({state:'hidden'});
  assert.equal(notePosts.filter(p=>p.action==='post').length,1,'retry does not duplicate teacher message');
  const saved=linked?fixtures.records['GROUP:'+groupId]:fixtures.posts.filter(p=>p.file==='lesson_record_api.php').at(-1).body;
  assert(saved.dueHomework.startsWith('今回だけの予習 P12'));assert(saved.homework.startsWith('次回までの復習 P20'));assert.equal(saved.memo,'理解度とつまずきを記録\n次回は復習から開始');
  await open();await bindEditors();
  assert.equal(await input('due').inputValue(),'今回だけの予習 P12');assert.equal(await input('next').inputValue(),'次回までの復習 P20');
  const restoredRow=page.locator('[data-mobile-test-editor="'+id.next+'"] .homework-item-row').first();
  assert.equal(await restoredRow.locator('.homework-item-due').inputValue(),'2026-10-09');assert.equal(await restoredRow.locator('.homework-item-due-time').inputValue(),'18:30');assert.equal(await restoredRow.locator('.homework-item-options').evaluate(e=>e.open),true,'saved optional details reopen');
  assert.equal(await page.locator('#'+id.memo).inputValue(),'理解度とつまずきを記録\n次回は復習から開始');
  await page.locator('.lesson-detail-teachers .shared-note-text').filter({hasText:'先生向け：次回はプリントを用意'}).waitFor();
  if(!linked){
   await press(page.locator('#opsClose'),mobile);await page.waitForFunction(()=>document.getElementById('teacherOpsModal').classList.contains('hidden')||document.getElementById('opsSaveConfirm')&&!document.getElementById('opsSaveConfirm').classList.contains('hidden'));if(await page.locator('#opsConfirmNo').isVisible())await press(page.locator('#opsConfirmNo'),mobile);await page.locator('#teacherOpsModal').waitFor({state:'hidden'});await open();await bindEditors();
   assert.equal(await input('next').inputValue(),'次回までの復習 P20');
  }
  const overflow=await page.locator(linked?'.workspace-page':'#opsBody').evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth}));assert(overflow.scroll<=overflow.client+1,'no detail horizontal overflow: '+JSON.stringify(overflow));
  if(screenshots){fs.mkdirSync(screenshots,{recursive:true});if(!linked)await page.locator('#opsBody').evaluate(e=>e.scrollTop=0);await page.screenshot({path:path.join(screenshots,entry+'-'+viewport.name+'.png'),fullPage:linked});await page.locator('.lesson-detail-due').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(screenshots,entry+'-'+viewport.name+'-due.png')});await page.locator('.lesson-detail-next').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(screenshots,entry+'-'+viewport.name+'-next.png')});await page.locator('#'+id.save).scrollIntoViewIfNeeded();await page.screenshot({path:path.join(screenshots,entry+'-'+viewport.name+'-footer.png')});}
  assert.deepEqual(errors,[]);console.log('PASS '+entry+' '+viewport.name+': ordered sections, separated homework, input, IME, teacher message, save failures/retry, reload, close/reopen, no overflow');
 }finally{await context.close();}
}
async function runGenerator(browser,viewport){
 const mobile=viewport.width<600,context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},timezoneId:'Asia/Tokyo',isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);await page.clock.setFixedTime(new Date('2026-10-07T03:00:00Z'));
 const fixture=await boundary(context);
 try{
  await page.goto('https://test.local/schedule_generator.php');await page.waitForFunction(()=>window.Generator?.rows().length>0);
  await page.evaluate(()=>Generator.open(Generator.rows().find(r=>r['日付'].replaceAll('/','-')==='2026-10-07')));
  await page.waitForFunction(()=>window.GeneratorExtras?.loaded&&document.getElementById('generatorDueHomework')._homeworkItems);
  const panels=await page.locator('.lesson-detail-due,.lesson-detail-karte,.lesson-detail-next,.lesson-detail-teachers').evaluateAll(nodes=>nodes.map(e=>['due','karte','next','teachers'].find(k=>e.classList.contains('lesson-detail-'+k))));assert.deepEqual(panels,['due','karte','next','teachers']);
  for(const kind of ['DueHomework','Homework'])await page.locator('#generator'+kind).evaluate(e=>e._homeworkItems.root.dataset.mobileTestEditor=e.id);
  await page.locator('[data-mobile-test-editor="generatorDueHomework"] .homework-item-text').first().fill('生成画面の今回の予習');
  await page.locator('[data-mobile-test-editor="generatorHomework"] .homework-item-text').first().fill('生成画面の次回の復習');
  await page.locator('#generatorRecordMemo').fill('生成画面で記録したカルテ');
  if(mobile){const sizes=await page.locator('.lesson-detail-due .homework-item-text,.lesson-detail-next .homework-item-text,#generatorRecordMemo').evaluateAll(nodes=>nodes.map(e=>parseFloat(getComputedStyle(e).fontSize)));assert(sizes.every(size=>size>=16),'generator mobile font size');}
  await press(page.locator('#generatorRecordSave'),mobile);await page.waitForFunction(()=>document.getElementById('generatorRecordStatus').textContent==='保存しました。');
  const saved=fixture.posts.filter(x=>x.file==='lesson_record_api.php').at(-1).body;assert(saved.dueHomework.startsWith('生成画面の今回の予習'));assert(saved.homework.startsWith('生成画面の次回の復習'));assert.equal(saved.memo,'生成画面で記録したカルテ');assert.equal(await page.evaluate(()=>Generator.hasDraft()),false);
  const overflow=await page.locator('#generatorOps').evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth}));assert(overflow.scroll<=overflow.client+1,'generator overflow: '+JSON.stringify(overflow));
  if(screenshots){fs.mkdirSync(screenshots,{recursive:true});await page.locator('.lesson-detail-due').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(screenshots,'generator-'+viewport.name+'-due.png')});await page.locator('.lesson-detail-next').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(screenshots,'generator-'+viewport.name+'-next.png')});}
  assert.deepEqual(errors,[]);console.log('PASS generator '+viewport.name+': matching panel order, mobile input, separate due/next, save, clean draft, no overflow');
 }finally{await context.close();}
}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{for(const viewport of viewports)for(const entry of ['vertical','whole','linked']){if(selected&&!(`${entry}-${viewport.name}`.includes(selected)))continue;await run(browser,viewport,entry);}for(const viewport of viewports){if(selected&&!(`generator-${viewport.name}`.includes(selected)))continue;await runGenerator(browser,viewport);}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
