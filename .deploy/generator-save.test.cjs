'use strict';
// Execute the production dialog handlers with a tiny DOM/HTTP boundary. All
// lesson and student values are synthetic; no server or operating data is used.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=process.env.GENERATOR_TEST_SOURCE||path.resolve(__dirname,'..');
const generator=fs.readFileSync(path.join(root,'schedule-generator.js'),'utf8');
const extras=fs.readFileSync(path.join(root,'generator-tools.js'),'utf8');
function section(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert(a>=0&&b>a);return source.slice(a,b);}
const handlers=section(generator,'async function saveGeneratorTeacherMemo()','async function populateModal(')+
 section(generator,"let generatorModalSnapshot=",'async function requestCloseModal()')+
 section(generator,'function forceCloseModal()','async function deleteCurrentLesson()')+
 section(extras,'async function save(row=current)',"$('generatorRecordSave').onclick").replace('async function save(','async function saveRecord(');
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve};}
async function dialog(){
 const nodes=new Map();
 const element=id=>{if(!nodes.has(id)){const classes=new Set();nodes.set(id,{value:'',textContent:'',disabled:false,dataset:{},classList:{contains:n=>classes.has(n),add:n=>classes.add(n),remove:n=>classes.delete(n)}});}return nodes.get(id);};
 const attendance=element('attendance');attendance.dataset.name='テスト生徒';attendance.dataset.autoExempt='false';attendance.value='---';
 const row={'日付':'2026/09/22','時間番号':'⑦','クラス':'検証クラス','種別':'授業','担当講師':'検証講師'};
 let calls=0,request=async(url,options)=>({ok:true,json:async()=>({ok:true,row}),text:async()=>JSON.stringify({ok:true,state:{}})});
 const context=vm.createContext({console,setTimeout,JSON,document:{getElementById:element,querySelectorAll:s=>s==='.generator-att-select'?[attendance]:[],querySelector:()=>attendance},
  fetch:(...args)=>request(...args),SharedNotes:{post:async(cls,input)=>{input.value='';}},
  LessonPlacement:{next:async()=>{calls++;return null;}},StaffAuth:{user:{role:'admin'}},
  normalize:r=>r,isoToGeneratorDate:v=>v,currentModalRow:()=>row,generatorEventKey:()=>row['日付']+'|'+row['時間番号'],
  getChoiceValue:(a,b)=>element(a).value||element(b).value,getTypeValue:()=>row['種別'],getRoomValue:()=>'',
  applyEdits:()=>{},refreshChoices:()=>{},render:()=>{},load:async()=>{},
  Workspace:{iso:v=>v,api:async(url,payload)=>({record:{memo:payload.memo.trim()||'既存カルテ',homework:payload.homework.trim()}})}});
 context.window=context;
 vm.runInContext("const $=id=>document.getElementById(id);let generatorOpsLoaded=true,generatorClassState={},edits={},addedRows=[],current="+JSON.stringify(row)+",loaded=true,record={};\n"+handlers,context);
 context.Generator={eventKey:context.generatorEventKey,saveContext:()=>context.generatorSaveContext(),isCurrentSave:c=>context.generatorSaveIsCurrent(c),markSaved:(v,c)=>context.markGeneratorFieldsSaved(v,c)};
 context.GeneratorExtras={loaded:true,save:r=>context.saveRecord(r)};
 element('fMode').value='edit';element('fSourceKey').value='test-source';element('fDate').value=row['日付'];element('fClassSelect').value=row['クラス'];
 context.markGeneratorModalSnapshot();await new Promise(r=>setTimeout(r,1));
 return {c:context,e:element,attendance,dirty:()=>context.generatorModalHasChanges(),duplicate:()=>context.duplicateLessonToNextSlot(),calls:()=>calls,request:f=>{request=f;},mark:()=>context.markGeneratorModalSnapshot()};
}
test('unchanged dialog can open duplication',async()=>{const h=await dialog();await h.duplicate();assert.equal(h.calls(),1);});
test('attendance save clears the stale warning and permits duplication',async()=>{const h=await dialog();h.attendance.value='出席';await h.duplicate();assert.equal(h.calls(),0);assert.match(h.e('formMsg').textContent,/未保存/);await h.c.persistGeneratorAttendance();assert.equal(h.dirty(),false);assert.equal(h.e('formMsg').textContent,'');await h.duplicate();assert.equal(h.calls(),1);});
test('failed attendance save remains unsaved and blocks duplication',async()=>{const h=await dialog();h.attendance.value='欠席';h.request(async()=>({ok:false,text:async()=>JSON.stringify({ok:false,error:'test failure'})}));assert.equal(await h.c.persistGeneratorAttendance(),false);assert(h.dirty());await h.duplicate();assert.equal(h.calls(),0);});
test('attendance save does not acknowledge an unsaved lesson message',async()=>{const h=await dialog();h.attendance.value='出席';h.e('fNote').value='まだ保存していない';await h.c.persistGeneratorAttendance();assert(h.dirty());await h.duplicate();assert.equal(h.calls(),0);});
test('attendance edited during save remains dirty',async()=>{const h=await dialog(),gate=deferred();h.attendance.value='出席';h.request(()=>gate.promise);const saving=h.c.persistGeneratorAttendance();h.attendance.value='遅刻';gate.resolve({ok:true,text:async()=>JSON.stringify({ok:true,state:{}})});await saving;assert(h.dirty());assert.equal(h.attendance.value,'遅刻');});
test('clearing attendance is also acknowledged',async()=>{const h=await dialog();h.attendance.value='出席';h.mark();h.attendance.value='---';await h.c.persistGeneratorAttendance();assert.equal(h.dirty(),false);});
test('record and homework save acknowledges canonical server text',async()=>{const h=await dialog();h.e('generatorRecordMemo').value=' 記録 ';h.e('generatorHomework').value=' 宿題 ';await h.c.saveRecord();assert.equal(h.dirty(),false);assert.equal(h.e('generatorRecordMemo').value,'記録');assert.equal(h.e('generatorHomework').value,'宿題');await h.duplicate();assert.equal(h.calls(),1);});
test('record save retains existing memo when server preserves a blank submission',async()=>{const h=await dialog();await h.c.saveRecord();assert.equal(h.e('generatorRecordMemo').value,'既存カルテ');assert.equal(h.dirty(),false);});
test('failed record save remains dirty',async()=>{const h=await dialog();h.e('generatorRecordMemo').value='記録';h.c.Workspace.api=async()=>{throw Error('test failure');};await assert.rejects(h.c.saveRecord());assert(h.dirty());});
test('record save does not acknowledge other attendance changes',async()=>{const h=await dialog();h.e('generatorRecordMemo').value='記録';h.attendance.value='出席';await h.c.saveRecord();assert(h.dirty());await h.duplicate();assert.equal(h.calls(),0);});
test('typing during record save is preserved and remains dirty',async()=>{const h=await dialog(),gate=deferred();h.e('generatorRecordMemo').value='送信した記録';h.e('generatorHomework').value='送信した宿題';h.c.Workspace.api=()=>gate.promise;const saving=h.c.saveRecord();h.e('generatorRecordMemo').value='保存中に追加';h.e('generatorHomework').value='保存中の宿題';gate.resolve({record:{memo:'送信した記録',homework:'送信した宿題'}});await saving;assert.equal(h.e('generatorRecordMemo').value,'保存中に追加');assert.equal(h.e('generatorHomework').value,'保存中の宿題');assert(h.dirty());});
test('successful shared memo post clears only its draft',async()=>{const h=await dialog();h.e('fTeacherSharedMemo').value='共有メモ';await h.c.saveGeneratorTeacherMemo();assert.equal(h.dirty(),false);await h.duplicate();assert.equal(h.calls(),1);});
test('shared memo post leaves unrelated unsaved changes',async()=>{const h=await dialog();h.e('fTeacherSharedMemo').value='共有メモ';h.e('fNote').value='未保存';await h.c.saveGeneratorTeacherMemo();assert(h.dirty());});
test('failed shared memo post remains dirty',async()=>{const h=await dialog();h.e('fTeacherSharedMemo').value='共有メモ';h.c.SharedNotes.post=async()=>{throw Error('test failure');};assert.equal(await h.c.saveGeneratorTeacherMemo(),false);assert(h.dirty());});
test('new shared memo typed during posting remains dirty',async()=>{const h=await dialog(),gate=deferred();h.e('fTeacherSharedMemo').value='送信';h.c.SharedNotes.post=()=>gate.promise;const saving=h.c.saveGeneratorTeacherMemo();h.e('fTeacherSharedMemo').value='次のメモ';gate.resolve(true);await saving;assert(h.dirty());});
test('late response from closed dialog cannot mark the reopened dialog saved',async()=>{const h=await dialog(),gate=deferred();h.attendance.value='出席';h.request(()=>gate.promise);const saving=h.c.persistGeneratorAttendance();h.c.forceCloseModal();h.e('modal').classList.remove('hidden');h.attendance.value='---';h.mark();h.attendance.value='出席';gate.resolve({ok:true,text:async()=>JSON.stringify({ok:true,state:{}})});await saving;assert(h.dirty());});
test('late record response cannot overwrite another lesson',async()=>{const h=await dialog(),gate=deferred();h.e('generatorRecordMemo').value='前の授業';h.c.Workspace.api=()=>gate.promise;const saving=h.c.saveRecord();h.e('fSourceKey').value='another-source';h.e('generatorRecordMemo').value='別の授業の編集中';gate.resolve({record:{memo:'前の授業',homework:''}});await saving;assert.equal(h.e('generatorRecordMemo').value,'別の授業の編集中');assert(h.dirty());});
test('main save still closes the dialog after all sections succeed',async()=>{const h=await dialog();h.e('generatorRecordMemo').value='記録';h.attendance.value='出席';await h.c.saveForm();assert(h.e('modal').classList.contains('hidden'));assert.equal(h.e('saveAdd').disabled,false);});
test('main save retains dialog and unsaved record when section save fails',async()=>{const h=await dialog();h.e('generatorRecordMemo').value='記録';h.c.Workspace.api=async()=>{throw Error('test failure');};await h.c.saveForm();assert.equal(h.e('modal').classList.contains('hidden'),false);assert(h.dirty());assert.match(h.e('formMsg').textContent,/保存失敗/);});
