(()=>{'use strict';
const root=document.getElementById('sharedTodoList');if(!root)return;
const todo=!!document.getElementById('sharedTodoList'),esc=Workspace.esc;
const date=v=>v?new Date(v).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'}):'記録なし';
const day=v=>v?new Date(v).toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'}):'';
let data=null,busy=false,ticket=0,started=false,admin=false,storageKey='';
const $=id=>root.querySelector('#'+id),filterIds=['snFind','snAssignee','snState','snFrom','snUntil','snOrder'];
function remember(){try{sessionStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(filterIds.map(id=>[id,$(id).value]))));}catch(e){}}
function restore(){try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'{}');for(const id of filterIds)if(typeof saved[id]==='string'){$(id).value=saved[id];if($(id).tagName==='SELECT'&&$(id).selectedIndex<0)$(id).selectedIndex=0;}}catch(e){}}
function selected(){
 const q=$('snFind').value.trim().toLocaleLowerCase(),from=$('snFrom').value,until=$('snUntil').value,assignee=$('snAssignee').value,status=$('snState').value;
 $('snPeriodError').textContent=from&&until&&from>until?'終了日は開始日以降にしてください。':'';
 if(from&&until&&from>until)return [];
 return data.items.filter(r=>(!todo||r.todo)&&(assignee==='all'||(r.recipientIds||[]).includes(assignee))&&(!q||[r.text,r.className,r.author,...(r.assignees||[]).map(a=>a.name),r.lessonDetail?.subject].join(' ').toLocaleLowerCase().includes(q))&&(!from||day(r.createdAt)>=from)&&(!until||day(r.createdAt)&&day(r.createdAt)<=until)&&(status==='all'||status==='done'&&r.done||status==='open'&&!r.done||status==='unread'&&r.unread)).sort((a,b)=>($('snOrder').value==='asc'?1:-1)*((a.createdAt||'').localeCompare(b.createdAt||'')||a.id.localeCompare(b.id)));
}
function lessonLink(r){
 if(!todo)return `<a class="ws-button" href="${esc(Workspace.classLink(r.className))}">この授業の予定</a>`;
 const link=r.lessonDetail;
 if(!link)return `<p class="shared-note-meta">対応する授業日程がありません。</p><a class="ws-button" href="${esc(Workspace.classLink(r.className))}">授業の予定を確認</a>`;
 return `<a class="ws-button primary sn-detail-link" href="${esc(link.url)}">授業詳細へ →<small>${link.relation==='upcoming'?'次回・実施中':'直近'} ${esc(link.date)} ${esc(link.slots)}${link.subject?' · '+esc(link.subject):''}</small></a>`;
}
function draw(){
 if(!data)return;const rows=selected();$('snCount').textContent='表示 '+rows.length+'件';
 $('snPending').textContent=todo?($('snAssignee').value==='all'?'全担当':'自分の担当')+' · 未完了 '+data.items.filter(r=>r.todo&&!r.done&&($('snAssignee').value==='all'||(r.recipientIds||[]).includes($('snAssignee').value))).length+'件':'';
 $('snCards').innerHTML=rows.map(r=>`<article class="shared-note ${r.todo?'is-todo':''} ${r.done?'is-done':''}" data-sn-id="${esc(r.id)}"><div class="sn-card-heading"><h2>${esc(r.className)}</h2><span class="sn-state">${r.done?'完了':r.todo?'TODO':'共有メモ'}</span>${r.unread?'<b class="sn-unread">未読</b>':''}</div><p class="shared-note-text">${SharedNoteView.linkedText(r.text)}</p><p class="shared-note-meta">担当：${esc((r.assignees||[]).map(a=>a.name).join('・')||'以前のメモ（担当指定なし）')}<br>${esc(r.author||'記録なし')} ／ ${esc(date(r.createdAt))}</p>${r.done?'<p class="shared-note-completed">'+(r.todo?'完了':'非表示')+'：'+esc(r.doneBy)+' ／ '+esc(date(r.doneAt))+'</p>':''}<div class="shared-note-actions sn-primary-actions">${lessonLink(r)}${r.todo?'<button type="button" class="ws-button" data-sn-action="done" '+(r.canComplete?'':'disabled data-sn-readonly')+'>'+(r.done?'未完了に戻す':'✓ 完了にする')+'</button>':''}</div><details class="sn-other-actions"><summary>確認・コピー・履歴</summary><div class="shared-note-actions">${r.unread?'<button type="button" class="ws-button" data-sn-action="read">確認しました</button>':''}<button type="button" class="ws-button shared-note-copy" data-sn-action="copy">本文をコピー</button></div>${(r.completionHistory||[]).length?'<div class="shared-note-history">'+r.completionHistory.map(h=>'<p>'+esc(h.by)+' ／ '+esc(date(h.at))+' ／ '+(h.done?'完了・非表示':'未完了・再表示')+'</p>').join('')+'</div>':''}</details></article>`).join('')||'<p class="sn-empty">'+(todo&&$('snState').value==='open'?'この条件の未完了TODOはありません。':'条件に合う'+(todo?'TODO':'共有メモ')+'はありません。')+'</p>';
}
async function load(){
 if(!started||busy)return false;const seq=++ticket;$('snMessage').textContent='読み込み中…';
 try{
  const scope=admin&&$('snAssignee').value!==StaffAuth.user.id?'all':'mine';
  const j=await Workspace.api(todo?'shared_notes_api.php?todos=1&scope='+scope:'shared_notes_api.php?inbox=1');if(seq!==ticket)return false;
  if(!Array.isArray(j.items))throw Error('一覧の応答を確認できませんでした。');
  data=j;$('snMessage').textContent='';draw();return true;
 }catch(e){if(seq===ticket)$('snMessage').textContent='読み込めませんでした。再読み込みしてください：'+e.message;return false;}
}
StaffAuth.ready.then(async({user})=>{
 if(!user)return;await Workspace.ready;root.hidden=false;started=true;admin=user.role==='admin';storageKey='shared-todos.filters.'+user.id+'.'+todo;
 root.innerHTML=`${todo?'<p id="snOwner" class="sn-owner">'+esc(user.name)+'さんのTODO · 科目・授業をまとめて確認</p>':'<h2>自分宛ての先生共有メモ</h2><p>新しい共有メモを確認できます。<a href="shared_todos.html">TODO一覧へ</a></p>'}<p id="snPending" class="sn-pending" aria-live="polite"></p><div class="ws-controls sn-main-controls"><label>検索<input id="snFind" type="search" placeholder="授業・科目・内容"></label><label>状態<select id="snState">${todo?'':'<option value="unread">未読</option>'}<option value="open">未完了</option><option value="done">完了済み</option><option value="all">すべて</option></select></label><button id="snReload" type="button" class="ws-button">再読み込み</button></div><details class="sn-filters"><summary>絞り込み・並び順</summary><div class="ws-controls"><label ${todo&&!admin?'hidden':''}>担当<select id="snAssignee"><option value="${esc(user.id)}">自分の担当</option>${!todo||admin?'<option value="all">全担当'+(admin?'（管理者）':'')+'</option>':''}</select></label><label>投稿日から<input id="snFrom" type="date"></label><label>投稿日まで<input id="snUntil" type="date"></label><label>並び順<select id="snOrder"><option value="asc">古い順</option><option value="desc" ${todo?'':'selected'}>新しい順</option></select></label></div><p id="snPeriodError" role="status"></p></details><p id="snMessage" class="ws-message" role="status"></p><p id="snCount" aria-live="polite"></p><div id="snCards" class="sn-cards"></div>`;
 restore();for(const id of filterIds)$(id).oninput=()=>{remember();if(id==='snAssignee'){data=null;$('snCards').innerHTML='';load();}else draw();};$('snReload').onclick=load;
 $('snCards').onclick=async e=>{
  const button=e.target.closest('[data-sn-action]');if(!button||busy)return;const item=data.items.find(r=>r.id===button.closest('[data-sn-id]').dataset.snId);if(!item)return;
  if(button.dataset.snAction==='copy'){try{await SharedNoteView.copy(item.text);$('snMessage').textContent='本文をコピーしました。';}catch(err){$('snMessage').textContent='コピーできませんでした。本文を選択してコピーしてください。';}return;}
  busy=true;++ticket;root.querySelectorAll('button,input,select').forEach(x=>x.disabled=true);$('snMessage').textContent='保存中…';
  try{await Workspace.api('shared_notes_api.php',{action:button.dataset.snAction,className:item.className,id:item.id,version:item.version,done:!item.done});busy=false;const refreshed=await load();if(refreshed)$('snMessage').textContent='保存しました。';document.dispatchEvent(new CustomEvent('shared-notes-changed',{detail:{source:'teacher-todos'}}));Workspace.refreshRequestNotices();}
  catch(err){$('snMessage').textContent='保存結果を確認してください：'+err.message;}
  finally{busy=false;root.querySelectorAll('button,input,select').forEach(x=>x.disabled=x.hasAttribute('data-sn-readonly'));}
 };load();
}).catch(e=>{root.hidden=false;root.textContent='TODOを読み込めませんでした。ページを再読み込みしてください：'+e.message;});
window.addEventListener('pageshow',load);window.addEventListener('focus',load);document.addEventListener('shared-notes-changed',e=>{if(!busy&&e.detail?.source!=='teacher-todos')load();});document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});setInterval(()=>{if(!document.hidden)load();},60000);
})();
