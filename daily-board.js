(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const preview=new URL(location.href).searchParams.get('preview')==='student';
if(preview)document.body.classList.add('board-student-preview');
const day=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'});
const uid=()=>crypto.randomUUID().replaceAll('-','');
const dateLabel=d=>new Date(d+'T12:00:00+09:00').toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo',month:'long',day:'numeric',weekday:'short'});
const stamp=v=>new Date(v).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
const rooms=[['青','🟦','blue'],['黄','🟨','yellow'],['白','⬜','white'],['PC','💻','pc'],['ガラス','🪟','glass'],['緑','🟩','green'],['自宅可','🏠','home'],['自由','🧭','free'],['その他','📍','other']];
const colors={gray:['グレー','#656b73','#fff'],blue:['青','#6194d9','#fff'],green:['緑','#326653','#fff'],cream:['クリーム','#fff3d6','#25344a'],white:['白','#fff','#25344a'],dark:['濃いグレー','#252b35','#fff']};
const roomHtml=place=>{const r=rooms.find(r=>r[0]===place||r[0]+'教室'===place)||rooms.at(-1);return `<span class="db-room db-room-${r[2]}"><span class="db-room-mark" aria-hidden="true"></span><span>${esc(place)}</span></span>`;};
async function request(date,payload,boardId='all'){
 await StaffAuth.ready;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const r=await fetch('daily_board_api.php'+(payload?'':'?date='+encodeURIComponent(date)+'&board='+encodeURIComponent(boardId)+(preview?'&preview=student':'')),{cache:'no-store',signal:controller.signal,...(payload?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,board:boardId})}:{})});
 const j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||'今日の動きを読み込めませんでした。');return j.board;
 }catch(e){if(e.name==='AbortError')throw Error('通信に時間がかかっています。再読み込みしてください。');throw e;}finally{clearTimeout(timer);}
}
function rowOptions(r,editor=false){const prefix=editor?'data-option':'data-row-option';return `<label class="db-option"><input type="checkbox" ${prefix}="highlight" ${r.highlight?'checked':''}> ハイライト</label><label class="db-option"><input type="checkbox" ${prefix}="animate" ${r.animation&&r.animation!=='none'?'checked':''}> アニメーション</label><select ${prefix}="animation" aria-label="アニメーションの種類" ${!r.animation||r.animation==='none'?'hidden':''}><option value="pulse" ${r.animation==='pulse'?'selected':''}>点滅（はっきり）</option><option value="scroll" ${r.animation==='scroll'?'selected':''}>右から左へスクロール</option></select>`;}
function rowsHtml(rows,admin){return rows.length?'<div class="db-columns" aria-hidden="true"><span>開始</span><span>対象</span><span>場所</span><span>指示</span></div>'+rows.map(r=>`<article data-board-row="${esc(r.id)}" class="db-row ${r.kind==='note'?'db-note-row':''} ${r.visible===false?'db-hidden-row':''} ${r.highlight?'db-highlight':''} ${['pulse','scroll'].includes(r.animation)?'db-animate-'+r.animation:''}">${admin?`<div class="db-row-controls"><button type="button" class="db-drag-handle" aria-label="この指示をドラッグして並べ替え" title="ドラッグして並べ替え">⠿ 並べ替え</button><label class="db-visibility"><input type="checkbox" data-row-visible="${esc(r.id)}" ${r.visible!==false?'checked':''}> 表示</label>${rowOptions(r)}<button type="button" class="ws-button" data-row-edit="${esc(r.id)}">編集</button><button type="button" class="ws-button db-row-delete" data-row-delete="${esc(r.id)}">削除</button></div>`:''}${r.kind==='note'?`<div class="db-free-message db-message-window"><div class="db-instruction-body">${esc(r.instruction)}</div></div>`:`<time>${esc(r.time)}</time><div class="db-target">${esc(r.target)}</div><div class="db-place">${roomHtml(r.place)}</div><div class="db-instruction db-message-window"><span class="db-label">指示</span><div class="db-instruction-body">${esc(r.instruction)}</div></div>`}</article>`).join(''):'<p class="db-empty">この日の指示はまだ登録されていません。</p>';}
function mount(root){
 const boardId=root.dataset.boardId||'all',page=root.dataset.dailyBoard==='page',url=new URL(location.href),monitor=page&&url.searchParams.get('mode')==='monitor';
 let chosen=page?url.searchParams.get('date')||'':'',board=null,loading=false,generation=0,lastOk=0,clockOffset=0,problem='',renderKey='',saving=false,lastDeleted=null;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(chosen))chosen='';
 if(monitor)document.body.classList.add('daily-monitor');
 root.classList.add('daily-board');
 root.innerHTML=`<header class="db-head"><div class="db-heading"><${page?'h1':'h2'}>今日の動き</${page?'h1':'h2'}><p class="db-updated">読み込み中…</p></div><div class="db-tools">${page?'<label class="db-date-control">日付 <input type="date" class="db-date" aria-label="今日の動きの日付"></label><button type="button" class="ws-button db-today">今日</button>':'<a class="ws-button" href="daily_board.html">大きく見る</a>'}<button type="button" class="ws-button db-reload">再読み込み</button><button type="button" class="ws-button primary db-edit" hidden>編集</button><a class="ws-button db-student-preview" hidden>生徒表示を確認</a>${page?`<a class="ws-button db-monitor-link" href="daily_board.html${monitor?'':'?mode=monitor'}">${monitor?'通常表示':'モニター表示'}</a>${monitor?'<button type="button" class="ws-button db-fullscreen">全画面</button>':''}`:''}</div></header><div class="db-health" role="status"><span class="db-connection">読み込み中…</span><span>30秒ごとに自動確認</span></div><button type="button" class="ws-button db-undo" hidden>直前の削除を取り消す</button><div class="db-rows"></div><details class="db-quick" hidden><summary>＋ この画面で指示・連絡を追加</summary><form><label>種類<select name="kind"><option value="instruction">指示（時刻・対象・場所）</option><option value="note">自由文の連絡</option></select></label><label data-structured>開始時刻<input type="time" name="time" required></label><label data-structured>対象<input name="target" maxlength="200" required></label><label data-structured>場所<select name="place">${rooms.map(r=>`<option value="${r[0]}" ${r[0]===(boardId==='blue'?'青':'自由')?'selected':''}>${r[1]} ${r[0]}</option>`).join('')}</select><input name="other" aria-label="その他の場所" placeholder="その他の場所" maxlength="100" hidden></label><label class="db-quick-text">指示・連絡<textarea name="instruction" required maxlength="4000" rows="3"></textarea></label><button type="submit" class="ws-button primary">追加して公開</button><span role="status"></span></form></details>${page?'<footer class="db-foot"><a class="ws-button" href="student.html">自分の時間割を見る</a></footer>':''}`;
 const $=s=>root.querySelector(s),current=()=>chosen||day();
 if(page)$('.db-heading').insertAdjacentHTML('beforeend','<time class="db-clock" aria-label="現在日時"></time>');
 StaffAuth.ready.then(()=>{if(page&&preview&&StaffAuth.user?.role==='admin'){const bar=document.createElement('div');bar.className='db-preview-status';const u=new URL(location.href);u.searchParams.delete('preview');bar.innerHTML='<span>生徒表示を確認中（管理者ログインは維持）</span> <a class="ws-button" href="'+esc(u.pathname+u.search)+'">管理者表示に戻る</a>';root.before(bar);}});
 const scrollSize=()=>root.querySelectorAll('.db-animate-scroll .db-message-window').forEach(el=>{
  const inner=el.querySelector('.db-instruction-body'),width=el.clientWidth;if(!inner||!width)return;
  // Travel fully across the visible instruction area at a readable, consistent speed.
  const speed=Math.max(60,Math.min(120,parseFloat(getComputedStyle(inner).fontSize)*3));
  el.style.setProperty('--db-scroll-start',width+'px');
  el.style.setProperty('--db-scroll-duration',Math.max(8,(width+inner.scrollWidth)/speed).toFixed(2)+'s');
 });
 const scrollObserver=new ResizeObserver(scrollSize);scrollObserver.observe(root);document.fonts?.ready.then(scrollSize);
 function relative(){
  if(board){const sec=Math.max(0,Math.floor((Date.now()+clockOffset-new Date(board.updatedAt).getTime())/1000)),label=sec<60?'たった今 更新':sec<3600?Math.floor(sec/60)+'分前に更新':sec<86400?Math.floor(sec/3600)+'時間前に更新':Math.floor(sec/86400)+'日前に更新';$('.db-updated').textContent=board.updatedAt?`${label}（${stamp(board.updatedAt)}）`:'まだ更新されていません';}
  const stale=lastOk&&Date.now()-lastOk>90000;
  $('.db-health').classList.toggle('db-error',!!problem||!!stale);
  $('.db-connection').textContent=problem||(stale?'最新情報を確認できていません。再読み込みしてください。':lastOk?'確認 '+stamp(lastOk):'読み込み中…');
 }
 function updateClock(){
  const el=$('.db-clock');if(!el)return;const parts=Object.fromEntries(new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(new Date(Date.now()+clockOffset)).map(p=>[p.type,p.value]));
  el.textContent=`${parts.month}月${parts.day}日(${parts.weekday})　${parts.hour}：${parts.minute}：${parts.second}`;
 }
 function render(b){board=b;const color=colors[b.settings.background]||colors.gray;root.style.setProperty('--db-background',color[1]);root.style.setProperty('--db-foreground',color[2]);if(monitor)document.body.style.setProperty('--db-page-background',color[1]);clockOffset=new Date(b.serverTime).getTime()-Date.now();lastOk=Date.now();problem='';
  $('.db-heading').querySelector('h1,h2').textContent=b.settings.title+'　'+dateLabel(b.date);
  if(page){$('.db-date').value=b.date;const link=new URL(boardId==='blue'?'room_board.html':'daily_board.html',location.href);if(!monitor)link.searchParams.set('mode','monitor');if(chosen)link.searchParams.set('date',chosen);if(preview)link.searchParams.set('preview','student');const p=new URL(link,location.href);if(monitor)p.searchParams.set('mode','monitor');else p.searchParams.delete('mode');p.searchParams.set('preview','student');$('.db-student-preview').href=p.pathname+p.search;$('.db-student-preview').hidden=!b.canEdit;$('.db-monitor-link').href=link.pathname+link.search;}
  const rows=monitor?b.rows.filter(r=>r.visible!==false):b.rows;
  const key=JSON.stringify([b.date,b.rows,b.canEdit]);if(key!==renderKey){$('.db-rows').innerHTML=rows.length?rowsHtml(rows,b.canEdit):'<p class="db-empty">現在表示する指示はありません。</p>';renderKey=key;requestAnimationFrame(scrollSize);}
  $('.db-edit').hidden=$('.db-quick').hidden=!b.canEdit;relative();if(window.BoardGuides){BoardGuides.mount(root,boardId);root._boardGuides.date(b.date);}
 }
 async function load(){if(loading||saving)return;loading=true;const ticket=++generation,date=current();$('.db-reload').disabled=true;
  try{const b=await request(date,null,boardId);if(ticket===generation&&date===current())render(b);}
  catch(e){problem=board?'更新を確認できません。表示中の内容は最後に取得した情報です。再読み込みしてください。':'今日の動きを読み込めませんでした。時間をおいて再読み込みしてください。';relative();}
  finally{loading=false;$('.db-reload').disabled=false;if(date!==current())load();}
 }
 function select(date){lastDeleted=null;$('.db-undo').hidden=true;chosen=date;const u=new URL(location.href);chosen?u.searchParams.set('date',chosen):u.searchParams.delete('date');history.replaceState(null,'',u);board=null;lastOk=0;problem='';renderKey='';$('.db-rows').replaceChildren();$('.db-updated').textContent='読み込み中…';load();}
 $('.db-reload').onclick=load;$('.db-date')?.addEventListener('change',e=>{if(e.target.value)select(e.target.value);});$('.db-today')?.addEventListener('click',()=>select(''));
 $('.db-fullscreen')?.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){problem='ブラウザの全画面機能を使用してください。';relative();}});
 const quick=$('.db-quick form');quick.onchange=()=>{const structured=quick.elements.kind.value==='instruction';quick.querySelectorAll('[data-structured]').forEach(x=>x.hidden=!structured);quick.elements.time.required=quick.elements.target.required=structured;quick.elements.other.hidden=quick.elements.place.value!=='その他';};quick.onsubmit=async e=>{e.preventDefault();if(!board?.canEdit||saving)return;const initial=board,date=initial.date,form=quick.elements,note=form.kind.value==='note',row={id:uid(),kind:form.kind.value,visible:true,time:note?'':form.time.value,target:note?'':form.target.value.trim(),place:note?'':form.place.value==='その他'?(form.other.value.trim()||'その他'):form.place.value,instruction:form.instruction.value.trim()};saving=true;++generation;quick.querySelectorAll('input,select,textarea,button').forEach(x=>x.disabled=true);try{const b=await request(date,{date,rows:[...initial.rows,row],version:initial.version,requestId:row.id},boardId);quick.reset();quick.onchange();quick.querySelector('[role=status]').textContent='追加しました。';if(date===current())render(b);}catch(err){quick.querySelector('[role=status]').textContent=err.message;}finally{saving=false;quick.querySelectorAll('input,select,textarea,button').forEach(x=>x.disabled=false);}};

 let drag=null;
 const cancelDrag=()=>{if(!drag)return;const old=drag.initial;drag.row.classList.remove('db-dragging');drag=null;saving=false;renderKey='';if(old.date===current())render(old);};
 $('.db-rows').addEventListener('pointerdown',e=>{
  const handle=e.target.closest('.db-drag-handle');if(!handle||!board?.canEdit||saving||e.button!==0)return;
  e.preventDefault();const row=handle.closest('[data-board-row]');saving=true;++generation;drag={initial:board,row,startY:e.clientY,moved:false,pointerId:e.pointerId};handle.setPointerCapture(e.pointerId);row.classList.add('db-dragging');
 });
 $('.db-rows').addEventListener('pointermove',e=>{
  if(!drag||drag.pointerId!==e.pointerId)return;e.preventDefault();if(Math.abs(e.clientY-drag.startY)>5)drag.moved=true;
  const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-board-row]');if(target&&target!==drag.row&&target.parentElement===drag.row.parentElement){const below=e.clientY>target.getBoundingClientRect().top+target.getBoundingClientRect().height/2;target.parentElement.insertBefore(drag.row,below?target.nextSibling:target);}
  if(e.clientY<80)window.scrollBy(0,-18);else if(e.clientY>window.innerHeight-80)window.scrollBy(0,18);
 });
 $('.db-rows').addEventListener('pointercancel',cancelDrag);
 $('.db-rows').addEventListener('pointerup',async e=>{
  if(!drag||drag.pointerId!==e.pointerId)return;const currentDrag=drag;drag=null;currentDrag.row.classList.remove('db-dragging');const initial=currentDrag.initial;
  const ids=[...$('.db-rows').querySelectorAll('[data-board-row]')].map(r=>r.dataset.boardRow),lookup=new Map(initial.rows.map(r=>[r.id,r]));let i=0;
  // Invisible monitor rows keep their original positions and content.
  const rows=initial.rows.map(r=>ids.includes(r.id)?lookup.get(ids[i++]):r);
  if(!currentDrag.moved||rows.every((r,i)=>r.id===initial.rows[i].id)){saving=false;renderKey='';render(initial);return;}
  try{const b=await request(initial.date,{date:initial.date,rows,version:initial.version,requestId:uid()},boardId);if(initial.date===current()){renderKey='';render(b);$('.db-connection').textContent='並び順を保存しました。';}}
  catch(err){renderKey='';if(initial.date===current())render(initial);problem=err.message+' 並び順を再読み込みして確認してください。';relative();}
  finally{saving=false;if(initial.date!==current())load();}
 });
 $('.db-rows').addEventListener('keydown',async e=>{
  const handle=e.target.closest('.db-drag-handle');if(!handle||!['ArrowUp','ArrowDown'].includes(e.key)||saving||!board?.canEdit)return;e.preventDefault();const row=handle.closest('[data-board-row]'),other=e.key==='ArrowUp'?row.previousElementSibling:row.nextElementSibling;if(!other?.dataset.boardRow)return;
  const initial=board,a=initial.rows.findIndex(r=>r.id===row.dataset.boardRow),b=initial.rows.findIndex(r=>r.id===other.dataset.boardRow),rows=[...initial.rows];[rows[a],rows[b]]=[rows[b],rows[a]];saving=true;++generation;try{const updated=await request(initial.date,{date:initial.date,rows,version:initial.version,requestId:uid()},boardId);render(updated);$('.db-rows').querySelector('[data-board-row="'+row.dataset.boardRow+'"] .db-drag-handle')?.focus();}catch(err){problem=err.message;relative();}finally{saving=false;}
 });
 $('.db-edit').onclick=()=>{if(board?.canEdit&&!saving)edit(board,b=>{if(b.date===current())render(b);});};
 async function updateRows(rows,message){if(!board?.canEdit||saving)return false;const initial=board;saving=true;++generation;$('.db-rows').querySelectorAll('input,select,button').forEach(x=>x.disabled=true);try{const b=await request(initial.date,{date:initial.date,rows,version:initial.version,requestId:uid()},boardId);if(initial.date===current()){renderKey='';render(b);$('.db-connection').textContent=message;}return true;}catch(err){if(initial.date===current()){renderKey='';render(initial);problem=err.message;relative();}return false;}finally{saving=false;$('.db-rows').querySelectorAll('input,select,button').forEach(x=>x.disabled=false);if(initial.date!==current())load();}}
 $('.db-rows').addEventListener('change',async e=>{const input=e.target.closest('[data-row-visible],[data-row-option]');if(!input||!board?.canEdit||saving)return;const id=input.closest('[data-board-row]').dataset.boardRow,field=input.dataset.rowOption;const rows=board.rows.map(r=>r.id!==id?r:{...r,...(!field?{visible:input.checked}:field==='highlight'?{highlight:input.checked}:field==='animate'?{animation:input.checked?'pulse':'none'}:{animation:input.value})});await updateRows(rows,'表示設定を保存しました。');});
 $('.db-rows').addEventListener('click',async e=>{const editButton=e.target.closest('[data-row-edit]'),remove=e.target.closest('[data-row-delete]');if(!board?.canEdit||saving)return;if(editButton){edit(board,b=>{if(b.date===current())render(b);},editButton.dataset.rowEdit);return;}if(!remove)return;const id=remove.dataset.rowDelete,index=board.rows.findIndex(r=>r.id===id),row=board.rows[index];if(!row||!confirm('この指示・連絡を削除しますか？\n'+row.instruction.slice(0,120)))return;const deleted={row,index,date:board.date};if(await updateRows(board.rows.filter(r=>r.id!==id),'削除しました。')){lastDeleted=deleted;$('.db-undo').hidden=false;}});
 $('.db-undo').onclick=async()=>{if(!lastDeleted||saving||lastDeleted.date!==current())return;const rows=[...board.rows];if(rows.some(r=>r.id===lastDeleted.row.id))return;rows.splice(Math.min(lastDeleted.index,rows.length),0,lastDeleted.row);if(await updateRows(rows,'削除を取り消しました。')){lastDeleted=null;$('.db-undo').hidden=true;}};
 setInterval(()=>{relative();if(!document.hidden)load();},30000);setInterval(updateClock,1000);updateClock();document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});window.addEventListener('focus',load);load();
}
function edit(initial,onSaved,focusId){
 if(document.querySelector('.db-edit-dialog[open]'))return;
 const d=document.createElement('dialog');d.className='db-edit-dialog';d.setAttribute('aria-label',initial.settings.title+'を編集');
 let dirty=false,busy=false,requestId=uid(),draft=initial.rows.map(r=>({...r}));
 d.innerHTML=`<form><header class="db-edit-head"><h2>${esc(initial.settings.title)}（${esc(dateLabel(initial.date))}）を編集</h2><button type="button" class="ws-button db-close">閉じる</button></header><div class="db-edit-body"><p class="db-edit-help">表示にチェックした内容を、この掲示のスマホ画面とモニターに公開します。時刻などが不要な連絡は「自由文の連絡を追加」を使ってください。</p><div class="db-settings"><label>タイトル<input class="db-title" maxlength="100" required value="${esc(initial.settings.title)}"></label><label>背景色<select class="db-background">${Object.entries(colors).map(([key,c])=>`<option value="${key}" ${key===initial.settings.background?'selected':''}>${c[0]}</option>`).join('')}</select></label></div><div class="db-edit-rows"></div><button type="button" class="ws-button db-add">＋ 指示を追加</button> <button type="button" class="ws-button db-add-note">＋ 自由文の連絡を追加</button></div><footer class="db-edit-foot"><span role="status"></span><button type="submit" class="ws-button primary db-save">公開して保存</button></footer></form>`;
 const $=s=>d.querySelector(s),changed=()=>{dirty=true;requestId=uid();};
 function row(r){const el=document.createElement('div');el.className='db-edit-row';el.dataset.rowId=r.id;
  const note=r.kind==='note',known=rooms.some(x=>x[0]===r.place),selected=known?r.place:r.place?'その他':initial.boardId==='blue'?'青':'自由';
  el.dataset.kind=note?'note':'instruction';if(note)el.classList.add('db-edit-note');
  el.innerHTML=`<label class="db-edit-visible"><input type="checkbox" data-visible ${r.visible!==false?'checked':''}> 表示する</label><div class="db-edit-effects">${rowOptions(r,true)}</div>${note?'':`<label>開始時刻<input type="time" data-field="time" required value="${esc(r.time)}"></label><label>対象<input data-field="target" required maxlength="200" value="${esc(r.target)}"></label><label>場所<select data-field="place" aria-label="場所">${rooms.map(x=>`<option value="${x[0]}" ${x[0]===selected?'selected':''}>${x[1]} ${x[0]}</option>`).join('')}</select><input class="db-place-other" aria-label="その他の場所" maxlength="100" placeholder="場所を自由入力" value="${esc(!known?r.place:'')}" ${selected!=='その他'?'hidden':''}></label>`}<label class="db-edit-instruction">${note?'自由文の連絡':'指示'}<textarea data-field="instruction" required maxlength="4000" placeholder="${note?'時刻・対象・場所にとらわれない連絡':'何をするか入力'}">${esc(r.instruction)}</textarea></label><span class="db-row-order"><button type="button" class="ws-button db-up" aria-label="この指示を上へ">↑</button><button type="button" class="ws-button db-down" aria-label="この指示を下へ">↓</button></span><button type="button" class="ws-button db-remove" aria-label="この指示を削除">削除</button>`;
  el.querySelector('[data-option="animate"]').onchange=e=>{el.querySelector('[data-option="animation"]').hidden=!e.target.checked;};
  el.querySelector('[data-field="place"]')?.addEventListener('change',e=>{el.querySelector('.db-place-other').hidden=e.target.value!=='その他';});
  $('.db-edit-rows').appendChild(el);return el;
 }
 draft.forEach(row);
 function close(){if(!busy&&(!dirty||confirm('保存せずに編集を閉じますか？')))d.close();}
 $('.db-close').onclick=close;d.addEventListener('cancel',e=>{e.preventDefault();close();});d.addEventListener('click',e=>{if(e.target===d)close();});d.addEventListener('close',()=>d.remove());
 d.addEventListener('input',changed);d.addEventListener('change',changed);
 function add(kind){if(d.querySelectorAll('.db-edit-row').length>=150){$('[role=status]').textContent='1日150件以内で登録してください。';return;}const el=row({id:uid(),time:'',target:'',place:'',instruction:'',kind,visible:true});changed();el.querySelector('input[type=time],textarea').focus();}
 $('.db-add').onclick=()=>add('instruction');$('.db-add-note').onclick=()=>add('note');
 $('.db-edit-rows').onclick=e=>{if(busy)return;const up=e.target.closest('.db-up'),down=e.target.closest('.db-down'),el=(up||down)?.closest('.db-edit-row');if(up&&el.previousElementSibling){el.previousElementSibling.before(el);changed();}if(down&&el.nextElementSibling){el.nextElementSibling.after(el);changed();}const b=e.target.closest('.db-remove');if(b&&!busy){b.closest('.db-edit-row').remove();changed();}};
 $('form').onsubmit=async e=>{e.preventDefault();if(busy)return;
  draft=[...d.querySelectorAll('.db-edit-row')].map(el=>{const r={id:el.dataset.rowId,kind:el.dataset.kind,visible:el.querySelector('[data-visible]').checked,highlight:el.querySelector('[data-option="highlight"]').checked,animation:el.querySelector('[data-option="animate"]').checked?el.querySelector('[data-option="animation"]').value:'none',time:'',target:'',place:'',...Object.fromEntries([...el.querySelectorAll('[data-field]')].map(x=>[x.dataset.field,x.value.trim()]))};if(r.place==='その他')r.place=el.querySelector('.db-place-other').value.trim()||'その他';return r;});
  busy=true;d.querySelectorAll('button,input,textarea,select').forEach(x=>x.disabled=true);$('[role=status]').textContent='保存中…';
  try{const b=await request(initial.date,{date:initial.date,rows:draft,version:initial.version,requestId,settings:{title:$('.db-title').value,background:$('.db-background').value}},initial.boardId);dirty=false;onSaved(b);d.close();}
  catch(err){$('[role=status]').textContent=err.message;}
  finally{busy=false;d.querySelectorAll('button,input,textarea,select').forEach(x=>x.disabled=false);}
 };
 document.body.appendChild(d);d.showModal();if(focusId){const row=[...d.querySelectorAll('[data-row-id]')].find(el=>el.dataset.rowId===focusId);row?.scrollIntoView({block:'center'});row?.querySelector('textarea')?.focus();}
}
const run=()=>document.querySelectorAll('[data-daily-board]').forEach(mount);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
