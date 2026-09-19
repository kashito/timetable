(()=>{
const esc=Workspace.esc,token=()=>crypto.randomUUID(),slots=[...'①②③④⑤⑥⑦⑧⑨⑩⑪'];let active=false;
function dialog(title){let d=document.getElementById('groupScheduleDialog');if(!d){d=document.createElement('dialog');d.id='groupScheduleDialog';d.className='ws-dialog';document.body.appendChild(d);}d.innerHTML=`<div class="ws-dialog-inner"><div class="ws-dialog-head"><h2>${esc(title)}</h2><button class="ws-button" data-cancel>キャンセル</button></div><div class="ws-dialog-body" data-body></div><div class="ws-dialog-foot"><span class="ws-message" role="status" data-message>読み込み中…</span><button class="ws-button primary" data-save disabled>保存</button></div></div>`;return d;}
function scheduleUrl(value){
 if(typeof value!=='string'||!/^(?:schedule_generator\.(?:html|php)|teacher2026summer(?:_vertical)?\.html)(?:\?[^#]*)?$/.test(value))return '';
 const u=new URL(value,location.href);u.pathname=u.pathname.replace(/schedule_generator\.php$/,'schedule_generator.html');
 for(const key of ['openSource','openKey','attendance','task','returnTo'])u.searchParams.delete(key);
 return u.pathname.split('/').pop()+u.search;
}
function origin(){
 const current=scheduleUrl(location.pathname.split('/').pop()+location.search);if(current)return current;
 const explicit=scheduleUrl(new URLSearchParams(location.search).get('returnTo'));if(explicit)return explicit;
 try{const ref=new URL(document.referrer);if(ref.origin===location.origin){const from=scheduleUrl(ref.pathname.split('/').pop()+ref.search);if(from)return from;}}catch(e){}
 try{return scheduleUrl(sessionStorage.getItem('workspace.return'))||'schedule_generator.html';}catch(e){return 'schedule_generator.html';}
}
function returnToSchedule(g,target=origin()){
 const u=new URL(scheduleUrl(target)||origin(),location.href);u.searchParams.set(u.pathname.endsWith('schedule_generator.html')?'linkedDate':'date',g.date);location.assign(u.pathname.split('/').pop()+u.search);
}
async function move(sourceKey,target){
 if(active||StaffAuth.user?.role!=='admin')return false;active=true;const d=dialog('連結した授業をまとめて移動'),body=d.querySelector('[data-body]'),msg=d.querySelector('[data-message]'),save=d.querySelector('[data-save]');let busy=false,resolve;const done=new Promise(r=>resolve=r);const close=v=>{if(busy)return;active=false;d.close();resolve(v);};d.querySelector('[data-cancel]').onclick=()=>close(false);d.oncancel=e=>{e.preventDefault();close(false);};d.showModal();
 try{const input={sourceKey,date:Workspace.iso(target.date),slot:target.slot,room:target.room};const plan=await Workspace.api('lesson_group_move_api.php?'+new URLSearchParams(input));
 body.innerHTML=`<p><b>${esc(plan.group.className)}</b> ／ ${esc(plan.group.sources.length)}コマを連結したまま移動します。</p><p>移動前：${esc(plan.group.date)} ${esc(plan.group.slots)} ／ ${esc(plan.group.room)}</p><p>移動先：<b>${esc(input.date)} ${esc(plan.rows.map(r=>r['時間番号']).join(''))}</b> ／ ${esc(plan.rows[0]['教室']||'未設定')}</p><p>${plan.rows.map(r=>`${esc(r['時間番号'])} ${esc(r['開始'])}–${esc(r['終了'])}`).join(' ／ ')}</p><p class="ws-muted">出欠・カルテ・資料・確定・準備状態を引き継ぎます。食事休憩の設定と給与のコマ数も維持します。</p>`;
 save.textContent='連結したまま移動';save.disabled=false;msg.textContent='';const requestId=token();
 save.onclick=async()=>{if(busy)return;busy=true;d.querySelectorAll('button').forEach(b=>b.disabled=true);msg.textContent='移動を保存中…';try{await Workspace.api('lesson_group_move_api.php',{...input,version:plan.version,requestId});busy=false;close(true);}catch(e){msg.textContent=e.message;msg.classList.add('error');busy=false;d.querySelectorAll('button').forEach(b=>b.disabled=false);}};
 }catch(e){msg.textContent=e.message;msg.classList.add('error');}
 return done;
}
async function extend(id){
 const returnTarget=origin();
 if(active||StaffAuth.user?.role!=='admin')return;active=true;const d=dialog('コマを追加して連結'),body=d.querySelector('[data-body]'),msg=d.querySelector('[data-message]'),save=d.querySelector('[data-save]');let busy=false;const close=()=>{if(!busy){active=false;d.close();}};d.querySelector('[data-cancel]').onclick=close;d.oncancel=e=>{e.preventDefault();close();};d.showModal();
 try{const plan=await Workspace.api('lesson_group_extend_api.php?id='+encodeURIComponent(id));const choices=[...plan.members.map(row=>({row,existing:true})),...plan.candidates].sort((a,b)=>slots.indexOf(a.row['時間番号'])-slots.indexOf(b.row['時間番号']));
 body.innerHTML=`<p><b>${esc(plan.group.className)}</b> ／ ${esc(plan.group.date)}</p><p>現在の連結の前後に、間が空かないようコマを追加してください。</p><p class="ws-muted">共通カルテは残し、追加コマの本文・宿題を追記します。出欠はコマごとの状態を維持し、元の返信・資料も確認できます。</p>`+choices.map(c=>`<article class="ws-card link-lesson-option"><label class="link-lesson-select"><span class="ws-check"><input type="checkbox" data-extend-source="${esc(c.row._sourceKey)}" ${c.existing?'checked disabled':''}><b>${esc(c.row['時間番号'])} ${esc(c.row['開始'])}–${esc(c.row['終了'])}${c.existing?'（連結済み）':''}</b></span></label></article>`).join('');
 save.textContent='選んだコマを追加して連結';let requestId=token();body.onchange=()=>{requestId=token();save.disabled=!body.querySelector('[data-extend-source]:checked:not(:disabled)');};msg.textContent=plan.candidates.length?'':'追加できる同じ授業がありません。先に前後のコマを配置してください。';
 save.onclick=async()=>{if(busy)return;const sources=[...body.querySelectorAll('[data-extend-source]:checked:not(:disabled)')].map(e=>e.dataset.extendSource);if(!sources.length)return;busy=true;save.disabled=true;msg.textContent='連結を保存中…';try{const j=await Workspace.api('lesson_group_extend_api.php',{id,version:plan.version,sources,requestId});returnToSchedule(j.group,returnTarget);}catch(e){msg.textContent=e.message;msg.classList.add('error');busy=false;save.disabled=false;}};
 }catch(e){msg.textContent=e.message;msg.classList.add('error');}
}
async function lengthen(id){
 const returnTarget=origin();
 if(active||StaffAuth.user?.role!=='admin')return;
 active=true;const d=dialog('後ろへ1コマ延長'),body=d.querySelector('[data-body]'),msg=d.querySelector('[data-message]'),save=d.querySelector('[data-save]');let busy=false;
 const close=()=>{if(!busy){active=false;d.close();}};
 d.querySelector('[data-cancel]').onclick=close;d.oncancel=e=>{e.preventDefault();close();};d.showModal();
 try{
  const plan=await Workspace.api('lesson_group_lengthen_api.php?id='+encodeURIComponent(id)),g=plan.group,r=plan.row,existing=plan.mode==='join';
  body.innerHTML=`<p><b>${esc(g.className)}</b> ／ ${esc(g.date)}</p><p><b>${esc(g.slots)} → ${esc(plan.slots)}</b></p><p>${existing?'配置済みの':'次の'} <b>${esc(r['時間番号'])} ${esc(r['開始'])}–${esc(r['終了'])}</b> ${existing?'を連結に取り込み、授業を延長します。':'を新しく作り、連結した授業を延長します。'}</p><p>担当：${esc(g.teacher)} ／ 教室：${esc(g.room||'未設定')}</p><p>終了：${esc(g.end)} → <b>${esc(r['終了'])}</b><br>この連結授業の給与：${esc(g.sources.length)}コマ分 → <b>${esc(g.sources.length+1)}コマ分</b></p><p class="ws-muted">${existing?'配置済みのコマの出欠・確定・準備状態を引き継ぎます。カルテ・宿題は共通記録へ追記し、元の返信・資料も残します。授業を二重には作成しません。':'カルテ・宿題は引き続き共通です。追加するコマは未確定・未準備・出欠未記録になります。'}</p>`;
  body.insertAdjacentHTML('beforeend',`<label class="ws-form">延長後の食事休憩<select id="lengthenMealBreak"><option value="0" ${g.mealBreak?'':'selected'}>なし</option><option value="1" ${g.mealBreak?'selected':''}>あり（途中で食事休憩が入ります）</option></select><small>「あり」にすると、生徒・講師の予定表に食事休憩の案内を表示します。</small></label>`);
  save.textContent='1コマ延長する';save.disabled=false;msg.textContent='';let requestId=token();const meal=body.querySelector('#lengthenMealBreak');meal.onchange=()=>{requestId=token();};
  save.onclick=async()=>{
   if(busy)return;busy=true;d.querySelectorAll('button,input,select').forEach(b=>b.disabled=true);msg.textContent='延長を保存中…';
   try{const result=await Workspace.api('lesson_group_lengthen_api.php',{id,version:plan.version,requestId,mealBreak:meal.value==='1'});returnToSchedule(result.group,returnTarget);}
   catch(e){busy=false;msg.textContent=e.message;msg.classList.add('error');d.querySelectorAll('button,input,select').forEach(b=>b.disabled=false);}
  };
 }catch(e){msg.textContent=e.message;msg.classList.add('error');}
}
window.GroupScheduleActions={move,extend,lengthen,origin,returnToSchedule};
})();
