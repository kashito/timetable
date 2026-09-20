(()=>{
const esc=Workspace.esc;let active=false;
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dateObject=s=>new Date(Number(s.slice(0,4)),Number(s.slice(5,7))-1,Number(s.slice(8,10)),12);
const label=s=>s.replaceAll('-','/')+'（'+'日月火水木金土'[dateObject(s).getDay()]+'）';
async function show(sourceKey){
 if(active||StaffAuth.user?.role!=='admin')return null;active=true;
 let d=document.getElementById('lessonRepeatDialog');if(!d){d=document.createElement('dialog');d.id='lessonRepeatDialog';d.className='ws-dialog';document.body.appendChild(d);}
 d.innerHTML=`<div class="ws-dialog-inner"><div class="ws-dialog-head"><h2>連続配置</h2><button class="ws-button" data-repeat-cancel>キャンセル</button></div><div class="ws-dialog-body" data-repeat-body></div><div class="ws-dialog-foot"><span class="ws-message" role="status" data-repeat-message>元の授業を確認中…</span><button class="ws-button primary" data-repeat-save disabled>選んだ日に配置</button></div></div>`;
 const body=d.querySelector('[data-repeat-body]'),msg=d.querySelector('[data-repeat-message]'),save=d.querySelector('[data-repeat-save]');
 let busy=true,resolve,data,month;const selected=new Set(),done=new Promise(r=>resolve=r);
 const close=value=>{if(busy)return;d.close();active=false;resolve(value);};
 d.querySelector('[data-repeat-cancel]').onclick=()=>close(null);d.querySelector('[data-repeat-cancel]').disabled=true;d.oncancel=e=>{e.preventDefault();close(null);};d.showModal();
 function refreshSelection(){
  const dates=[...selected].sort();body.querySelector('[data-repeat-selected]').innerHTML=dates.length?dates.map(s=>`<button class="ws-button" type="button" data-repeat-remove="${s}" aria-label="${label(s)}の選択を解除">${label(s)} ×</button>`).join(''):'配置する日付をチェックしてください。';
  body.querySelector('[data-repeat-count]').textContent=dates.length?`${dates.length}日 × ${data.rows.length}コマ = ${dates.length*data.rows.length}コマを追加`:'日付は31日まで選択できます。';save.disabled=!dates.length||busy;
 }
 function renderMonth(){
  const first=new Date(month.getFullYear(),month.getMonth(),1,12),days=new Date(month.getFullYear(),month.getMonth()+1,0,12).getDate();
  body.querySelector('[data-repeat-month]').textContent=first.getFullYear()+'年'+(first.getMonth()+1)+'月';
  body.querySelector('[data-repeat-calendar]').innerHTML=[...'日月火水木金土'].map(w=>`<span class="repeat-weekday">${w}</span>`).join('')+'<span></span>'.repeat(first.getDay())+Array.from({length:days},(_,i)=>{
   const s=iso(new Date(first.getFullYear(),first.getMonth(),i+1,12)),source=s===data.date;
   return `<label class="repeat-day ${source?'repeat-source':''}"><input type="checkbox" value="${s}" aria-label="${label(s)}" ${selected.has(s)?'checked':''} ${source?'disabled':''}><span>${i+1}${source?'<small>元の授業</small>':''}</span></label>`;
  }).join('');refreshSelection();
 }
 try{
  data=await Workspace.api('lesson_repeat_api.php?sourceKey='+encodeURIComponent(sourceKey));month=dateObject(data.date);month.setDate(1);
  const r=data.rows[0];body.innerHTML=`<p class="repeat-source-summary"><strong>${esc(r['クラス'])}</strong><br>${label(data.date)} ／ ${esc(data.rows.map(r=>r['時間番号']).join(''))} ${esc(r['開始'])}–${esc(data.rows.at(-1)['終了'])}<br>${esc(r['担当講師']||'担当未設定')} ／ ${esc(r['教室']||'教室未設定')}</p><p>チェックした日の<strong>同じ時間帯・担当・教室</strong>に追加します。${data.group?'連結と食事休憩の設定も、日ごとに引き継ぎます。':''}</p><div class="repeat-month-nav"><button type="button" class="ws-button" data-repeat-prev aria-label="前の月">←</button><strong data-repeat-month></strong><button type="button" class="ws-button" data-repeat-next aria-label="次の月">→</button></div><div class="repeat-calendar" data-repeat-calendar></div><p data-repeat-count aria-live="polite"></p><div class="repeat-selected" data-repeat-selected></div><p class="ws-muted">授業予定と生徒へのメッセージをコピーします。元の授業は残し、出欠・カルテ・宿題・資料・準備・確定はコピーしません。同じ授業や以前の記録がある日は上書きせず、すべての追加を中止します。</p>`;
  body.querySelector('[data-repeat-prev]').onclick=()=>{month.setMonth(month.getMonth()-1);renderMonth();};body.querySelector('[data-repeat-next]').onclick=()=>{month.setMonth(month.getMonth()+1);renderMonth();};
  body.onchange=e=>{if(busy||!e.target.matches('[data-repeat-calendar] input'))return;const el=e.target;if(el.checked&&selected.size>=data.maxDates){el.checked=false;msg.textContent='一度に選べるのは31日までです。';return;}el.checked?selected.add(el.value):selected.delete(el.value);msg.textContent='';refreshSelection();};
  body.onclick=e=>{const b=e.target.closest('[data-repeat-remove]');if(b&&!busy){selected.delete(b.dataset.repeatRemove);renderMonth();}};
  busy=false;d.querySelector('[data-repeat-cancel]').disabled=false;renderMonth();msg.textContent='';
 }catch(e){busy=false;d.querySelector('[data-repeat-cancel]').disabled=false;msg.textContent=e.message;msg.classList.add('error');return done;}
 let signature='',requestId='';
 save.onclick=async()=>{
  if(busy||!selected.size)return;const dates=[...selected].sort(),next=JSON.stringify(dates);if(signature!==next){signature=next;requestId=crypto.randomUUID();}
  busy=true;d.querySelectorAll('button,input').forEach(e=>e.disabled=true);msg.classList.remove('error');msg.textContent='選んだ日付へ配置中…';
  try{const result=await Workspace.api('lesson_repeat_api.php',{sourceKey,version:data.version,dates,requestId});busy=false;close(result);}
  catch(e){msg.textContent=e.message;msg.classList.add('error');busy=false;d.querySelectorAll('button').forEach(e=>e.disabled=false);renderMonth();}
 };
 return done;
}
window.LessonRepeat={show};
})();
