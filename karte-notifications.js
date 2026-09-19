(function(){
'use strict';
const qs=new URLSearchParams(location.search);
const preset=(qs.get('teacher')||'').trim();
let currentTeacher=preset;
let lastSeen='';
let lastRecords=[];
let initialized=false;
let polling=false;

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function ts(v){const n=Date.parse(String(v||''));return Number.isFinite(n)?n:0;}
function dt(v){const n=ts(v);if(!n)return '';const d=new Date(n),w=['日','月','火','水','木','金','土'][d.getDay()];const p=x=>String(x).padStart(2,'0');return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} ${w} ${p(d.getHours())}:${p(d.getMinutes())}`;}
function getTeacher(){return window.StaffAuth?.user?.name||'';}
function eligible(r,teacher){return window.StaffAuth?.user?.role==='admin' || String(r&&r.teacher||'').trim()===teacher;}
function latestReply(r){const a=Array.isArray(r&&r.replies)?r.replies:[];let best=null,bestTs=0;for(const x of a){const t=ts(x&&x.createdAt);if(t>bestTs){bestTs=t;best=x;}}return {row:best,time:bestTs};}
function activityFor(r,seen){
  const created=ts(r.createdAt),updated=ts(r.updatedAt),rep=latestReply(r);
  if(rep.time>seen && rep.time>=updated-1500) return {type:'返信',time:rep.time,actor:String(rep.row&&rep.row.author||'先生'),text:String(rep.row&&rep.row.text||'')};
  if(created>seen) return {type:'新しい書き込み',time:Math.max(created,updated),actor:String(r.teacher||''),text:String(r.memo||'')};
  if(updated>seen) return {type:'編集',time:updated,actor:String(r.teacher||''),text:String(r.memo||'')};
  if(rep.time>seen) return {type:'返信',time:rep.time,actor:String(rep.row&&rep.row.author||'先生'),text:String(rep.row&&rep.row.text||'')};
  return null;
}
function style(){if(document.getElementById('karteNotifStyle'))return;const s=document.createElement('style');s.id='karteNotifStyle';s.textContent=`
#karteNotif{margin:10px 0 12px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:14px;padding:12px 14px;box-shadow:0 2px 8px rgba(15,23,42,.04);width:100%;max-width:100%;min-width:0;box-sizing:border-box;overflow:hidden}
#karteNotif.hidden{display:none}#karteNotif .kn-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
#karteNotif .kn-title{font-weight:950;color:#1e3a8a;font-size:15px}#karteNotif .kn-badge{display:inline-flex;min-width:24px;height:24px;padding:0 7px;border-radius:999px;align-items:center;justify-content:center;background:#dc2626;color:#fff;font-size:12px;margin-left:6px}
#karteNotif .kn-actions{display:flex;gap:7px;align-items:center}#karteNotif button{border:1px solid #93c5fd;background:#fff;color:#1d4ed8;border-radius:9px;padding:7px 10px;font-weight:900;cursor:pointer}
#karteNotif .kn-list{display:grid;gap:7px;margin-top:10px;min-width:0;max-width:100%}.kn-item{display:block;text-decoration:none;color:#0f172a;background:#fff;border:1px solid #dbeafe;border-radius:10px;padding:9px 10px;min-width:0;max-width:100%;box-sizing:border-box;overflow:hidden}.kn-item:hover{background:#f8fbff}
.kn-line{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.kn-type{font-size:11px;font-weight:950;padding:3px 7px;border-radius:999px;background:#dbeafe;color:#1e40af}.kn-class{font-weight:950}.kn-meta{font-size:12px;color:#64748b}.kn-snippet{font-size:12px;color:#475569;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.kn-admin{font-size:11px;color:#7c3aed;font-weight:800;margin-left:6px}
`;document.head.appendChild(s);}
function box(){let b=document.getElementById('karteNotif');if(b)return b;style();b=document.createElement('section');b.id='karteNotif';b.className='hidden';const status=document.getElementById('statusBar');if(status)status.insertAdjacentElement('afterend',b);else document.querySelector('main')?.prepend(b);b.addEventListener('click',async e=>{if(e.target.closest('[data-kn-read]')){await markSeen();}});return b;}
function detailHref(r){const u=new URL('lesson_records.html',location.href);if(r.className)u.searchParams.set('class',r.className);if(currentTeacher)u.searchParams.set('viewer',currentTeacher);return u.pathname.split('/').pop()+u.search;}
function render(records){const b=box();if(!currentTeacher){b.classList.add('hidden');return;}const seen=ts(lastSeen);const items=[];for(const r of records){if(!eligible(r,currentTeacher))continue;const a=activityFor(r,seen);if(a)items.push({r,a});}items.sort((x,y)=>y.a.time-x.a.time);if(!items.length){b.classList.add('hidden');b.innerHTML='';return;}b.classList.remove('hidden');b.innerHTML=`<div class="kn-head"><div class="kn-title">🔔 カルテに新しい動きがあります <span class="kn-badge">${items.length}</span>${window.StaffAuth?.user?.role==='admin'?'<span class="kn-admin">管理者：全講師対象</span>':''}</div><div class="kn-actions"><button type="button" data-kn-read>すべて確認済みにする</button></div></div><div class="kn-list">${items.slice(0,8).map(({r,a})=>`<a class="kn-item" href="${esc(detailHref(r))}"><div class="kn-line"><span class="kn-type">${esc(a.type)}</span><span class="kn-class">${esc(r.className||'授業')}</span><span class="kn-meta">${esc(r.date||'')} ${esc(r.slot||'')} ${r.teacher?'・'+esc(r.teacher):''}</span></div><div class="kn-meta">${esc(dt(new Date(a.time).toISOString()))}${a.actor?' ・ '+esc(a.actor):''}</div>${a.text?`<div class="kn-snippet">${esc(a.text)}</div>`:''}</a>`).join('')}${items.length>8?`<div class="kn-meta">ほか ${items.length-8} 件あります。</div>`:''}</div>`;}
async function getSeen(){const r=await fetch('karte_notification_api.php?teacher='+encodeURIComponent(currentTeacher)+'&_='+Date.now(),{cache:'no-store'});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'通知状態を取得できません');return String(j.seenAt||'');}
async function saveSeen(iso){const r=await fetch('karte_notification_api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({teacher:currentTeacher,seenAt:iso})});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'通知状態を保存できません');return String(j.seenAt||iso);}
async function fetchRecords(){const r=await fetch('lesson_record_api.php?v='+Date.now(),{cache:'no-store'});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'カルテを取得できません');return Object.values(j.records||{});}
async function markSeen(){try{lastSeen=await saveSeen(new Date().toISOString());render(lastRecords);}catch(e){console.warn('カルテ通知確認保存失敗',e);}}
async function poll(){if(polling)return;polling=true;try{const t=getTeacher();if(!t){currentTeacher='';box().classList.add('hidden');return;}if(t!==currentTeacher){currentTeacher=t;initialized=false;lastSeen='';}
  if(!initialized){lastSeen=await getSeen();if(!lastSeen){lastSeen=await saveSeen(new Date().toISOString());}initialized=true;}
  lastRecords=await fetchRecords();render(lastRecords);
}catch(e){console.warn('カルテ通知取得失敗',e);}finally{polling=false;}}
function start(){box();poll();setInterval(poll,45000);document.getElementById('teacherFilter')?.addEventListener('change',()=>{currentTeacher=getTeacher();initialized=false;poll();});document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,700));else setTimeout(start,700);
})();
