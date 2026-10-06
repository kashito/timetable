// Isolated browser + PHP API regression. Requires playwright and TIMETABLE_TEST_PHP.
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('node:assert/strict'),{spawn}=require('child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'timetable-board-')),port=19873,url=`http://127.0.0.1:${port}`;
for(const p of ['board_guides_api.php','board_guides_settings.php','daily_board_api.php','board-guides.js','board-guides.css','daily-board.js','daily-board.css','countdown.html','countdown.js','countdown.css'])fs.copyFileSync(path.join(root,p),path.join(tmp,p));
fs.mkdirSync(path.join(tmp,'data'));
fs.writeFileSync(path.join(tmp,'staff_security.php'),`<?php
date_default_timezone_set('Asia/Tokyo');
function staffCurrent(){return ['id'=>'synthetic-admin','name'=>'検証管理者','role'=>'admin','mustChange'=>false];}
function staffRequire($admin){return staffCurrent();}
function staffFail($message,$code=400){http_response_code($code);header('Content-Type: application/json');echo json_encode(['ok'=>false,'error'=>$message]);exit;}
function dataError($m){staffFail($m,500);}
function readJsonStrict($p,$fallback=[]){return is_file($p)?json_decode(substr(file_get_contents($p),15),true):$fallback;}
function safeJsonWriteAtomic($p,$d){return file_put_contents($p,"<?php exit; ?>\\n".json_encode($d,JSON_UNESCAPED_UNICODE))!==false;}
`);
fs.writeFileSync(path.join(tmp,'data','daily_board.php'),`<?php exit; ?>\n${JSON.stringify({schema:1,settings:{title:'掲示板',background:'blue'},days:{'2099-01-01':{rows:[
 {id:'releasedrow01',kind:'note',instruction:'従来表示',visible:true},
 {id:'pastrelease01',kind:'note',instruction:'予告表示済み',visible:true,advanceNotice:true,displayStartAt:'2000-01-01T00:00'},
 {id:'futurerelease1',kind:'note',instruction:'予告待ち',visible:true,advanceNotice:true,displayStartAt:'2099-01-01T12:00'}
]}}})}`);
fs.writeFileSync(path.join(tmp,'daily_board.html'),`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="daily-board.css"><link rel="stylesheet" href="board-guides.css"><script>window.StaffAuth={ready:Promise.resolve(),user:{role:'admin'}};</script><script defer src="board-guides.js"></script><script defer src="daily-board.js"></script><section data-daily-board="page"></section>`);
fs.writeFileSync(path.join(tmp,'room_board.html'),`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="daily-board.css"><link rel="stylesheet" href="board-guides.css"><script>window.StaffAuth={ready:Promise.resolve(),user:{role:'admin'}};</script><script defer src="board-guides.js"></script><script defer src="daily-board.js"></script><section data-daily-board="page" data-board-id="blue"></section>`);
const server=spawn(process.env.TIMETABLE_TEST_PHP||'php',['-S',`127.0.0.1:${port}`,'-t',tmp],{windowsHide:true,stdio:'ignore'});
let browser;
const event=(id,date,category='test')=>({id,title:'試験'+id,category,startDate:date,kind:'school',schoolId:'s',schoolName:'検証学校',targetClasses:[]});
(async()=>{try{
 for(let i=0;i<50;i++){try{await fetch(url+'/countdown.html');break;}catch{await new Promise(r=>setTimeout(r,100));}}
 browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:1200}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let events=[event('past','2026-10-03'),event('today','2026-10-04'),event('four','2026-10-08'),event('seven','2026-10-11'),event('ignored','2026-10-12','other')];
 await page.route('**/calendar_events_api.php',r=>r.fulfill({json:{ok:true,events,schools:[{id:'s',name:'検証学校'}]}}));
 const publicBoard=await page.request.get(url+'/daily_board_api.php?date=2099-01-01&preview=student').then(r=>r.json());
 assert.deepEqual(publicBoard.board.rows.map(r=>r.id),['releasedrow01','pastrelease01']);
 const adminBoard=await page.request.get(url+'/daily_board_api.php?date=2099-01-01').then(r=>r.json());
 const invalid=await page.request.post(url+'/daily_board_api.php',{data:{date:'2099-01-01',rows:[{id:'invalidnotice1',kind:'note',instruction:'開始日時なし',visible:true,advanceNotice:true,displayStartAt:''}],version:adminBoard.board.version,requestId:'invalidrequest001'}});
 assert.equal(invalid.status(),400);assert.match((await invalid.json()).error,/表示開始日時/);
 await page.route('**/daily_board_api.php*',async r=>{const date=new URL(r.request().url()).searchParams.get('date');const serverTime=await page.evaluate(()=>new Date().toISOString());await r.fulfill({json:{ok:true,board:{date,settings:{title:'検証教室',background:'blue'},rows:[
  {id:'syntheticrow1',kind:'note',instruction:'当日 '+date,visible:true},
  {id:'syntheticrow2',kind:'note',instruction:'非公開行',visible:false},
  {id:'syntheticrow3',kind:'instruction',time:'12:00',target:'予告対象',place:'青',instruction:'12時1分から表示',visible:true,advanceNotice:true,displayStartAt:'2026-10-04T12:01'},
  {id:'syntheticrow4',kind:'instruction',time:'12:00',target:'点滅対象',place:'青',instruction:'予定時刻前後',visible:true},
  {id:'syntheticrow5',kind:'instruction',time:'12:00',target:'遅い予告',place:'青',instruction:'点滅終了後に表示',visible:true,advanceNotice:true,displayStartAt:'2026-10-04T12:03'},
  {id:'syntheticrow6',kind:'note',instruction:'前日からの予告',visible:true,advanceNotice:true,displayStartAt:'2026-10-03T23:59'}
 ],canEdit:true,serverTime}}});});
 await page.clock.install({time:new Date('2026-10-04T03:00:00Z')});await page.goto(url+'/daily_board.html?mode=monitor');
 await page.waitForFunction(()=>document.querySelector('.bg-controls span')?.textContent.includes('20秒'));
 assert.match(await page.locator('.db-rows').innerText(),/当日 2026-10-04/);assert.match(await page.locator('.db-rows').innerText(),/前日からの予告/);assert.doesNotMatch(await page.locator('.db-rows').innerText(),/非公開行/);
 assert.doesNotMatch(await page.locator('.db-rows').innerText(),/12時1分から表示|点滅終了後に表示/);assert.equal(await page.locator('.db-time-pulse').count(),1);
 assert.equal(await page.locator('.db-quick [name=advanceNotice]').count(),1);await page.locator('.db-edit').click();
 assert.equal(await page.locator('.db-edit-row').filter({hasText:'12時1分から表示'}).count(),1);assert.match(await page.locator('.db-edit-row').filter({hasText:'12時1分から表示'}).innerText(),/予告：2026-10-04 12:01から公開/);
 const editRows=page.locator('.db-edit-row'),firstText=await editRows.first().locator('textarea').inputValue(),firstHandle=editRows.first().locator('.db-edit-drag-handle'),secondBox=await editRows.nth(1).boundingBox();await firstHandle.hover();await page.mouse.down();await page.mouse.move(secondBox.x+20,secondBox.y+secondBox.height-4,{steps:5});await page.mouse.up();assert.notEqual(await editRows.first().locator('textarea').inputValue(),firstText);
 const notice=page.locator('.db-edit-row [data-advance-notice]').first(),start=page.locator('.db-edit-row [data-field=displayStartAt]').first();if(await start.isVisible())await notice.uncheck();assert.equal(await start.isVisible(),false);await notice.check();assert.equal(await start.isVisible(),true);assert.equal(await start.getAttribute('required'),'');page.once('dialog',d=>d.accept());await page.locator('.db-edit-dialog .db-close').click();
 await page.clock.fastForward(18000);assert.equal(await page.locator('.bg-stage').isVisible(),false);
 await page.clock.fastForward(2500);await page.locator('.bg-stage').waitFor({state:'visible'});
 const frame=page.frameLocator('.bg-countdown');await frame.locator('.countdown-row').first().waitFor();
 assert.equal(await frame.locator('.countdown-row').count(),3);assert.deepEqual(await frame.locator('.countdown-number strong').allTextContents(),['本日','4','7']);
 assert.doesNotMatch(await frame.locator('#countdownRows').innerText(),/試験past|試験ignored/);
 const outerFit=await page.evaluate(()=>{const box=document.querySelector('.bg-countdown').getBoundingClientRect();return{overflow:getComputedStyle(document.body).overflowY,bottom:box.bottom,height:innerHeight};});
 assert.equal(outerFit.overflow,'hidden');assert(outerFit.bottom<=outerFit.height+1,`countdown frame exceeds viewport: ${JSON.stringify(outerFit)}`);
 const innerFit=await frame.locator('body').evaluate(()=>({htmlOverflow:getComputedStyle(document.documentElement).overflowY,bodyOverflow:getComputedStyle(document.body).overflowY,background:getComputedStyle(document.body).backgroundColor,hostBackground:getComputedStyle(document.documentElement).getPropertyValue('--countdown-host-bg').trim(),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
 assert.equal(innerFit.htmlOverflow,'hidden');assert.equal(innerFit.bodyOverflow,'hidden');assert.equal(innerFit.background,'rgba(0, 0, 0, 0)');assert(innerFit.hostBackground);assert(innerFit.scrollWidth<=innerFit.clientWidth+1,`countdown frame scrolls horizontally: ${JSON.stringify(innerFit)}`);
 await page.screenshot({path:path.join(tmp,'countdown-tested.png')});
 await page.clock.fastForward(10000);assert.equal(await page.locator('.bg-stage').isVisible(),true);
 await page.clock.fastForward(10000);assert.equal(await page.locator('.bg-stage').isVisible(),false);
 await page.getByRole('button',{name:'案内を編集',exact:true}).click();await page.locator('[name=mainSeconds]').fill('25');await page.locator('[data-seconds]').fill('23');
 await page.getByRole('button',{name:'公開して保存',exact:true}).click();await page.locator('.bg-editor').waitFor({state:'detached'});await page.reload();
 await page.waitForFunction(()=>document.querySelector('.bg-controls span')?.textContent.includes('25秒'));
 await page.getByRole('button',{name:'案内を編集',exact:true}).click();assert.equal(await page.locator('[data-seconds]').inputValue(),'23');await page.getByRole('button',{name:'閉じる',exact:true}).click();
 await page.clock.fastForward(20000);await page.waitForFunction(()=>document.querySelector('.db-rows')?.textContent.includes('12時1分から表示'));assert.equal(await page.locator('.db-time-pulse').count(),2);
 await page.clock.fastForward(60000);assert.equal(await page.locator('.db-time-pulse').count(),0);assert.doesNotMatch(await page.locator('.db-rows').innerText(),/点滅終了後に表示/);
 await page.clock.fastForward(60000);await page.waitForFunction(()=>document.querySelector('.db-rows')?.textContent.includes('点滅終了後に表示'));assert.equal(await page.locator('.db-time-pulse').count(),0);
 await page.clock.setSystemTime(new Date('2026-10-04T03:00:00Z'));await page.goto(url+'/room_board.html?mode=monitor');await page.waitForFunction(()=>document.querySelector('.db-rows')?.textContent.includes('予定時刻前後'));assert.equal(await page.locator('.db-time-pulse').count(),1);assert.doesNotMatch(await page.locator('.db-rows').innerText(),/12時1分から表示/);assert.equal(await page.getByRole('link',{name:'カウントダウン'}).count(),0);
 // More than three events page correctly; empty and past-only lists are explicit.
 await page.goto(url+'/countdown.html?embed=1');events=[event('one','2026-10-08'),event('two','2026-10-09'),event('three','2026-10-10'),event('fourth','2026-10-11')];await page.reload();await page.locator('.countdown-row').first().waitFor();assert.equal(await page.locator('.countdown-row').count(),3);assert.equal(await page.locator('header').isVisible(),false);assert.equal(await page.locator('footer').isVisible(),false);await page.clock.fastForward(10000);assert.equal(await page.locator('.countdown-row').count(),1);
 events=[event('past','2026-10-03')];await page.reload();await page.locator('.countdown-empty').waitFor();events=[];await page.reload();await page.locator('.countdown-empty').waitFor();
 // The same open monitor crosses Japan midnight and reads the new daily content.
 events=[event('four','2026-10-08')];await page.clock.setSystemTime(new Date('2026-10-04T14:59:50Z'));await page.goto(url+'/daily_board.html?mode=monitor');await page.waitForFunction(()=>document.querySelector('.bg-controls span')?.textContent.includes('25秒'));
 await page.clock.fastForward(30000);await page.waitForFunction(()=>document.querySelector('.db-rows')?.textContent.includes('2026-10-05'));await page.getByRole('button',{name:'次へ',exact:true}).click();await page.frameLocator('.bg-countdown').locator('.countdown-row').waitFor();assert.equal(await page.frameLocator('.bg-countdown').locator('.countdown-number strong').innerText(),'3');
 await page.getByRole('button',{name:'案内を編集',exact:true}).click();assert.equal(await page.locator('[name=mainSeconds]').inputValue(),'25');assert.equal(await page.locator('[data-seconds]').inputValue(),'23');
 const blue=await fetch(url+'/board_guides_api.php?board=blue&date=2026-10-05').then(r=>r.json());assert.deepEqual(blue.guide.slides,[]);
 // Past board articles copy directly or in a checked batch to today's same board without replacing today's rows.
 const copyPage=await browser.newPage({viewport:{width:1280,height:1000}}),copyPosts=[],sourceRows=[
  {id:'copysource0001',kind:'instruction',visible:true,advanceNotice:false,displayStartAt:'',time:'18:00',target:'コピー元1',place:'青',instruction:'個別コピー',highlight:false,animation:'none'},
  {id:'copysource0002',kind:'note',visible:true,advanceNotice:true,displayStartAt:'2026-10-03T08:30',time:'',target:'',place:'',instruction:'一括コピー',highlight:true,animation:'none'}
 ],todayRows=[{id:'todayexisting01',kind:'note',visible:true,advanceNotice:false,displayStartAt:'',time:'',target:'',place:'',instruction:'今日の既存記事',highlight:false,animation:'none'}];
 await copyPage.route('**/daily_board_api.php*',async route=>{const req=route.request(),payload=req.method()==='POST'?req.postDataJSON():null,date=payload?.date||new URL(req.url()).searchParams.get('date');if(payload)copyPosts.push(payload);const rows=payload?.rows||(date==='2026-10-03'?sourceRows:todayRows);await route.fulfill({json:{ok:true,board:{boardId:'all',date,settings:{title:'掲示板',background:'blue'},rows,version:'copy-version-'+copyPosts.length,canEdit:true,updatedAt:'2026-10-04T00:00:00+09:00',serverTime:'2026-10-04T03:00:00Z'}}});});
 await copyPage.clock.install({time:new Date('2026-10-04T03:00:00Z')});await copyPage.goto(url+'/daily_board.html?date=2026-10-03');await copyPage.getByRole('button',{name:'今日へコピー',exact:true}).first().waitFor();
 assert.equal(await copyPage.getByRole('button',{name:'今日へコピー',exact:true}).count(),2);await copyPage.getByRole('button',{name:'今日へコピー',exact:true}).first().click();await copyPage.waitForFunction(()=>document.querySelector('.db-copy-status')?.textContent.includes('1件を今日'));
 assert.equal(copyPosts.length,1);assert.equal(copyPosts[0].date,'2026-10-04');assert.equal(copyPosts[0].rows[0].instruction,'今日の既存記事');assert.equal(copyPosts[0].rows.at(-1).instruction,'個別コピー');assert.notEqual(copyPosts[0].rows.at(-1).id,'copysource0001');
 await copyPage.locator('.db-copy-all').check();await copyPage.getByRole('button',{name:'選択した記事を今日へコピー',exact:true}).click();await copyPage.waitForFunction(()=>document.querySelector('.db-copy-status')?.textContent.includes('2件を今日'));
 assert.equal(copyPosts.length,2);assert.deepEqual(copyPosts[1].rows.slice(-2).map(r=>r.instruction),['個別コピー','一括コピー']);assert.equal(copyPosts[1].rows.at(-1).displayStartAt,'2026-10-04T08:30');await copyPage.close();
 assert.deepEqual(errors,[]);console.log('PASS: advance notice admin editing/drag order, individual/bulk copy to today, public filtering/validation, automatic -3/+2 minute pulse without reload, countdown drawing/settings, Japan midnight content; isolated data only.');
 }finally{await browser?.close();server.kill();fs.rmSync(tmp,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
