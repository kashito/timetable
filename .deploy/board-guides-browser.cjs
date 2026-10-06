// Isolated browser + PHP API regression. Requires playwright and TIMETABLE_TEST_PHP.
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('node:assert/strict'),{spawn}=require('child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'timetable-board-')),port=19873,url=`http://127.0.0.1:${port}`;
for(const p of ['board_guides_api.php','board_guides_settings.php','board-guides.js','board-guides.css','daily-board.js','daily-board.css','countdown.html','countdown.js','countdown.css'])fs.copyFileSync(path.join(root,p),path.join(tmp,p));
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
fs.writeFileSync(path.join(tmp,'daily_board.html'),`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="daily-board.css"><link rel="stylesheet" href="board-guides.css"><script>window.StaffAuth={ready:Promise.resolve(),user:{role:'admin'}};</script><script defer src="board-guides.js"></script><script defer src="daily-board.js"></script><section data-daily-board="page" data-board-id="blue"></section>`);
const server=spawn(process.env.TIMETABLE_TEST_PHP||'php',['-S',`127.0.0.1:${port}`,'-t',tmp],{windowsHide:true,stdio:'ignore'});
let browser;
const event=(id,date,category='test')=>({id,title:'試験'+id,category,startDate:date,kind:'school',schoolId:'s',schoolName:'検証学校',targetClasses:[]});
(async()=>{try{
 for(let i=0;i<50;i++){try{await fetch(url+'/countdown.html');break;}catch{await new Promise(r=>setTimeout(r,100));}}
 browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let events=[event('past','2026-10-03'),event('today','2026-10-04'),event('four','2026-10-08'),event('seven','2026-10-11'),event('ignored','2026-10-12','other')];
 await page.route('**/calendar_events_api.php',r=>r.fulfill({json:{ok:true,events,schools:[{id:'s',name:'検証学校'}]}}));
 await page.route('**/daily_board_api.php*',async r=>{const date=new URL(r.request().url()).searchParams.get('date');const serverTime=await page.evaluate(()=>new Date().toISOString());await r.fulfill({json:{ok:true,board:{date,settings:{title:'検証教室',background:'blue'},rows:[{id:'syntheticrow1',kind:'note',instruction:'当日 '+date,visible:true},{id:'syntheticrow2',kind:'note',instruction:'非公開行',visible:false}],canEdit:true,serverTime}}});});
 await page.clock.install({time:new Date('2026-10-04T03:00:00Z')});await page.goto(url+'/daily_board.html?mode=monitor');
 await page.waitForFunction(()=>document.querySelector('.bg-controls span')?.textContent.includes('20秒'));
 assert.match(await page.locator('.db-rows').innerText(),/当日 2026-10-04/);assert.doesNotMatch(await page.locator('.db-rows').innerText(),/非公開行/);
 await page.clock.fastForward(19500);assert.equal(await page.locator('.bg-stage').isVisible(),false);
 await page.clock.fastForward(500);await page.locator('.bg-stage').waitFor({state:'visible'});
 const frame=page.frameLocator('.bg-countdown');await frame.locator('.countdown-row').first().waitFor();
 assert.equal(await frame.locator('.countdown-row').count(),3);assert.deepEqual(await frame.locator('.countdown-number strong').allTextContents(),['本日','4','7']);
 assert.doesNotMatch(await frame.locator('#countdownRows').innerText(),/試験past|試験ignored/);
 await page.screenshot({path:path.join(tmp,'countdown-tested.png')});
 await page.clock.fastForward(10000);assert.equal(await page.locator('.bg-stage').isVisible(),true);
 await page.clock.fastForward(10000);assert.equal(await page.locator('.bg-stage').isVisible(),false);
 await page.getByRole('button',{name:'案内を編集',exact:true}).click();await page.locator('[name=mainSeconds]').fill('25');await page.locator('[data-seconds]').fill('23');
 await page.getByRole('button',{name:'公開して保存',exact:true}).click();await page.locator('.bg-editor').waitFor({state:'detached'});await page.reload();
 await page.waitForFunction(()=>document.querySelector('.bg-controls span')?.textContent.includes('25秒'));
 await page.getByRole('button',{name:'案内を編集',exact:true}).click();assert.equal(await page.locator('[data-seconds]').inputValue(),'23');await page.getByRole('button',{name:'閉じる',exact:true}).click();
 // More than three events page correctly; empty and past-only lists are explicit.
 await page.goto(url+'/countdown.html?embed=1');events=[event('one','2026-10-08'),event('two','2026-10-09'),event('three','2026-10-10'),event('fourth','2026-10-11')];await page.reload();await page.locator('.countdown-row').first().waitFor();assert.equal(await page.locator('.countdown-row').count(),3);assert.equal(await page.locator('header').isVisible(),false);assert.equal(await page.locator('footer').isVisible(),false);await page.clock.fastForward(10000);assert.equal(await page.locator('.countdown-row').count(),1);
 events=[event('past','2026-10-03')];await page.reload();await page.locator('.countdown-empty').waitFor();events=[];await page.reload();await page.locator('.countdown-empty').waitFor();
 // The same open monitor crosses Japan midnight and reads the new daily content.
 events=[event('four','2026-10-08')];await page.clock.setSystemTime(new Date('2026-10-04T14:59:50Z'));await page.goto(url+'/daily_board.html?mode=monitor');await page.waitForFunction(()=>document.querySelector('.bg-controls span')?.textContent.includes('25秒'));
 await page.clock.fastForward(30000);await page.waitForFunction(()=>document.querySelector('.db-rows')?.textContent.includes('2026-10-05'));await page.getByRole('button',{name:'次へ',exact:true}).click();await page.frameLocator('.bg-countdown').locator('.countdown-row').waitFor();assert.equal(await page.frameLocator('.bg-countdown').locator('.countdown-number strong').innerText(),'3');
 await page.getByRole('button',{name:'案内を編集',exact:true}).click();assert.equal(await page.locator('[name=mainSeconds]').inputValue(),'25');assert.equal(await page.locator('[data-seconds]').inputValue(),'23');
 assert.deepEqual(errors,[]);console.log('PASS: real countdown drawing, minimum 20-second monitor display, compact embedded layout, saved 25/23 reload, Japan midnight content/settings, today/past/empty/multiple events, hidden board rows; isolated data only.');
 }finally{await browser?.close();server.kill();fs.rmSync(tmp,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
