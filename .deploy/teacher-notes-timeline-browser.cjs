// Synthetic data and intercepted requests only. Never reads/writes production records.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const escapeHtml=value=>String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function run(browser,width){
 const context=await browser.newContext({viewport:{width,height:900},timezoneId:'America/Los_Angeles',isMobile:width<600,hasTouch:width<600});
 const page=await context.newPage(),errors=[],contextKeys=[],methods=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 await page.clock.setFixedTime(new Date('2026-11-07T10:00:00Z'));
 const records=[{eventKey:'r1',date:'2026-11-06',className:'旧クラス',teacher:'担当講師',author:'記録者',memo:'授業の記録',slot:'①',replies:[]},{eventKey:'r2',date:'2026-11-07',className:'クラスB',teacher:'担当講師',memo:'今日の記録',slot:'⑪',replies:[]}];
 const note=(id,className,text,createdAt,extra={})=>({id,className,text,createdAt,author:'投稿先生',assigneeNames:['宛先先生'],done:false,todo:false,...extra});
 let notes=[note('early','クラスA','授業前の相談','2026-11-06T03:00:00Z'),note('late','クラスA','授業後の連絡','2026-11-06T15:00:00+09:00'),note('today','連絡だけのクラス','今日の相談','2026-11-07T09:00:00Z'),note('old','過去連絡だけのクラス','古い連絡','2026-10-01T09:00:00Z'),note('legacy','クラスA','以前の日時不明',null,{legacy:true,author:null}),note('hidden','クラスA','非表示の相談','2026-11-06T16:00:00+09:00',{done:true,doneBy:'投稿先生',doneAt:'2026-11-07T09:00:00Z'}),note('todo','クラスB','完了済みTODO','2026-11-06T17:00:00+09:00',{done:true,todo:true}),note('rollover','クラスB','日本時間では今日','2026-11-06T15:30:00Z'),note('xss','クラスA','<img src=x onerror="window.bad=1"> https://example.com/'+('x'.repeat(180)),'2026-11-06T02:00:00Z')];
 let failNotes=false,delayNotes=0,failRecords=false,noteReads=0;
 await context.route('**/*',async route=>{
  const request=route.request(),u=new URL(request.url()),name=u.pathname.slice(1);methods.push(request.method());
  if(name==='lesson_record_api.php'){
   if(u.searchParams.get('action')==='list_context'){const keys=JSON.parse(u.searchParams.get('keys'));contextKeys.push(...keys);return route.fulfill({json:{ok:true,attendance:Object.fromEntries(keys.map(k=>[k,[]]))}});}
   if(failRecords)return route.fulfill({status:500,json:{ok:false}});
   return route.fulfill({json:{ok:true,records,timings:{r1:{date:'2026-11-06',endAt:'2026-11-06T14:10:00+09:00'},r2:{date:'2026-11-07',endAt:'2026-11-07T22:30:00+09:00'}}}});
  }
  if(name==='shared_notes_api.php'){noteReads++;assert.equal(u.searchParams.get('timeline'),'1');if(delayNotes)await new Promise(r=>setTimeout(r,delayNotes));return route.fulfill({status:failNotes?503:200,json:failNotes?{ok:false}:{ok:true,notes,classNameAliases:{'旧クラス':'クラスA'}}});}
  if(name==='staff-auth.js')return route.fulfill({body:'window.StaffAuth={ready:Promise.resolve({recordDisplay:{}}),user:{name:"担当講師"}};'});
  if(name==='workspace-ui.js')return route.fulfill({body:'window.Workspace={today:()=>"2026-11-07",esc:'+escapeHtml.toString()+'};'});
  if(name.endsWith('.js')&&!['record-history.js','record-teacher-notes.js','karte-tools.js'].includes(name))return route.fulfill({body:''});
  const file=path.join(root,name);if(fs.existsSync(file))return route.fulfill({body:fs.readFileSync(file),contentType:name.endsWith('.html')?'text/html':name.endsWith('.js')?'application/javascript':'text/css'});
  return route.fulfill({body:'<html><body>合成の予定画面</body></html>',contentType:'text/html'});
 });
 const keys=()=>page.locator('#list > .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.key));
 const load=async(url='http://fixture/lesson_records.html')=>{await page.goto(url);await page.waitForFunction(()=>document.querySelector('#recordLoadingText').textContent.includes('読込完了'));};
 await load();assert.deepEqual(await keys(),['NOTE:today','NOTE:rollover','NOTE:late','r1','NOTE:early','NOTE:xss','NOTE:legacy']);
 assert.equal(await page.locator('.teacher-note .editBtn,.teacher-note .replyBtn,.teacher-note .readBtn,.teacher-note [data-attendance-key]').count(),0);
 assert.deepEqual(await page.locator('.teacher-note-kind').first().evaluate(el=>[getComputedStyle(el).color,getComputedStyle(el).backgroundColor]),['rgb(17, 94, 89)','rgb(204, 251, 241)']);assert.equal(await page.locator('.teacher-note img').count(),0);assert.equal(await page.evaluate(()=>window.bad),undefined);
 assert.match(await page.locator('#count').textContent(),/カルテ 1件・連絡 6件/);
 assert.equal(await page.getByLabel('連絡だけのクラス',{exact:true}).count(),1);
 await page.selectOption('#recordsOrder','asc');assert.deepEqual(await keys(),['NOTE:xss','NOTE:early','r1','NOTE:late','NOTE:rollover','NOTE:today','NOTE:legacy']);
 await page.selectOption('#recordsOrder','desc');await page.locator('.records-filter summary').click();
 await page.fill('#date','2026-11-07');assert.deepEqual(await keys(),['r2','NOTE:today','NOTE:rollover']); // UTC previous day becomes JST today.
 await page.fill('#date','');await page.selectOption('#teacher','宛先先生');assert.equal(await page.locator('#list .teacher-note').count(),6);assert.equal(await page.locator('#list .card:not(.teacher-note)').count(),0);
 await page.selectOption('#teacher','担当講師');assert.deepEqual(await keys(),['r1']);await page.selectOption('#teacher','');
 await page.fill('#q','以前の日時不明');assert.deepEqual(await keys(),['NOTE:legacy']);await page.fill('#q','');
 await page.getByLabel('クラスA',{exact:true}).check();await page.getByLabel('連絡だけのクラス',{exact:true}).check();assert.equal(new URL(page.url()).searchParams.getAll('class').length,2);assert.equal((await keys()).includes('NOTE:today'),true);assert.equal((await keys()).includes('NOTE:rollover'),false);
 const popupPromise=page.waitForEvent('popup');await page.locator('[data-note-id="today"] .detailBtn').click();const popup=await popupPromise;await popup.waitForLoadState();assert.equal(new URL(popup.url()).searchParams.get('class'),'連絡だけのクラス');await popup.close();assert.equal(await page.locator('[data-record-class]:checked').count(),2);
 await page.locator('#recordClassesClear').click();await page.locator('#recordNotesDone').check();assert.equal(await page.locator('.teacher-note.is-done').count(),2);await page.locator('#recordNotesDone').uncheck();
 await page.locator('[data-key="r1"] .editBtn').click();await page.locator('.editMemo').fill('保存前の重要な下書き');page.once('dialog',d=>d.dismiss());await page.locator('#recordNotesDone').click();assert.equal(await page.locator('#recordNotesDone').isChecked(),false);assert.equal(await page.locator('.is-editing .editMemo').inputValue(),'保存前の重要な下書き');
 page.once('dialog',d=>d.dismiss());await page.locator('#recordNotesReload').click();assert.equal(await page.locator('.is-editing .editMemo').inputValue(),'保存前の重要な下書き');await page.locator('.editCancelBtn').click();
 delayNotes=250;await page.locator('#recordNotesReload').click();await page.locator('[data-key="r1"] .editBtn').click();await page.locator('.editMemo').fill('読み込み中に書いた下書き');await page.waitForFunction(()=>!document.querySelector('#recordNotesReload').disabled);assert.equal(await page.locator('.is-editing .editMemo').inputValue(),'読み込み中に書いた下書き');delayNotes=0;await page.locator('.editCancelBtn').click();
 await page.locator('#recordNotesReload').click();await page.waitForFunction(()=>!document.querySelector('#recordNotesReload').disabled);
 await page.getByLabel('過去連絡だけのクラス',{exact:true}).check();await page.locator('#recordsAutoMore').click();await page.waitForFunction(()=>document.querySelector('[data-note-id="old"]'));assert.equal((await keys()).includes('NOTE:old'),true);
 await load();await page.evaluate(()=>scrollTo(0,0));if(process.env.TEACHER_NOTES_SCREENSHOTS)await page.screenshot({path:path.join(process.env.TEACHER_NOTES_SCREENSHOTS,'notes-'+width+'.png'),fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal page overflow');
 failNotes=true;await load();assert.deepEqual(await keys(),['r1']);assert.match(await page.locator('#recordNotesStatus').textContent(),/読み込めません/);failNotes=false;await page.locator('#recordNotesReload').click();await page.waitForFunction(()=>document.querySelector('#recordNotesStatus').textContent.includes('読込完了'));assert.equal((await keys()).includes('NOTE:today'),true);
 notes=[];await page.locator('#recordNotesReload').click();await page.waitForFunction(()=>document.querySelector('#recordNotesStatus').textContent.includes('0件'));assert.deepEqual(await keys(),['r1']);
 assert.ok(contextKeys.every(k=>!k.startsWith('NOTE:')));assert.ok(methods.every(m=>m==='GET'));assert.deepEqual(errors,[]);
 console.log(JSON.stringify({width,chronology:true,jstRollover:true,unknownLastBothWays:true,multiClass:true,filters:true,noteOnlyHistory:true,readOnly:true,draftProtection:true,errorRecovery:true,noOverflow:true,noteReads}));await context.close();
}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{for(const width of [1280,390,320])await run(browser,width);}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
