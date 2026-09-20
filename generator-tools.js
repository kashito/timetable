(()=>{
const $=id=>document.getElementById(id),esc=Workspace.esc;let current=null,record={},loaded=false,requestId=0;
const advanced=document.createElement('details');advanced.className='generator-advanced';advanced.innerHTML='<summary>Excel入出力・授業の非表示・従来の生徒管理</summary>';const main=document.querySelector('main');const after=document.querySelector('.confirmed-date-bar');if(after)after.after(advanced);else main.prepend(advanced);for(const selector of ['.header-actions','.master-panel','.lesson-visibility-panel']){const node=document.querySelector(selector);if(node)advanced.appendChild(node);}
const filters=document.createElement('div');filters.className='generator-tools-row';filters.innerHTML='<label>教室で見る<select id="generatorRoomFilter"><option value="">すべての教室</option></select></label><label>生徒で見る<select id="generatorStudentFilter"><option value="">すべての生徒</option></select></label><label class="ws-check"><input id="generatorShowHidden" type="checkbox">非表示の授業・生徒も選択肢に表示</label><button id="generatorClassSchedule" type="button">選んだ授業の全予定</button><button id="generatorMembers" type="button">参加生徒を編集</button>';
($('status')||$('gridWrap')).before(filters);
['generatorRoomFilter','generatorStudentFilter'].forEach(id=>$(id).onchange=()=>Generator.render());$('generatorShowHidden').onchange=()=>{refresh();Generator.refreshChoices();Generator.render();};
const selectedClass=()=>document.getElementById('classFilter')?.value||'';
$('generatorClassSchedule').onclick=()=>location.assign('class_schedule.html'+(selectedClass()?'?class='+encodeURIComponent(selectedClass()):''));
$('generatorMembers').onclick=()=>{const cls=selectedClass();if(!cls){alert('上の「クラス」で授業を選んでください。');return;}Workspace.openMembers(cls);};
const area=document.createElement('section');area.className='generator-ops-section';area.id='generatorRecordEditor';area.innerHTML='<h3>このコマのカルテ・次回の宿題</h3><div id="generatorDetailLinks" class="detail-shortcuts"></div><div id="generatorCarriedHomework"></div><label>カルテ<textarea id="generatorRecordMemo" class="generator-lesson-record-input" placeholder="授業・指導の記録"></textarea></label><label>次回の同じ授業日までの宿題<textarea id="generatorHomework" class="generator-lesson-record-input" style="min-height:70px"></textarea></label><p class="ws-muted">カルテ本文の空欄保存では既存本文を消しません。宿題は空欄保存で取り消せます。</p><button id="generatorRecordSave" type="button" class="ops-save-button">カルテ・宿題を保存</button><span id="generatorRecordStatus" class="ws-message" role="status"></span><div id="generatorRecordReplies"></div><div class="ws-controls"><input id="generatorReplyText" placeholder="このカルテに返信"><button id="generatorReplySave" type="button">返信</button><button id="generatorRead" type="button">よみました</button></div><h3>資料の送受信</h3><div id="generatorFiles"></div><div class="ws-controls"><input id="generatorFileInput" type="file" multiple><button id="generatorFileUpload" type="button">資料を送る</button></div>';
$('generatorOps').prepend(area);document.querySelector('.generator-record-section')?.setAttribute('hidden','');
document.addEventListener('roster-updated',()=>{refresh();Generator.refreshChoices();Generator.render();});
function refresh(){
 if(!window.Generator)return;const data=Generator.rows();
 function fill(id,values,blank){const e=$(id),v=e.value;e.innerHTML=`<option value="">${blank}</option>`+values.map(x=>`<option value="${esc(x)}">${esc(x||'未設定')}</option>`).join('');e.value=values.includes(v)?v:'';}
 fill('generatorRoomFilter',[...new Set(data.map(r=>r['教室']||'__UNSET__'))].sort(),'すべての教室');
 fill('generatorStudentFilter',[...new Set(Generator.students().map(r=>r['生徒名']).filter(n=>n&&($('generatorShowHidden').checked||!Workspace.hiddenStudent(n))))].sort((a,b)=>a.localeCompare(b,'ja')),'すべての生徒');
}
function matches(r){const room=$('generatorRoomFilter').value,student=$('generatorStudentFilter').value;return (!room||(r['教室']||'__UNSET__')===room)&&(!student||Workspace.roster(r['クラス'],r['日付']).some(x=>x['生徒名']===student));}
async function files(){if(!current)return;const key=Generator.eventKey(current);const items=await StudentAttachments.list(key,true);$('generatorFiles').innerHTML=items.map(a=>`<div class="detail-shortcuts"><a href="${StudentAttachments.rawUrl(a)}">${a.sender==='student'?'生徒から':'先生から'}：${esc(a.name)}</a>${a.canDelete?`<button type="button" data-file-remove="${esc(a.id)}">削除</button>`:''}</div>`).join('')||'<p class="ws-muted">添付はありません。</p>';}
function showRecord(){const reads=Object.keys(record.reads||{});$('generatorRecordReplies').innerHTML=(record.replies||[]).map(r=>`<div class="ws-card"><b>${esc(r.author)}</b><p>${esc(r.text)}</p><small>${new Date(r.createdAt).toLocaleString('ja-JP')}</small></div>`).join('')+(reads.length?`<p class="ws-muted">よみました：${reads.map(esc).join('、')}</p>`:'');}
async function open(row,mode){
 current={...row};record={};loaded=false;const id=++requestId;area.hidden=mode!=='edit';if(mode!=='edit')return;
 $('generatorRecordMemo').value=$('generatorHomework').value='';$('generatorRecordMemo').disabled=$('generatorHomework').disabled=true;$('generatorRecordStatus').textContent='カルテを読み込み中…';$('generatorCarriedHomework').dataset.recordingKey=Generator.eventKey(row);
 $('generatorDetailLinks').innerHTML=`${StaffAuth.user?.role==='admin'?`<button type="button" data-link-lesson="${esc(row._sourceKey||'')}">コマを連結</button>`:''}<a href="${Workspace.classLink(row['クラス'])}">この授業の全予定</a><button type="button" data-manage-class="${esc(row['クラス'])}">参加生徒を編集</button><a href="lesson_records.html?class=${encodeURIComponent(row['クラス'])}">カルテ一覧</a><a href="teacher2026summer_vertical.html?teacher=${encodeURIComponent(row['担当講師']||'')}">講師の予定</a>`;
 if(window.LessonFixed)LessonFixed.editor(Generator.eventKey(row),$('generatorDetailLinks'));
 try{
  const j=await Workspace.api('lesson_record_api.php?key='+encodeURIComponent(Generator.eventKey(row)));if(id!==requestId)return;record=j.record||{};loaded=true;$('generatorRecordMemo').value=record.memo||'';$('generatorHomework').value=record.homework||'';$('generatorRecordMemo').disabled=$('generatorHomework').disabled=false;$('generatorRecordStatus').textContent='';showRecord();
  $('generatorCarriedHomework').dataset.recordingKey=Generator.eventKey(row);window.RecordingTools?.context(Generator.eventKey(row),$('generatorCarriedHomework'),true);await files();
 }catch(e){if(id===requestId)$('generatorRecordStatus').textContent='読込失敗：'+e.message;}
}
async function save(row=current){
 if(!row||!loaded)throw new Error('カルテを読み込めていません。保存せず、詳細を開き直してください。');
 const context=Generator.saveContext(),key=Generator.eventKey(row),memo=$('generatorRecordMemo').value,homework=$('generatorHomework').value;
 const j=await Workspace.api('lesson_record_api.php',{eventKey:key,memo,homework,date:Workspace.iso(row['日付']),slot:row['時間番号'],className:row['クラス'],teacher:row['担当講師'],room:row['教室'],subject:row['科目']});
 if(!Generator.isCurrentSave(context))return j.record||{};
 record=j.record||{};current={...row};
 const saved={generatorRecordMemo:record.memo||'',generatorHomework:record.homework||''};
 // Preserve text entered during the save, and keep it marked as unsaved.
 if($('generatorRecordMemo').value===memo)$('generatorRecordMemo').value=saved.generatorRecordMemo;
 if($('generatorHomework').value===homework)$('generatorHomework').value=saved.generatorHomework;
 Generator.markSaved(saved,context);
 $('generatorRecordStatus').textContent='保存しました。';return record;
}
$('generatorRecordSave').onclick=async e=>{e.target.disabled=true;try{await save();}catch(err){$('generatorRecordStatus').textContent=err.message;}finally{e.target.disabled=false;}};
for(const [id,action] of [['generatorReplySave','reply'],['generatorRead','read']])$(id).onclick=async e=>{e.target.disabled=true;try{await save();const j=await Workspace.api('lesson_record_api.php',{action,eventKey:Generator.eventKey(current),text:$('generatorReplyText').value});record=j.record;$('generatorReplyText').value='';showRecord();}catch(err){$('generatorRecordStatus').textContent=err.message;}finally{e.target.disabled=false;}};
$('generatorFileUpload').onclick=async e=>{e.target.disabled=true;try{for(const f of $('generatorFileInput').files)await StudentAttachments.upload(Generator.eventKey(current),f);$('generatorFileInput').value='';await files();}catch(err){$('generatorRecordStatus').textContent=err.message;}finally{e.target.disabled=false;}};
$('generatorFiles').onclick=async e=>{const b=e.target.closest('[data-file-remove]');if(!b||!confirm('この資料を削除しますか？'))return;try{await StudentAttachments.remove(Generator.eventKey(current),b.dataset.fileRemove);await files();}catch(err){$('generatorRecordStatus').textContent=err.message;}};
window.GeneratorExtras={get loaded(){return loaded;},refresh,matches,open,save,showRoom:room=>!$('generatorRoomFilter').value||room===($('generatorRoomFilter').value==='__UNSET__'?'':$('generatorRoomFilter').value)};
StaffAuth.ready.then(async j=>{await Workspace.ready;refresh();if(j.user?.role!=='admin'){for(const id of ['saveAdd','deleteLesson','duplicateNextLesson','loadExcel','scheduleConfirmedDate','toggleMasterPanel','toggleLessonVisibilityPanel','quickAddLesson']){const e=$(id);if(e)e.hidden=true;}}});
})();
