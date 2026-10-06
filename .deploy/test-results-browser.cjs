// Browser regression with synthetic API responses; no production data or accounts.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1200,height:900},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[],saved=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
  const lesson={key:'synthetic',students:['検証A','検証B'],date:'2026-10-06',slots:'①',className:'検証クラス'};
  let items=[];
  await page.route('https://test.local/**',async route=>{
   const file=new URL(route.request().url()).pathname.slice(1);
   if(file==='staff-auth.js')return route.fulfill({contentType:'text/javascript',body:'window.StaffAuth={ready:Promise.resolve()};'});
   if(file==='workspace-ui.js')return route.fulfill({contentType:'text/javascript',body:`window.Workspace={ready:Promise.resolve(),esc:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),api:async(url,body)=>{const response=await fetch(url,body?{method:'POST',body:JSON.stringify(body)}:{});return response.json();}};`});
   if(file==='test_results_api.php'){
    if(route.request().method()==='POST'){const body=JSON.parse(route.request().postData());saved.push(body);items=[{...body,id:'fixture',date:lesson.date,className:lesson.className,slots:lesson.slots,updatedAt:new Date().toISOString(),updatedBy:'検証',pendingStudents:Object.keys(body.statuses).filter(n=>body.statuses[n]==='unreported')}];}
    return route.fulfill({json:{items,context:lesson,canArchive:false}});
   }
   return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(path.join(root,file),'utf8')});
  });
  await page.goto('https://test.local/test_results.html?key=synthetic&new=1');
  const score=page.locator('[data-score="0"]'),status=page.locator('[data-status="0"]');
  await page.locator('dialog').waitFor({timeout:5000}).catch(async e=>{console.error(await page.locator('body').textContent());throw e;});
  assert.equal(await score.isEnabled(),true);assert.equal(await status.inputValue(),'ungraded');
  await page.locator('[name=name]').fill('△入力検証');await page.locator('[name=total]').fill('20');
  for(const bad of ['15-','-1','15-6','15--3','3.5']){await score.fill(bad);assert.equal(await score.evaluate(e=>e.checkValidity()),false);}
  await score.fill(' １５ - ３ ');assert.equal(await status.inputValue(),'reported');assert.equal(await score.evaluate(e=>e.checkValidity()),true);
  await page.locator('dialog button[type=submit]').click();await page.locator('dialog').waitFor({state:'detached'});
  assert.equal(saved[0].scores['検証A'],15);assert.equal(saved[0].partialScores['検証A'],3);assert.equal(saved[0].scores['検証B'],null);
  assert.match(await page.locator('.test-scores').textContent(),/75%（90%）/);
  // Copy fallback preserves score and both percentages.
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(Error('fixture'))},configurable:true}));
  await page.locator('[data-copy]').click();assert.match(await page.locator('dialog textarea').inputValue(),/15-3 \/ 20問 正答率 75%（90%）/);await page.locator('dialog button').click();
  await page.locator('[data-edit]').click();assert.equal(await score.inputValue(),'15-3');
  await score.fill('');assert.equal(await status.inputValue(),'ungraded');
  await score.fill('0');assert.equal(await status.inputValue(),'reported');
  await page.locator('dialog button[type=submit]').click();await page.locator('dialog').waitFor({state:'detached'});
  assert.equal(saved[1].scores['検証A'],0);assert.equal(saved[1].partialScores['検証A'],0);assert.match(await page.locator('.test-scores').textContent(),/正答率 0%/);
  await page.locator('[data-edit]').click();await score.fill('15-3');await status.selectOption('exempt');assert.equal(await score.inputValue(),'');assert.equal(await score.isEnabled(),true);
  await score.fill('10');assert.equal(await status.inputValue(),'reported');await score.fill('');
  await page.screenshot({path:path.join(root,'..',mobile?'test-results-mobile.png':'test-results-desktop.png')});
  await page.locator('dialog button[type=submit]').click();await page.locator('dialog').waitFor({state:'detached'});
  assert.equal(saved[2].scores['検証A'],null);assert.equal(saved[2].statuses['検証A'],'ungraded');
  assert.deepEqual(errors,[]);await context.close();console.log(`${mobile?'Mobile':'Desktop'} input, validation, roundtrip, copy, zero and clear: passed`);
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
