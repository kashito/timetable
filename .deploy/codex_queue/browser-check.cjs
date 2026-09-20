'use strict';
// Trusted test harness: candidate JS may run only in an isolated browser context.
const {chromium}=require('playwright'),fs=require('fs');
(async()=>{
 const [base,page,output]=process.argv.slice(2),channel=process.env.TIMETABLE_BROWSER_CHANNEL||(process.platform==='win32'?'msedge':undefined),browser=await chromium.launch({headless:true,...(channel?{channel}:{})});
 const context=await browser.newContext({viewport:{width:1280,height:850}});
 await context.route('**/*',route=>{const u=new URL(route.request().url());return u.origin===base?route.continue():route.abort();});
 const tab=await context.newPage();
 try{
  await tab.goto(base+'/'+page,{waitUntil:'domcontentloaded',timeout:15000});
  await tab.waitForTimeout(400);
  const result=await tab.evaluate(()=>({title:document.title,body:!!document.body&&document.body.innerText.trim().length>0,viewport:document.documentElement.clientWidth}));
  if(!result.title||!result.body)throw Error('Page is blank');
  await tab.screenshot({path:output,fullPage:false});
  console.log(JSON.stringify({passed:true,title:result.title,basicDisplay:true,note:'合成データでの基本表示。授業・給与の業務操作は未検証。'}));
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error('Basic browser display check failed: '+e.message);process.exit(1);});
