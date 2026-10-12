'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
async function client(reply){
 let writes=0;
 const noop=()=>{},context=vm.createContext({URL,Headers,Response,Event,JSON,console,location:{href:'https://fixture.invalid/schedule_generator.php',origin:'https://fixture.invalid',pathname:'/schedule_generator.php'},
  document:{currentScript:{dataset:{}},documentElement:{classList:{add:noop,remove:noop,toggle:noop}},head:{append:noop},createElement:()=>({}),dispatchEvent:noop,addEventListener:noop},localStorage:{setItem:noop},confirm:()=>false,
  fetch:async(input,options)=>{if(input==='staff_auth_api.php')return new Response(JSON.stringify({ok:true,user:{id:'teacher',role:'teacher'},csrf:'synthetic'}));if(options?.method==='POST'){writes++;return reply();}return new Response('{}');}});
 context.window=context;vm.runInContext(fs.readFileSync(path.join(__dirname,'../staff-auth.js'),'utf8'),context);await context.StaffAuth.ready;
 return {post:()=>context.fetch('lesson_record_api.php',{method:'POST',body:'{}'}),writes:()=>writes};
}
for(const [label,status,body] of [['empty',200,''],['HTML',500,'<html>error</html>'],['truncated',200,'{"ok":'],['wrong JSON shape',200,'{}']])test(label+' write response stays unknown and is not resent',async()=>{const c=await client(()=>new Response(body,{status}));await assert.rejects(c.post(),e=>e.unconfirmedWrite&&/lesson_record_api/.test(e.message));assert.equal(c.writes(),1);});
test('network loss is unknown and is not automatically resent',async()=>{const c=await client(()=>{throw Error('synthetic network loss');});await assert.rejects(c.post(),e=>e.unconfirmedWrite);assert.equal(c.writes(),1);});
test('server unknown outcome is not treated as success',async()=>{const c=await client(()=>new Response('{"ok":false,"outcomeUnknown":true}',{status:500}));await assert.rejects(c.post(),e=>e.unconfirmedWrite);assert.equal(c.writes(),1);});
test('known server rejection keeps its original JSON and status',async()=>{const c=await client(()=>new Response('{"ok":false,"error":"synthetic rejection"}',{status:403})),r=await c.post();assert.equal(r.status,403);assert.equal((await r.json()).error,'synthetic rejection');assert.equal(c.writes(),1);});
test('successful JSON remains available to the caller',async()=>{const c=await client(()=>new Response('{"ok":true,"record":{"memo":"saved"}}')),r=await c.post();assert.equal((await r.json()).record.memo,'saved');assert.equal(c.writes(),1);});
