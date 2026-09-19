(()=>{'use strict';
const esc=Workspace.esc,labels={IN:'🟢 入室中',TEMP_OUT:'🟠 一時退室中',OUT:'⚪ 退室済み',UNKNOWN:'❔ 要確認'},views=new Set();
const stamp=s=>s?new Date(s.includes('T')?s:s.replace(' ','T')+'+09:00').toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'';
async function api(query='',payload){await StaffAuth.ready;const c=new AbortController(),timer=setTimeout(()=>c.abort(),15000);try{const r=await fetch('presence_api.php'+query,{cache:'no-store',signal:c.signal,...(payload?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}:{})});const j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||'入退室を読み込めませんでした。');return j;}catch(e){if(e.name==='AbortError')throw Error('入退室の確認に時間がかかっています。再読み込みしてください。');throw e;}finally{clearTimeout(timer);}}
function summary(p){if(p.status==='UNKNOWN'&&['未連携','連携しない設定','入退室の記録がありません'].includes(p.reason))return `<span class="pr-status pr-neutral">${esc(p.reason==='入退室の記録がありません'?'記録なし':p.reason)}</span><small>入退室から現在の居場所を判定できません。</small>`;return `<span class="pr-status pr-${p.status}${p.stale?' pr-stale':''}">${esc(p.stale?'⚠ 前日以前：'+({IN:'入室',TEMP_OUT:'一時退室',OUT:'退室'}[p.status]||'不明')+'の記録':labels[p.status]||labels.UNKNOWN)}</span>${p.at?` <small>${esc(stamp(p.at))}の記録</small>`:''}${p.reason?`<small class="pr-reason">${esc(p.reason)}</small>`:''}`;}
function mount(root,keys){
 if(root._presence)return;let data=null,busy=false,lastOk=0;const compact=!!keys;
 root.classList.add('presence-panel');
 const admin=StaffAuth.user?.role==='admin';
 const body=`<div class="pr-heading">${compact?'':'<h3>入退室・出欠確認</h3>'}<button type="button" class="ws-button pr-reload">再読み込み</button>${admin?'<button class="ws-button pr-mapping" type="button">生徒の対応を設定</button>':''}</div><p class="ws-muted">入退室は教室全体の記録です。実際の出欠は講師が確認し、出欠欄で保存してください。30秒ごとに自動確認します。</p>${compact?'':'<div class="ws-controls"><input class="pr-search" type="search" placeholder="生徒名で検索" aria-label="生徒名で検索"><select class="pr-filter" aria-label="入退室で絞り込み"><option value="">すべて</option>'+Object.entries(labels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')+'</select></div>'}<p class="pr-health" role="status">読み込み中…</p>${admin?'<p class="pr-link-help ws-muted">「未連携」は入退室アプリの生徒とまだ対応づけていない状態です。「生徒の対応を設定」で同名の候補を選び、氏名・塾籍番号を確認して「対応を保存」してください。</p>':''}<div class="pr-list"></div>${compact?'<a class="ws-button" href="presence.html">入退室の一覧を開く</a>':''}`;
 root.innerHTML=compact?`<details class="pr-fold"><summary><strong>玄関の入退室記録</strong><span class="pr-fold-count"></span><span class="pr-fold-action">開く</span></summary><div class="pr-fold-body">${body}</div></details>`:body;
 // Opening, filtering, or reloading this reference panel does not edit attendance.
 for(const name of ['input','change'])root.addEventListener(name,e=>e.stopPropagation());
 const fold=root.querySelector('.pr-fold');
 if(fold)fold.addEventListener('toggle',()=>root.querySelector('.pr-fold-action').textContent=fold.open?'閉じる':'開く');
 const $=q=>root.querySelector(q);
 function render(){if(!data)return;const count=$('.pr-fold-count');if(count)count.textContent='（'+data.items.length+'名）';const query=$('.pr-search')?.value||'',status=$('.pr-filter')?.value||'',historical=data.date!==data.today;
  $('.pr-list').innerHTML=data.items.filter(r=>r.name.includes(query)&&(!status||(status==='UNKNOWN'?(r.presence.status==='UNKNOWN'||r.presence.stale):r.presence.status===status&&!r.presence.stale))).map(r=>`<article class="pr-person"><div><a href="student.html?name=${encodeURIComponent(r.name)}"><strong>${esc(r.name)}</strong></a><div>${historical?`<strong>${esc(data.date)} の入退室履歴</strong>${r.presence.status==='UNKNOWN'?`<small class="pr-reason">${esc(r.presence.reason)}</small>`:''}<p>${r.presence.events.map(e=>esc(stamp(e.at))+' '+esc(labels[e.status]||'不明な記録')).join(' ／ ')||'この日の入退室記録はありません'}</p><details><summary>現在の状態を見る</summary>${summary(r.presence)}</details>`:summary(r.presence)}</div></div>${!compact?`<div class="pr-lessons">${r.lessons.map(l=>`<a href="${esc(l.url)}">${esc(l.slots+' '+l.className)}<small>予定の教室：${esc(l.room||'未設定')} ／ ${esc(l.attendance.join('、'))}</small></a>`).join('')||'<small>今日の参加予定なし</small>'}</div>`:''}</article>`).join('')||'<p class="ws-muted">該当する生徒はいません。</p>';
 }
 async function load(){if(busy||!root.isConnected)return;busy=true;$('.pr-reload').disabled=true;
  try{const j=await api(keys?'?action=lesson&keys='+encodeURIComponent(JSON.stringify([...new Set(keys)])):'');if(!root.isConnected)return;data=j;lastOk=Date.now();render();$('.pr-health').textContent='最終確認 '+stamp(j.checkedAt);$('.pr-health').classList.remove('pr-error');root.classList.remove('pr-load-error');}
  catch(e){if(root.isConnected){$('.pr-health').textContent=e.message+(data?' 表示中の内容は最後に取得した記録です。':'');$('.pr-health').classList.add('pr-error');root.classList.add('pr-load-error');const count=$('.pr-fold-count');if(count)count.textContent='（読み込みを確認）';}}
  finally{busy=false;if(root.isConnected)$('.pr-reload').disabled=false;}
 }
 $('.pr-reload').onclick=load;$('.pr-search')?.addEventListener('input',render);$('.pr-filter')?.addEventListener('change',render);$('.pr-mapping')?.addEventListener('click',()=>mapping(load));root._presence={load};views.add(root);load();
 root._presence.check=()=>{if(lastOk&&Date.now()-lastOk>90000){$('.pr-health').textContent='最新情報を確認できていません。表示中の内容は最後に取得した記録です。';$('.pr-health').classList.add('pr-error');root.classList.add('pr-load-error');const count=$('.pr-fold-count');if(count)count.textContent='（読み込みを確認）';}};
}
async function mapping(onSaved){
 if(document.querySelector('.pr-map-dialog'))return;const d=document.createElement('dialog');d.className='pr-map-dialog';let data,dirty=false,busy=false;
 d.innerHTML='<form><header><h2>入退室の生徒と対応づけ</h2><button type="button" class="ws-button pr-close">閉じる</button></header><div class="pr-map-body"><p>塾籍番号と氏名がともに一致する場合は自動で対応します。同名の候補も、内容を確認してから保存してください。</p><div class="pr-map-tools"><button class="ws-button pr-map-reload" type="button">生徒一覧を再読み込み</button><label class="ws-check"><input class="pr-show-hidden" type="checkbox" disabled>非表示の生徒も表示</label><button class="ws-button pr-suggest" type="button" disabled>同名の候補を選択</button></div><div class="pr-map-rows"></div></div><footer><span role="status">読み込み中…</span><button class="ws-button primary pr-save" disabled>対応を保存</button></footer></form>';
 const $=q=>d.querySelector(q),notice=(s,error=false)=>{const el=$('[role=status]');el.textContent=s;el.classList.toggle('pr-error',error);};document.body.appendChild(d);d.showModal();
 function close(){if(!busy&&(!dirty||confirm('対応の変更を保存せずに閉じますか？')))d.close();}$('.pr-close').onclick=close;d.addEventListener('cancel',e=>{e.preventDefault();close();});d.addEventListener('close',()=>d.remove());
 function filter(){d.querySelectorAll('[data-pr-hidden]').forEach(r=>r.hidden=r.dataset.prHidden==='true'&&!$('.pr-show-hidden').checked);}$('.pr-show-hidden').onchange=filter;
 function controls(){d.querySelectorAll('button,select,input').forEach(x=>x.disabled=busy||(!data&&!x.matches('.pr-close,.pr-map-reload')));}
 async function load(){
  if(busy||!d.isConnected)return;if(dirty&&!confirm('入力中の対応を破棄して、生徒一覧を読み込み直しますか？'))return;
  busy=true;controls();notice('生徒一覧を読み込み中…');
  try{const next=await api('?action=links');if(!d.isConnected)return;data=next;dirty=false;$('.pr-map-rows').innerHTML=data.students.map(r=>`<label data-pr-hidden="${r.hidden}"><span><b>${esc(r.name)}</b> ${esc(r.number)}${r.hidden?'（非表示）':''}<small>${esc(r.reason)}</small></span><select data-pr-name="${esc(r.name)}" aria-label="${esc(r.name)}の入退室対応"><option value="auto" ${r.selected==='auto'?'selected':''}>塾籍番号と氏名で自動対応</option><option value="none" ${r.selected==='none'?'selected':''}>連携しない</option>${data.catalog.map(c=>`<option value="${c.id}" ${String(c.id)===r.selected?'selected':''}>${esc(c.number+' '+c.name)}</option>`).join('')}${r.mode==='manual'&&!data.catalog.some(c=>String(c.id)===r.selected)?`<option value="${esc(r.selected)}" selected>削除された生徒・選び直してください</option>`:''}</select></label>`).join('');filter();notice('生徒一覧を読み込みました。氏名・番号を確認してください。');}
  catch(e){notice(e.message+(data?' 入力中の対応は残しています。':''),true);}
  finally{busy=false;if(d.isConnected)controls();}
 }
 $('.pr-map-reload').onclick=load;
 $('.pr-map-rows').onchange=()=>dirty=true;
 $('.pr-suggest').onclick=()=>{if(!data||busy)return;for(const r of data.students)if(!r.hidden&&r.externalId===null&&r.mode==='auto'&&r.suggestion){const s=[...d.querySelectorAll('[data-pr-name]')].find(s=>s.dataset.prName===r.name);s.value=String(r.suggestion);dirty=true;}notice('候補を選択しました。氏名・番号を確認して保存してください。');};
 $('form').onsubmit=async e=>{e.preventDefault();if(!data||busy)return;const links={};for(const s of d.querySelectorAll('[data-pr-name]')){const before=data.students.find(r=>r.name===s.dataset.prName);if(s.value!==before.selected||before.reason.includes('再確認'))links[s.dataset.prName]=['auto','none'].includes(s.value)?s.value:Number(s.value);}
  busy=true;controls();notice('保存中…');try{await api('',{action:'links',links,version:data.version});dirty=false;d.close();onSaved();}catch(e){notice(e.message,true);}finally{busy=false;if(d.isConnected)controls();}
 };
 load();
}
function refresh(){for(const root of views){if(!root.isConnected){views.delete(root);continue;}root._presence.check();if(!document.hidden)root._presence.load();}}
window.CampusPresence={mountLesson(root,keys){const el=document.createElement('section');root.prepend(el);mount(el,keys);}};
setInterval(refresh,30000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
StaffAuth.ready.then(()=>{if(!StaffAuth.user)return;const run=()=>document.querySelectorAll('[data-presence]').forEach(r=>mount(r));if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();});
})();
