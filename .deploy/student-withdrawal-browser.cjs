// Isolated browser fixture; all requests intercepted, no production data or sessions.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));let directory={},posts=0,fail=false;
 const students=[{'生徒名':'架空生徒A','クラス':'ClassA'},{'生徒名':'架空生徒B','クラス':'ClassA'}];const root=path.resolve(__dirname,'..');
 await context.route('**/*',async route=>{const name=new URL(route.request().url()).pathname.slice(1);
 if(name==='class_members_api.php'){if(route.request().method()==='POST'){posts++;if(fail)return route.fulfill({status:500,json:{ok:false,error:'検証用保存失敗'}});const p=route.request().postDataJSON();assert.equal(p.action,'withdrawal');assert.equal(p.expectedWithdrawn,!!directory.withdrawnStudents?.[p.name]);directory={withdrawnStudents:{[p.name]:p.withdrawn},hiddenStudents:{[p.name]:p.withdrawn},hiddenStudentFrom:{[p.name]:'0001-01-01'}};}return route.fulfill({json:{ok:true,students,directory}});}
 if(name==='lesson_visibility_api.php')return route.fulfill({json:{ok:true,hidden:[]}});
 if(name==='staff-auth.js')return route.fulfill({body:'window.StaffAuth={user:{role:"admin"},ready:Promise.resolve({user:{role:"admin"}})};'});
 if(name==='workspace-ui.js'){let source=fs.readFileSync(path.join(root,name),'utf8').split('Workspace.ready=')[0];return route.fulfill({body:source+'Workspace.ready=Promise.resolve();})();',contentType:'application/javascript'});}
 if(name==='student-profile.js')return route.fulfill({body:'window.StudentProfiles={get:()=>({}),refresh:async()=>{}};'});
 if(name==='student-participation.js')return route.fulfill({body:'window.StudentParticipation={freeAt:()=>false};'});
 if(name.endsWith('.js')&&name!=='student-manage.js')return route.fulfill({body:''});
 if(fs.existsSync(path.join(root,name)))return route.fulfill({body:fs.readFileSync(path.join(root,name),'utf8').replace(/<\?php[^]*?\?>/,''),contentType:name.endsWith('.php')?'text/html':name.endsWith('.js')?'application/javascript':'text/css'});
 return route.fulfill({body:''});});
 await page.goto('http://fixture/student_manage.php');await page.waitForSelector('[data-student-withdrawal]');assert.equal(await page.locator('.directory-row').count(),2);
 page.once('dialog',d=>d.dismiss());await page.locator('[data-student-withdrawal="架空生徒A"]').click();assert.equal(posts,0);
 page.once('dialog',d=>d.accept());await page.locator('[data-student-withdrawal="架空生徒A"]').click();await page.waitForFunction(()=>document.querySelectorAll('.directory-row').length===1);assert.equal(posts,1);
 assert.equal(await page.evaluate(()=>Workspace.hiddenAt('架空生徒A','2020-01-01')),true);assert.equal(await page.evaluate(()=>Workspace.roster('ClassA','2020-01-01').length),1);
 await page.locator('#studentManageHidden').check();assert.equal(await page.locator('.directory-row').count(),2);assert.equal(await page.locator('[data-student-withdrawal="架空生徒A"]').textContent(),'在籍に戻す');assert.equal(await page.locator('[data-student-visibility="架空生徒A"]').isVisible(),false);
 page.once('dialog',d=>d.accept());await page.locator('[data-student-withdrawal="架空生徒A"]').click();await page.waitForFunction(()=>document.querySelector('[data-student-withdrawal="架空生徒A"]').textContent==='退会にする');assert.equal(posts,2);
 fail=true;page.once('dialog',d=>d.accept());await page.locator('[data-student-withdrawal="架空生徒A"]').click();await page.waitForFunction(()=>document.querySelector('#studentManageMessage').textContent.includes('検証用保存失敗'));assert.equal(await page.locator('[data-student-withdrawal="架空生徒A"]').isEnabled(),true);assert.equal(await page.evaluate(()=>Workspace.withdrawnStudent('架空生徒A')),false);fail=false;
 await page.locator('#studentManageHidden').uncheck();await page.reload();await page.waitForSelector('[data-student-withdrawal]');assert.equal(await page.locator('.directory-row').count(),2);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({mobile,cancel:true,withdraw:true,allDatesHidden:true,restore:true,failureRecovery:true,reload:true,errors}));await context.close();
 }}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});