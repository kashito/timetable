(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.LessonParticipantCount=api;if(root.document)api.start(root);}})(typeof window!=='undefined'?window:null,function(){
'use strict';
const iso=v=>String(v||'').replaceAll('/','-');
function namesFor(keys,students,directory,states){
 if(!Array.isArray(students)||!directory||!states)return null;
 const names=new Set(),className=c=>{const seen=new Set();while(directory.classNameAliases?.[c]&&!seen.has(c)){seen.add(c);c=directory.classNameAliases[c];}return c;};
 const active=(r,date)=>!Array.isArray(r['在籍期間'])||r['在籍期間'].some(p=>(!p.from||iso(p.from)<=date)&&(!p.until||date<iso(p.until)));
 for(const key of keys){if(typeof key!=='string')continue;const [rawDate,,rawClass]=key.split('|'),date=iso(rawDate),cls=className(rawClass),state=states[key]||{},invited=new Set((state.invitedStudents||[]).filter(n=>typeof n==='string'&&n.trim()).map(n=>n.trim()));
  const visible=n=>!directory.withdrawnStudents?.[n]&&!directory.hiddenStudents?.[n];
  const regular=students.filter(r=>className(r['クラス'])===cls&&r['生徒名']&&active(r,date));
  const candidates=new Set([...regular.map(r=>String(r['生徒名']).trim()),...invited]);
  for(const n of candidates){if(!n||!visible(n))continue;
   const attendance=state.attendance?.[n];if(attendance==='欠席'||attendance==='免除')continue;
   if(!invited.has(n)&&(!attendance||attendance==='---')){const exempt=typeof state.exemptionOverrides?.[n]==='boolean'?state.exemptionOverrides[n]:regular.some(r=>String(r['生徒名']).trim()===n&&(r['免除期間']||[]).some(p=>(!p.from||iso(p.from)<=date)&&(!p.until||date<iso(p.until))));if(exempt)continue;}
   names.add(n);
  }
 }
 return names;
}
function count(keys,students,directory,states){const names=namesFor(keys,students,directory,states);return names===null?null:names.size;}
function start(w){
 const doc=w.document,selector='.event[data-class][data-key],.list-item[data-class][data-key],.lesson[data-class][data-key]';let students=null,directory=null,states=null,busy=false,pending=false,frame=null;
 function paint(){frame=null;for(const card of doc.querySelectorAll(selector)){const title=card.querySelector('.event-title,.participant-class-label,:scope > strong');if(!title)continue;let keys=[card.dataset.key];try{keys=JSON.parse(card.dataset.linkedKeys||'null')||keys;}catch{}
  const n=count(keys,students,directory,states);let badge=title.querySelector('.lesson-participant-count');if(!badge){badge=doc.createElement('span');badge.className='lesson-participant-count';badge.style.whiteSpace='nowrap';title.append(badge);}const text=n===null?'(—)':'('+n+')';if(badge.textContent!==text)badge.textContent=text;badge.title=n===null?'参加予定人数を確認できません':'参加予定 '+n+'人（欠席・免除を除く、連結は重複なし）';badge.setAttribute('aria-label',badge.title);
 }}
 function schedule(){if(frame===null)frame=w.requestAnimationFrame(paint);}
 async function refresh(){if(busy){pending=true;return;}busy=true;try{await w.StaffAuth.ready;if(!w.StaffAuth.user)throw Error('ログインが必要です');const [members,state]=await Promise.all([w.Workspace.api('class_members_api.php'),w.Workspace.api('state_api.php')]);if(!Array.isArray(members.students)||!members.directory||!state.state)throw Error('参加予定読込失敗');students=members.students;directory=members.directory;states=state.state;}catch{students=directory=states=null;}finally{busy=false;schedule();if(pending){pending=false;refresh();}}}
 function boot(){new MutationObserver(ms=>{if(ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&!n.classList?.contains('lesson-participant-count')&&(n.matches?.(selector)||n.querySelector?.(selector)))))schedule();}).observe(doc.body,{childList:true,subtree:true});refresh();w.addEventListener('focus',refresh);doc.addEventListener('lesson-state-changed',refresh);w.setInterval(()=>{if(!doc.hidden)refresh();},30000);}
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot);else boot();
}
return {count,namesFor,start};
});
