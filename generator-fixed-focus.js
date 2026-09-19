(()=>{
'use strict';
const root=document.getElementById('gridWrap');if(!root)return;
const preference='timetable.generator.fixedFocusDates';
const iso=value=>String(value||'').replaceAll('/','-');
const dates=new Set();
try{const saved=JSON.parse(sessionStorage.getItem(preference)||'[]');if(Array.isArray(saved))saved.filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).forEach(d=>dates.add(d));}catch(e){}
const previous=new WeakMap();let queued=false,settled=false;
function lessonKey(card){
  if(card.dataset.key)return card.dataset.key;
  const row=window.Generator?.rows().find(r=>r._sourceKey===card.dataset.sourceKey);
  return row?Generator.eventKey(row):'';
}
function isBlocked(card,key=lessonKey(card)){
  return !!key&&dates.has(iso(key.split('|')[0]))&&(!window.LessonFixed?.loaded||(card.dataset.linkedKeys?JSON.parse(card.dataset.linkedKeys).every(k=>LessonFixed.isFixed(k)):LessonFixed.isFixed(key)));
}
function sync(){
  const keys=new Map(window.Generator?Generator.rows().map(r=>[r._sourceKey,Generator.eventKey(r)]):[]);
  root.querySelectorAll('.lesson[data-source-key]').forEach(card=>{
    const blocked=isBlocked(card,card.dataset.key||keys.get(card.dataset.sourceKey)||'');
    card.classList.toggle('fixed-focus-muted',blocked);
    if(blocked){
      if(!previous.has(card))previous.set(card,{draggable:card.getAttribute('draggable'),inert:card.inert,ariaDisabled:card.getAttribute('aria-disabled')});
      card.inert=true;card.draggable=false;card.setAttribute('aria-disabled','true');
    }else if(previous.has(card)){
      const before=previous.get(card);card.inert=before.inert;
      for(const [name,value] of [['draggable',before.draggable],['aria-disabled',before.ariaDisabled]])value===null?card.removeAttribute(name):card.setAttribute(name,value);
      previous.delete(card);
    }
  });
  root.querySelectorAll('[data-fixed-focus-date]').forEach(button=>{
    const enabled=dates.has(iso(button.dataset.fixedFocusDate)),loaded=!!window.LessonFixed?.loaded;
    button.disabled=!loaded;button.setAttribute('aria-pressed',String(enabled));
    const icon=enabled?'🔒':'🔓';if(button.textContent!==icon)button.textContent=icon;
    const label=!loaded?(settled?'確定状態を読み込めません。ページを再読み込みしてください。':'確定状態を読み込み中…'):enabled?'確定済みのコマを半透明・操作停止にしています。クリックで通常表示に戻す':'この日の確定済みのコマを半透明にして操作を止める';
    button.title=label;button.setAttribute('aria-label',label);
  });
}
function requestSync(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;sync();});}
// Capture at window before grouped-lesson links and quick actions can handle clicks.
function guard(event){
  const card=event.target.closest?.('#gridWrap .lesson[data-source-key]');
  if(!card||!isBlocked(card))return;
  event.preventDefault();event.stopImmediatePropagation();
}
for(const type of ['click','dblclick','auxclick','pointerdown','mousedown','touchstart','dragstart','keydown'])window.addEventListener(type,guard,{capture:true,passive:false});
root.addEventListener('click',event=>{
  const button=event.target.closest('[data-fixed-focus-date]');if(!button||button.disabled)return;
  event.preventDefault();event.stopImmediatePropagation();
  const date=iso(button.dataset.fixedFocusDate);dates.has(date)?dates.delete(date):dates.add(date);
  try{sessionStorage.setItem(preference,JSON.stringify([...dates]));}catch(e){}
  sync();
},true);
new MutationObserver(requestSync).observe(root,{childList:true,subtree:true});
document.addEventListener('lesson-fixed-updated',sync);
window.LessonFixed?.ready.finally(()=>{settled=true;sync();});
sync();
})();
