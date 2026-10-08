// Real pages and scripts, synthetic HTTP responses, isolated headless contexts.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const key=r=>['日付','時間番号','クラス','担当講師','種別','科目'].map(f=>r[f]||'').join('|');
const row=(date,slot='①',cls='検証クラス')=>({'日付':date,'時間番号':slot,'クラス':cls,'担当講師':'検証講師','種別':'授業','科目':'英語','教室':'青','開始':slot==='①'?'13:30':'14:20','終了':slot==='①'?'14:10':'15:00','_sourceKey':'fixture:'+date+slot});
const now='2026-10-07T03:00:00Z',schedule=[row('2026-10-06'),row('2026-10-07'),row('2026-10-07','②'),row('2026-10-08'),row('2026-10-09')],students=[{'生徒名':'検証生徒','クラス':'検証クラス'},{'生徒名':'検証生徒B','クラス':'別クラス'}];
const group={id:'a'.repeat(24),key:'GROUP:'+'a'.repeat(24),active:true,mealBreak:false,date:'2026-10-07',slots:'①②',className:'検証クラス',teacher:'検証講師',room:'青',start:'13:30',end:'15:00',sources:schedule.slice(1,3).map(r=>r._sourceKey),lessonKeys:schedule.slice(1,3).map(key)};
async function boundary(context,{linked=false,student=false,overdue=false,shared=null}={}){
 const fixtureSchedule=overdue?[row('2026-10-05'),...schedule]:schedule;
 const records=shared?.records||{[key(schedule[0])]:{memo:'既存カルテ',homework:'前回の宿題\n同じ宿題'},[key(schedule[1])]:{memo:'授業カルテ',homework:'まだ発行していない宿題',dueHomework:'今回の予習\n同じ宿題'},[key(schedule[2])]:{dueHomework:'今回の予習'},[key(schedule[3])]:{homework:'将来の宿題'}};
 if(overdue){records[key(fixtureSchedule[0])]={homework:'過去の未完了\n過去の完了'};records[key(schedule[0])].dueHomework='過去の直接宿題';}
 let version=1;records[group.key]={memo:'共通カルテ',homework:'まだ発行していない宿題',dueHomework:'今回の予習\n同じ宿題',updatedAt:now};const posts=[],states={};
 await context.route('https://test.local/**',async route=>{
  const req=route.request(),u=new URL(req.url()),file=decodeURIComponent(u.pathname.slice(1)),body=req.method()==='POST'?JSON.parse(req.postData()||'{}'):null;
  if(file==='schedule_generator.php')return route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,file),'utf8').replace(/<\?php[\s\S]*?\?>/g,'')});
  if(file.endsWith('.php')){
   let data={ok:true,items:[],notes:[],articles:[],count:0,unread:0,pending:0,counts:{},schools:[],events:[],groups:[],requests:[],contacts:[],profiles:{},overrides:{},records:{},hidden:[],students,directory:{},state:{},teachers:[],roster:[],links:[],byLesson:{},canArchive:false};
   if(body)posts.push({file,body});
   if(file==='homework_revision_api.php'){
    const revision='"'+require('crypto').createHash('sha256').update(JSON.stringify(records)).digest('hex')+'"';
    if(req.headers()['if-none-match']===revision)return route.fulfill({status:304,body:'',headers:{ETag:revision}});data={ok:true,revision};
   }
   if(file==='staff_auth_api.php')data={ok:true,user:student?null:{id:'fixture',name:'検証講師',role:'admin'},csrf:'fixture'};
   if(file==='data_api.php')data={ok:true,initialized:true,schedule:fixtureSchedule,students};
   if(file==='class_members_api.php')data={ok:true,students,directory:{}};
   if(file==='schedule_confirmed_api.php')data={ok:true,date:'2026-12-31',privateFrom:''};
   if(file==='student_attachment_api.php')data={ok:true,attachments:u.searchParams.get('action')==='all'?{}:[]};
   if(file==='student_identity_api.php')data={ok:true,registrationNumber:'fixture'};
   if(file==='lesson_group_api.php'){
    if(body){records[group.key]={...records[group.key],memo:body.memo,homework:body.homework,dueHomework:body.dueHomework,updatedAt:now};version++;}
    data=u.searchParams.get('action')==='index'?{ok:true,groups:linked?[group]:[]}:{ok:true,group,record:records[group.key],members:schedule.slice(1,3).map(row=>({row,key:key(row),state:{attendance:{'検証生徒':'出席'}},record:{memo:'個別カルテ'}})),students:['検証生徒'],regularStudents:['検証生徒'],invitedStudents:[],availableStudents:students.map(s=>s['生徒名']),nextLesson:{date:'2026-10-08',start:'13:30'},version:String(version)};
   }
   if(file==='lesson_record_api.php'){
    if(body){records[body.eventKey]={...(records[body.eventKey]||{}),...body};}
    let publicRecords=JSON.parse(JSON.stringify(records));if(linked)for(const r of schedule.slice(1,3))publicRecords[key(r)]={homework:records[group.key].homework,dueHomework:records[group.key].dueHomework};
    data=u.searchParams.get('action')==='previous_homework'?{ok:true,date:'2026-10-06',endTime:'14:10',items:[{id:'hw_fixture',text:'前回の宿題',checked:false}],serverNow:now}:u.searchParams.get('action')==='homework'?{ok:true,records:publicRecords}:{ok:true,record:records[u.searchParams.get('key')]||{}};
   }
   if(file==='state_api.php'){if(body)states[body.eventKey]=body;data={ok:true,state:body?states[body.eventKey]:states};}
   return route.fulfill({json:data});
  }
  const local=file==='student.html'&&process.env.HOMEWORK_STUDENT_SOURCE?process.env.HOMEWORK_STUDENT_SOURCE:path.resolve(root,file);if((!local.startsWith(root+path.sep)&&local!==process.env.HOMEWORK_STUDENT_SOURCE)||!fs.existsSync(local))return route.fulfill({status:404,body:''});
  return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(local)});
 });
 return {posts,records};
}
module.exports={boundary};
if(require.main===module)(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const mobile of [false,true]){
  for(const entry of ['vertical','whole','linked']){const linked=entry==='linked';
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:1000},timezoneId:'Asia/Tokyo',isMobile:mobile,hasTouch:mobile});const page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.stack);});page.on('console',m=>{if(m.type()==='error')console.error('CONSOLE',m.text());});await page.clock.setFixedTime(new Date(now));
   const fixtures=await boundary(context,{linked});
   await page.goto(linked?'https://test.local/lesson_group.html?id='+group.id:'https://test.local/'+(entry==='whole'?'teacher2026summer.html':'teacher2026summer_vertical.html')+'?teacher='+encodeURIComponent('検証講師'));
   if(!linked){await page.locator('#schedule .event[data-date="2026-10-07"]').first().waitFor();await page.locator('#schedule .event[data-date="2026-10-07"]').first().click();await page.locator('#teacherOpsModal:not(.hidden)').waitFor();}
   const field=page.locator(linked?'#groupDueHomework':'#lessonDueHomework');await field.waitFor({state:'attached'});await page.waitForFunction(id=>!!document.getElementById(id)?._homeworkItems,linked?'groupDueHomework':'lessonDueHomework');
   await field.evaluate(e=>e._homeworkItems.root.dataset.dueEditor='1');const editor=page.locator('[data-due-editor]');await editor.locator('.homework-item-text').first().fill('追加の予習');
   if(!linked)await page.locator('.teacher-ops-panel').evaluate(e=>{e.scrollTop=0;e.querySelector('#opsBody').scrollTop=0;});await page.screenshot({path:path.join(root,'..',`detail-${entry}-${mobile?'mobile':'desktop'}.png`),fullPage:linked});
   if(linked){await page.locator('#groupSave').click();await page.waitForFunction(()=>document.getElementById('groupMessage').textContent.includes('保存しました'));assert.equal(fixtures.records[group.key].dueHomework.split('\n')[0],'追加の予習');await page.reload();await page.waitForFunction(()=>document.getElementById('groupDueHomework').value.startsWith('追加の予習'));}
   else{await page.locator('#opsSave').click();await page.locator('#teacherOpsModal').waitFor({state:'hidden'});const saved=fixtures.posts.filter(p=>p.file==='lesson_record_api.php').at(-1);assert.equal(saved.body.dueHomework.split('\n')[0],'追加の予習');assert.equal(saved.body.memo,'授業カルテ');await page.locator('#schedule .event[data-date="2026-10-07"]').first().click();await page.waitForFunction(()=>document.getElementById('lessonDueHomework').value.startsWith('追加の予習'));}
   assert.deepEqual(errors,[]);if(entry!=='whole')assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);if(!linked)assert.equal(await page.locator('#opsBody').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);await context.close();console.log(`${mobile?'Mobile':'Desktop'} ${entry}: layout, assignment, save and reload passed`);
  }
  {
   const c=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:1000},timezoneId:'Asia/Tokyo',isMobile:mobile,hasTouch:mobile}),p=await c.newPage(),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.error('GENERATOR',e.stack);});await p.clock.setFixedTime(new Date(now));const f=await boundary(c);await p.goto('https://test.local/schedule_generator.php');await p.waitForFunction(()=>window.Generator?.rows().length>0);await p.evaluate(()=>Generator.open(Generator.rows().find(r=>r['日付'].replaceAll('/','-')==='2026-10-07')));await p.waitForFunction(()=>window.GeneratorExtras?.loaded&&document.getElementById('generatorDueHomework')._homeworkItems);await p.locator('#generatorDueHomework').evaluate(e=>e._homeworkItems.root.dataset.dueEditor='1');await p.locator('[data-due-editor] .homework-item-text').first().fill('生成画面の予習');await p.locator('#generatorRecordSave').click();await p.waitForFunction(()=>document.getElementById('generatorRecordStatus').textContent==='保存しました。');assert.equal(f.posts.filter(x=>x.file==='lesson_record_api.php').at(-1).body.dueHomework.split('\n')[0],'生成画面の予習');assert.equal(await p.evaluate(()=>Generator.hasDraft()),false);await p.screenshot({path:path.join(root,'..',`detail-generator-${mobile?'mobile':'desktop'}.png`)});assert.deepEqual(errors,[]);await c.close();console.log(`${mobile?'Mobile':'Desktop'} generator: common panels, assignment and save passed`);
  }
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:1000},timezoneId:'Asia/Tokyo',isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.stack);});await page.clock.setFixedTime(new Date(now));await boundary(context,{linked:true,student:true});
  await page.goto('https://test.local/student.html?name='+encodeURIComponent('検証生徒'));await page.locator('#studentConfirmOk').click();await page.locator('#studentHomeworkHub:not([hidden])').waitFor();assert.equal(await page.locator('#studentHomeworkToggle').getAttribute('aria-expanded'),'false');await page.locator('#studentHomeworkToggle').click();
  await page.waitForFunction(()=>document.querySelectorAll('#studentHomeworkBody>.student-homework-hub-item').length===3);assert.doesNotMatch(await page.locator('#studentHomeworkBody').textContent(),/将来の宿題|まだ発行していない/);
  assert.equal(await page.locator('#studentHomeworkCount').textContent(),'3');await page.locator('[data-homework-complete]').first().click();assert.equal(await page.locator('#studentHomeworkCount').textContent(),'2');assert.equal(await page.locator('.student-homework-completed').count(),1);
  await page.locator('#studentHomeworkBody>.student-homework-hub-item [data-homework-hide]').first().click();assert.equal(await page.locator('#studentHomeworkCount').textContent(),'1');
  await page.reload();await page.locator('#studentConfirmOk').click();await page.locator('#studentHomeworkHub:not([hidden])').waitFor();await page.locator('#studentHomeworkToggle').click();assert.equal(await page.locator('#studentHomeworkCount').textContent(),'1');
  await page.locator('.student-homework-hidden').filter({has:page.locator('[data-homework-restore]')}).locator('summary').click();await page.locator('[data-homework-restore]').click();assert.equal(await page.locator('#studentHomeworkCount').textContent(),'2');
  await page.screenshot({path:path.join(root,'..',`homework-${mobile?'mobile':'desktop'}.png`)});
  await page.evaluate(()=>StudentHomeworkHub.update('検証生徒B',[]));assert.equal(await page.locator('#studentHomeworkToggle').getAttribute('aria-expanded'),'false');await page.locator('#studentHomeworkToggle').click();assert.match(await page.locator('#studentHomeworkBody').textContent(),/現在取り組む宿題はありません/);
  await page.evaluate(()=>StudentHomeworkHub.update('検証生徒B',[{dueAt:'2026-10-07T11:00:00+09:00',text:'期限確認',className:'検証'}]));assert.match(await page.locator('#studentHomeworkBody').textContent(),/期限を過ぎています/);assert.deepEqual(errors,[]);await context.close();console.log(`${mobile?'Mobile':'Desktop'} student: issued-only, dedup, folding, completion, hiding, reload, student switch, empty and overdue passed`);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
