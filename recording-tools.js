(()=>{'use strict';
const fields='#groupMemo,#groupHomework,#lessonRecordMemo,#lessonHomework,#generatorRecordMemo,#generatorHomework,.editBox .editMemo,.editBox .editHomework',attendance='.attSel,.generator-att-select,[data-group-attendance],[data-att-row]';
const statusNames={'欠席':'absent','遅刻':'late','免除':'exempt','不明':'unknown','未定':'pending'};
function decorate(){
 repairGroup();
 const admin=StaffAuth.user?.role==='admin';
 for(const field of document.querySelectorAll(fields)){
  if(admin&&!field.dataset.tbdButton){field.dataset.tbdButton='1';const b=document.createElement('button');b.type='button';b.className='ws-button recording-tbd';b.textContent='未定にする';b.onclick=()=>{if(field.disabled)return;if(field.value.trim()&&field.value.trim()!=='未定'&&!confirm('入力中の内容を「未定」に置き換えますか？'))return;field.value='未定';field.dispatchEvent(new Event('input',{bubbles:true}));};field.after(b);}
  const button=field.nextElementSibling;if(button?.classList.contains('recording-tbd')&&button.disabled!==field.disabled)button.disabled=field.disabled;
  field.classList.toggle('recording-pending',field.value.trim()==='未定');
 }
 for(const field of document.querySelectorAll(attendance)){
  const option=[...field.options].find(o=>o.value==='未定'),disabled=!admin&&field.value!=='未定';if(option&&option.disabled!==disabled)option.disabled=disabled;
  const row=field.closest('.att-row,.generator-att-row,.group-att-row')||(field.matches('[data-att-row]')?field.closest('label'):null);if(row){row.classList.add('recording-attendance-row');row.dataset.attendanceStatus=statusNames[field.value]||'';}
 }
 for(const root of document.querySelectorAll('[data-recording-key]'))context(root.dataset.recordingKey,root);
 const group=document.getElementById('groupRecordSection');if(group&&location.pathname.endsWith('lesson_group.html'))context('GROUP:'+new URLSearchParams(location.search).get('id'),group);
}
function repairGroup(){
 const root=document.getElementById('groupRecordSection'),bar=document.querySelector('.group-savebar'),del=document.getElementById('groupDelete');if(bar&&del&&bar.firstElementChild!==del)bar.prepend(del);
 if(!root)return;let links=root.querySelector('.group-record-links');if(!links){links=document.createElement('div');links.className='group-record-links';(root.querySelector('.group-section-title')||root.firstElementChild).after(links);}
 for(const [id,label] of [['groupTests','成績・テスト結果入力'],['groupRecords','この授業のカルテ一覧']]){const a=document.getElementById(id);if(!a)continue;if(a.parentElement!==links)links.append(a);a.classList.add('ws-button');if(a.textContent!==label)a.textContent=label;if(id==='groupTests'){const href='test_results.html?new=1&key='+encodeURIComponent('GROUP:'+new URLSearchParams(location.search).get('id'));if(a.getAttribute('href')!==href)a.setAttribute('href',href);}}
 const build=document.querySelector('.group-build');if(build&&build.textContent!=='更新版 r56')build.textContent='更新版 r56';
}
function previousMeta(j){if(!j.date)return '前回の授業はありません。';const date=new Date(j.date+'T00:00:00Z'),weekday=['日','月','火','水','木','金','土'][date.getUTCDay()];return j.date+'（'+weekday+'）'+(j.endTime?' '+j.endTime+'終了':'');}
function elapsed(box){const end=Date.parse(box.dataset.endedAt);if(!Number.isFinite(end))return;const now=Date.now()+Number(box.dataset.clockOffset||0),hours=Math.floor(Math.abs(now-end)/3600000);box.textContent=(now>=end?'前回の授業終了：':'前回の授業終了まで ')+Math.floor(hours/24)+'日と'+hours%24+'時間'+(now>=end?'前':'');}
async function context(key,root,force=false){
 if(!root||(!force&&root.dataset.recordingContext===key))return;root.dataset.recordingContext=key;const ticket=String(Number(root.dataset.recordingTicket||0)+1);root.dataset.recordingTicket=ticket;const current=()=>root.dataset.recordingContext===key&&root.dataset.recordingTicket===ticket;
 let box=root.querySelector('.recording-previous');if(!box){box=document.createElement('aside');box.className='recording-previous';root.prepend(box);}box.textContent='この授業までの宿題を確認中…';
 let tests=root.querySelector('.recording-tests');if(!tests){tests=document.createElement('div');tests.className='recording-tests';const existing=root.querySelector('.group-record-links');if(existing)existing.after(tests);else box.after(tests);}
 tests.innerHTML=(root.querySelector('#groupTests')?'':'<a class="ws-button" href="test_results.html?key='+encodeURIComponent(key)+'&new=1">成績・テスト結果入力</a>')+'<span role="status">テストの未報告を確認中…</span>';
 await Promise.allSettled([
  (async()=>{try{const j=await Workspace.api('lesson_record_api.php?action=previous_homework&key='+encodeURIComponent(key));if(!current())return;box.innerHTML='<strong>この授業までの宿題（前回分）</strong><p>'+Workspace.esc(j.date?(j.homework||'前回の宿題は未記録です。'):'前回の授業はありません。')+'</p>'+(j.date?'<small>'+Workspace.esc(previousMeta(j))+'</small>':'');if(j.endedAt){const e=document.createElement('small');e.className='recording-elapsed';e.dataset.endedAt=j.endedAt;e.dataset.clockOffset=String(Date.parse(j.serverNow)-Date.now());box.append(e);elapsed(e);}}catch(e){if(current())box.textContent='前回の宿題を読み込めませんでした。再読み込みしてください。';}})(),
  (async()=>{try{const j=await Workspace.api('test_results_api.php?key='+encodeURIComponent(key));if(!current())return;const names=new Set(j.items.flatMap(r=>r.pendingStudents||[])),status=tests.querySelector('[role=status]');status.replaceChildren();if(names.size){const link=document.createElement('a');link.href='test_results.html?pending=1&key='+encodeURIComponent(key);link.className='recording-test-warning';link.textContent='テストが未報告の生徒がいます（'+names.size+'名）→ 結果を入力';status.append(link);}else status.textContent='テストの未報告はありません。';}catch(e){if(current())tests.querySelector('[role=status]').textContent='テストの未報告を確認できませんでした。結果一覧で確認してください。';}})()
 ]);
}
window.RecordingTools={context,repairGroup};let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate();});};
const boot=()=>{decorate();new MutationObserver(schedule).observe(document.body,{childList:true,attributes:true,attributeFilter:['disabled'],subtree:true});document.addEventListener('input',schedule);document.addEventListener('change',schedule);};
setInterval(()=>{for(const e of document.querySelectorAll('.recording-elapsed'))elapsed(e);if(!document.hidden)for(const e of document.querySelectorAll('[data-recording-context]'))if(e.offsetParent!==null)context(e.dataset.recordingContext,e,true);},60000);
window.addEventListener('focus',()=>{for(const e of document.querySelectorAll('[data-recording-context]'))if(e.offsetParent!==null)context(e.dataset.recordingContext,e,true);});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
