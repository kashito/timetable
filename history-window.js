(()=>{
const day=d=>d.toLocaleDateString('sv-SE');let days=0,anchor=day(new Date());
const stateKey='history:'+location.pathname;try{const old=JSON.parse(sessionStorage.getItem(stateKey)||'null');if(old&&old.today===day(new Date())){days=old.days||0;anchor=old.anchor||anchor;}}catch(e){}
const requested=new URL(location.href).searchParams.get('date');if(/^\d{4}-\d{2}-\d{2}$/.test(requested||'')){anchor=requested;days=0;}
function start(){const d=new Date(anchor+'T00:00:00');d.setDate(d.getDate()-days);return day(d);}
window.HistoryWindow={capture,restore:k=>{if(k)restore(k);},start,includes:d=>String(d).replaceAll('/','-')>=start(),get days(){return days;},get anchor(){return anchor;}};
function change(){if(location.pathname.endsWith('/teacher2026summer.html')){const u=new URL(location.href);u.searchParams.set('date',start());history.replaceState(history.state,'',u);}
sessionStorage.setItem(stateKey,JSON.stringify({today:day(new Date()),days,anchor}));for(const id of ['showPast','pastDayToggle','studentPastToggle']){const el=document.getElementById(id);if(el){el.checked=days>0||anchor<day(new Date());el.dispatchEvent(new Event('change',{bubbles:true}));}}document.dispatchEvent(new Event('history-window-change'));update();}
function capture(){
 const scroller=document.getElementById('schedule');if(!scroller)return null;
 const elements=[...scroller.querySelectorAll('.teacher-drop-slot[data-date],.day-group[data-date],.event[data-date]')];
 const rect=scroller.getBoundingClientRect(),edge=Math.max(rect.top,parseFloat(getComputedStyle(document.body).getPropertyValue('--workspace-nav-height'))||0);
 const el=elements.find(e=>e.getBoundingClientRect().bottom>edge&&e.getBoundingClientRect().top<innerHeight);if(!el)return null;
 let parent=el.parentElement;const scroll=[];while(parent){if(parent!==document.body&&parent!==document.documentElement&&/(auto|scroll)/.test(getComputedStyle(parent).overflowY))scroll.push(parent);parent=parent.parentElement;}
 return {date:el.dataset.date,slot:el.dataset.slot,room:el.dataset.room,top:el.getBoundingClientRect().top,scroll};
}
function restore(k){let active=true;const style=document.documentElement.style,old=style.overflowAnchor;style.overflowAnchor='none';const events=['wheel','touchstart','pointerdown','keydown'];const finish=()=>{active=false;style.overflowAnchor=old;events.forEach(n=>window.removeEventListener(n,finish,true));};events.forEach(n=>window.addEventListener(n,finish,{capture:true,once:true}));const adjust=()=>{if(!active)return;const el=[...document.querySelectorAll('#schedule [data-date]')].find(e=>e.dataset.date===k.date&&e.dataset.slot===k.slot&&e.dataset.room===k.room);if(!el)return;const delta=el.getBoundingClientRect().top-k.top;if(Math.abs(delta)<.5)return;const parent=k.scroll.find(p=>p.isConnected&&p.scrollHeight>p.clientHeight);if(parent)parent.scrollTop+=delta;else window.scrollBy(0,delta);};adjust();requestAnimationFrame(adjust);[100,250,500].forEach(ms=>setTimeout(adjust,ms));setTimeout(finish,550);}
function update(){const l=document.getElementById('historyLabel');if(l)l.textContent=start().replaceAll('-','/')+' 以降を表示';const p=document.getElementById('historyJump');if(p)p.value=anchor;}
function install(){if(document.getElementById('historyControls'))return;const box=document.createElement('div');box.id='historyControls';box.className='history-controls';box.innerHTML='<button id="historyEarlier" type="button">← さらに前の7日</button><button id="historyToday" type="button">今日に戻る</button><label>日付へ移動 <input id="historyJump" type="date"></label><span id="historyLabel" class="history-label"></span>';
 const host=document.getElementById('gridWrap')||document.getElementById('schedule')||document.getElementById('classScheduleList')||document.querySelector('main');if(!host)return;host.before(box);
 document.getElementById('historyEarlier').onclick=()=>{const keep=location.pathname.endsWith('/teacher2026summer.html')?capture():null;days+=7;change();if(keep)restore(keep);};document.getElementById('historyToday').onclick=()=>{anchor=day(new Date());days=0;change();};document.getElementById('historyJump').onchange=e=>{if(e.target.value){anchor=e.target.value;days=0;change();}};update();
 const sp=document.getElementById('showPast');if(sp){sp.closest('label').hidden=true;}
 change();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
