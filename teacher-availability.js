(function(){
'use strict';
if(window.__teacherAvailabilityInstalled) return;
window.__teacherAvailabilityInstalled=true;

const SLOT_KEYS=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];
let ngEntries=[];
let selectedDate='';
let loading=false,loadError='',loadRequest=0;
const isGenerator=!!document.getElementById('gridWrap');

function normDate(v){
  const m=String(v||'').trim().match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  return m?`${m[1]}-${String(+m[2]).padStart(2,'0')}-${String(+m[3]).padStart(2,'0')}`:'';
}
function wd(iso){
  const d=new Date(iso+'T00:00:00');
  return isNaN(d)?'':['日','月','火','水','木','金','土'][d.getDay()];
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function teacherList(){
  const set=new Set();
  document.querySelectorAll('select option').forEach(o=>{
    const sel=o.parentElement;
    if(!sel) return;
    const id=sel.id||'';
    if(!/teacher/i.test(id)) return;
    const v=String(o.value||o.textContent||'').trim();
    // 自由入力用の内部値や「未設定」は講師ではないので一覧に出さない
    if(v && !/^__.*__$/.test(v) && v!=='未設定' && !/すべて|選択してください|その他（自由入力）/.test(v)) set.add(v);
  });
  ngEntries.forEach(e=>{
    const v=String(e.teacher||'').trim();
    if(v && !/^__.*__$/.test(v) && v!=='未設定') set.add(v);
  });
  return [...set].filter(Boolean).sort((a,b)=>a.localeCompare(b,'ja'));
}
function rowsForDay(){
  try{
    if(typeof window.getCurrentScheduleRows==='function') return window.getCurrentScheduleRows()||[];
  }catch(e){}
  return [];
}
function busySlots(teacher,iso){
  const busy=new Set();
  rowsForDay().forEach(r=>{
    const rd=normDate(r.date||r['日付']);
    const rt=String(r.teacher||r['担当講師']||'').trim();
    const rs=String(r.slot||r['時間番号']||'').trim();
    const special=String(r.dayType||r['日区分']||'').trim();
    if(!special && rd===iso && rt===teacher && SLOT_KEYS.includes(rs)) busy.add(rs);
  });
  return busy;
}
function ngSlots(teacher,iso){
  const set=new Set(); let all=false; let notes=[];
  ngEntries.forEach(e=>{
    if(String(e.teacher||'').trim()!==teacher || normDate(e.date)!==iso) return;
    if(e.allDay) all=true;
    (e.slots||[]).forEach(s=>set.add(String(s)));
    if(e.note) notes.push(String(e.note));
  });
  return {all,set,notes};
}
function ensurePanel(){
  let p=document.getElementById('teacherAvailabilityPanel');
  if(p) return p;
  p=document.createElement(isGenerator?'dialog':'section');
  p.id='teacherAvailabilityPanel';
  p.className='teacher-availability-panel'+(isGenerator?' generator-availability-dialog':'');
  if(isGenerator){
    p.setAttribute('aria-labelledby','teacherAvailabilityHeading');
    p.addEventListener('click',e=>{
      if(e.target.closest('[data-close-availability]')){p.close();return;}
      if(e.target!==p)return;
      const r=p.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)p.close();
    });
    document.body.appendChild(p);
    return p;
  }
  p.style.display='none';
  const anchor=document.getElementById('gridWrap')||document.getElementById('schedule');
  if(anchor&&anchor.parentNode) anchor.parentNode.insertBefore(p,anchor); else document.body.appendChild(p);
  return p;
}
function render(){
  const p=ensurePanel();
  if(!selectedDate){p.innerHTML=''; if(!isGenerator)p.style.display='none';return;}
  if(!isGenerator)p.style.display='block';
  p.setAttribute('aria-busy',String(loading));
  const teachers=teacherList();
  let html=`<div class="teacher-availability-head"><strong id="teacherAvailabilityHeading">${esc(selectedDate.replaceAll('-','/'))}（${wd(selectedDate)}） 講師OK・NG</strong>${isGenerator?'<button type="button" data-close-availability autofocus>閉じる</button>':''}<span>緑＝配置可能　灰＝授業あり　赤＝NG</span></div>`;
  if(loading||loadError){html+=`<div class="teacher-availability-empty" role="status">${loading?'勤務OK・NGを読み込み中…':esc(loadError)+'　日付をクリックして開き直してください。'}</div>`;p.innerHTML=html;return;}
  if(!teachers.length){html+='<div class="teacher-availability-empty">講師が見つかりません。</div>';p.innerHTML=html;return;}
  html+='<div class="teacher-availability-list">';
  teachers.forEach(t=>{
    const ng=ngSlots(t,selectedDate); const busy=busySlots(t,selectedDate);
    html+=`<div class="teacher-availability-row" data-availability-teacher="${esc(t)}"><div class="teacher-availability-name" title="${esc(t)}">${esc(t)}</div><div class="teacher-availability-slots">`;
    SLOT_KEYS.forEach(s=>{
      const state=ng.all||ng.set.has(s)?'ng':busy.has(s)?'busy':'ok';
      const title=state==='ng'?'NG':state==='busy'?'授業あり':'OK';
      html+=`<span class="teacher-av-slot ${state}" title="${title}" aria-label="${s} ${title}">${s}</span>`;
    });
    html+='</div>';
    if(ng.notes.length) html+=`<div class="teacher-availability-note">${esc(ng.notes.join(' / '))}</div>`;
    html+='</div>';
  });
  html+='</div>';
  p.innerHTML=html;
}
async function loadNg(){
  const request=++loadRequest;loading=true;loadError='';render();
  try{
    const r=await fetch('teacher_ng_api.php?v='+Date.now(),{cache:'no-store'});const j=await r.json();
    if(!r.ok||!j.ok||!Array.isArray(j.entries))throw new Error(j.error||'勤務OK・NGを読み込めませんでした。');
    if(request!==loadRequest)return;ngEntries=j.entries;
  }catch(e){if(request!==loadRequest)return;loadError=e.message||'勤務OK・NGを読み込めませんでした。';}
  finally{if(request===loadRequest){loading=false;render();}}
}
function selectDate(v){
  const d=normDate(v);if(!d)return;selectedDate=d;
  loadNg();
  const p=ensurePanel();if(isGenerator&&!p.open)p.showModal();
}

document.addEventListener('click',e=>{
  const dlabel=e.target.closest('.sticky-date,.sticky-date-line,.date-cell');
  if(dlabel){
    if(e.target.closest('input,textarea,select,a,button:not(.sticky-date)'))return;
    if(dlabel.dataset.availabilityDate){selectDate(dlabel.dataset.availabilityDate);return;}
    const wrap=dlabel.closest('.sticky-date-box,.date-cell')||dlabel.parentElement;
    const input=wrap&&wrap.querySelector('[data-date]');
    if(input&&input.dataset.date){selectDate(input.dataset.date);return;}
    const txt=(dlabel.textContent||'').match(/(\d{1,2})[\/-](\d{1,2})/);
    if(txt) selectDate(`2026-${String(+txt[1]).padStart(2,'0')}-${String(+txt[2]).padStart(2,'0')}`);
  }
});
document.addEventListener('change',e=>{
  if(!isGenerator && e.target && e.target.type==='date' && /date/i.test(e.target.id||'')) selectDate(e.target.value);
});

window.refreshTeacherAvailability=async function(){await loadNg();};
ensurePanel(); loadNg();
})();
