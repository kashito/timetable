// Real app pages with isolated synthetic traffic. Never touches production data.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {boundary}=require('./homework-detail-browser.cjs');
const root=path.resolve(__dirname,'..');
const key='2026-10-07|①|検証クラス|検証講師|授業|英語';
const singleUrl='teacher2026summer_vertical.html?'+new URLSearchParams({teacher:'検証講師',date:'2026-10-07',openKey:key,openSource:'fixture:2026-10-07①',fromTodo:'1'});
const linkedUrl='lesson_group.html?id='+'a'.repeat(24)+'&fromTodo=1';
async function run(browser,width,linked=false,admin=false){
 const context=await browser.newContext({viewport:{width,height:860},timezoneId:'America/Los_Angeles',isMobile:width<600,hasTouch:width<600}),page=await context.newPage(),errors=[],posts=[],scopes=[];
 page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await page.clock.setFixedTime(new Date('2026-10-07T03:00:00Z'));
 await boundary(context,{linked});let failRead=false,failSave=false,delay=0;
 const mk=(id,cls,text,extra={})=>({id,className:cls,text,todo:true,done:false,mine:true,unread:false,author:'投稿先生',createdAt:'2026-10-06T16:00:00Z',recipientIds:['fixture'],assignees:[{id:'fixture',name:'検証講師'}],completionHistory:[],canComplete:true,version:'v1',lessonDetail:{url:linked?linkedUrl:singleUrl,date:'2026-10-07',slots:linked?'①②':'①',subject:'英語',teacher:'検証講師',relation:'upcoming'},...extra});
 const notes=[mk('english','検証クラス','英語の教材を準備'),mk('math','数学クラス','数学のプリントを印刷',{lessonDetail:null}),mk('done','完了クラス','完了済みの作業',{done:true}),mk('long','長い授業名'.repeat(12),'<img src=x onerror="window.bad=1"> '+('https://example.com/'+'x'.repeat(150)),{lessonDetail:null}),mk('other','別担当クラス','別担当の作業',{mine:false,recipientIds:['other'],assignees:[{id:'other',name:'別担当'}]})];
 await context.route('**/staff_auth_api.php*',route=>route.fulfill({json:{ok:true,user:{id:'fixture',name:'検証講師',role:admin?'admin':'teacher'},csrf:'fixture'}}));
 await context.route('**/shared_notes_api.php*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(req.method()==='POST'){const body=req.postDataJSON();posts.push(body);if(delay)await new Promise(r=>setTimeout(r,delay));if(failSave)return route.fulfill({status:409,json:{ok:false,error:'他の画面で更新されました。再読み込みしてください。'}});const item=notes.find(n=>n.id===body.id);if(body.action==='done'){item.done=body.done;item.version+='1';item.doneBy='検証講師';item.doneAt='2026-10-07T12:00:00+09:00';}return route.fulfill({json:{ok:true,notes}});}
  if(u.searchParams.has('todos')){if(failRead)return route.fulfill({status:503,json:{ok:false,error:'検証用の読込失敗'}});const scope=u.searchParams.get('scope');scopes.push(scope);const items=notes.filter(n=>scope==='all'||n.recipientIds.includes('fixture'));return route.fulfill({json:{ok:true,scope,items:u.searchParams.has('countOnly')?[]:items,pending:items.filter(n=>!n.done).length,staff:[{id:'fixture',name:'検証講師'}]}});}
  return route.fulfill({json:{ok:true,notes:notes.filter(n=>n.className==='検証クラス'),items:[],counts:{},unread:0,pending:3,staff:[]}});
 });
 try{
  await page.goto('https://test.local/teacher2026summer_vertical.html?teacher='+encodeURIComponent('検証講師'));await page.locator('#teacherTodoEntry').waitFor();assert.match(await page.locator('#teacherTodoEntry').textContent(),/自分のTODO/);await page.locator('#teacherTodoEntry').click();await page.locator('[data-sn-id="english"]').waitFor();
  assert.equal(await page.locator('#snCards article').count(),3);assert.equal(await page.locator('[data-sn-id="other"]').count(),0);if(!admin)assert.equal(await page.locator('#snAssignee').isVisible(),false);
  assert.equal(await page.evaluate(()=>window.bad),undefined);assert.equal(await page.locator('#snCards img').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#snFind').fill('英語');assert.equal(await page.locator('#snCards article').count(),1);
  await page.locator('[data-sn-id="english"] .sn-detail-link').click();
  if(linked){await page.locator('#groupContent:not([hidden])').waitFor();assert.equal(new URL(page.url()).searchParams.get('id'),'a'.repeat(24));}
  else{await page.locator('#teacherOpsModal:not(.hidden)').waitFor();assert.equal(new URL(page.url()).searchParams.get('openKey'),key);assert.match(await page.locator('#opsTitle').textContent(),/検証クラス/);await page.waitForFunction(()=>document.getElementById('opsClose').onclick&&document.getElementById('lessonRecordMemo').value==='授業カルテ');await page.locator('#opsClose').click();if(await page.locator('#opsConfirmNo').isVisible())await page.locator('#opsConfirmNo').click();await page.locator('#teacherOpsModal').waitFor({state:'hidden'});}
  await page.goBack();await page.locator('[data-sn-id="english"]').waitFor();assert.equal(await page.locator('#snFind').inputValue(),'英語');await page.locator('#snFind').fill('');
  failSave=true;await page.locator('[data-sn-id="english"] [data-sn-action="done"]').click();await page.waitForFunction(()=>document.querySelector('#snMessage').textContent.includes('他の画面'));assert.equal(notes[0].done,false);assert.equal(await page.locator('[data-sn-id="english"]').count(),1);failSave=false;
  delay=250;const before=posts.length;await page.locator('[data-sn-id="english"] [data-sn-action="done"]').evaluate(el=>{el.click();el.click();});await page.waitForFunction(()=>!document.querySelector('[data-sn-id="english"]'));assert.equal(posts.length-before,1);delay=0;
  await page.selectOption('#snState','done');await page.locator('[data-sn-id="english"]').waitFor();await page.locator('[data-sn-id="english"] [data-sn-action="done"]').click();await page.waitForFunction(()=>!document.querySelector('[data-sn-id="english"]'));assert.equal(notes[0].done,false);await page.selectOption('#snState','open');
  await page.locator('.sn-filters summary').click();await page.locator('#snFrom').fill('2026-10-07');await page.locator('#snUntil').fill('2026-10-07');assert.equal(await page.locator('#snCards article').count(),3,'JST date filtering');await page.locator('#snUntil').fill('2026-10-06');assert.match(await page.locator('#snPeriodError').textContent(),/終了日/);await page.locator('#snFrom').fill('');await page.locator('#snUntil').fill('');
  if(admin){await page.selectOption('#snAssignee','all');await page.locator('[data-sn-id="other"]').waitFor();assert.ok(scopes.includes('all'));await page.selectOption('#snAssignee','fixture');await page.waitForFunction(()=>!document.querySelector('[data-sn-id="other"]'));}
  await page.locator('.sn-filters summary').click();if(process.env.TODO_SCREENSHOTS)await page.screenshot({path:path.join(process.env.TODO_SCREENSHOTS,'todos-'+width+'-'+(linked?'linked':'single')+'.png'),fullPage:true});
  failRead=true;await page.locator('#snReload').click();await page.waitForFunction(()=>document.querySelector('#snMessage').textContent.includes('読込失敗'));failRead=false;await page.locator('#snReload').click();await page.waitForFunction(()=>document.querySelector('#snMessage').textContent==='');
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  console.log(JSON.stringify({width,linked,admin,entry:true,exactDetail:true,backFilters:true,doneReopen:true,doubleClickGuard:true,errorRecovery:true,jstFilter:true,noOverflow:true}));
 }finally{await context.close();}
}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{for(const width of [390,320,1280])await run(browser,width,false,width===1280);await run(browser,390,true);}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
