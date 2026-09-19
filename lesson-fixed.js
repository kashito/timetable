(()=>{
let lessons={},states={},fixedLoaded=false,stateLoaded=false;
const staffPage=['schedule_generator.html','teacher2026summer.html','teacher2026summer_vertical.html'].includes(StaffAuth.page);
const admin=()=>staffPage&&StaffAuth.user?.role==='admin';
const staff=()=>staffPage&&!!StaffAuth.user;
const isFixed=key=>!!lessons[key]?.fixed;
const isReady=(key,fallback=false)=>stateLoaded?!!states[key]?.ready:fallback;
const pending=new Set();
async function refresh(){const j=await Workspace.api('lesson_fixed_api.php');lessons=j.lessons||{};fixedLoaded=true;decorate();}
async function refreshState(){const j=await Workspace.api('state_api.php');const before=JSON.stringify(states);states=j.state||{};stateLoaded=true;decorate();if(JSON.stringify(states)!==before)document.dispatchEvent(new Event('lesson-state-changed'));}
async function refreshAll(){const results=await Promise.allSettled([refresh(),refreshState()]);for(const result of results)if(result.status==='rejected')console.warn('授業状態の更新失敗',result.reason);}
function stateSaved(key,state){states[key]=state;stateLoaded=true;decorate();document.dispatchEvent(new Event('lesson-state-changed'));}
function badge(key){return `<span class="lesson-fixed-badge ${isFixed(key)?'is-fixed':'is-tentative'}">${isFixed(key)?'🔒 確定':'予定は変更の可能性あり'}</span>`;}
function setText(el,text){if(el.textContent!==text)el.textContent=text;}
function actionStatus(el,text,error=false){el.dataset.error=String(error);setText(el,text);}
function button(action,text){const b=document.createElement('button');b.type='button';b.draggable=false;b.dataset.lessonAction=action;b.textContent=text;return b;}
function groupInfo(card){const id=card.dataset.linkedId;if(!id)return null;const group=window.LessonGroups?.groups.find(g=>g.id===id);return group?.active&&group.lessonKeys?.length>1?group:null;}
function groupedState(keys,fn){const count=keys.filter(fn).length;return count===keys.length?'true':count?'mixed':'false';}
function decorateGroup(card,group){
 const keys=group.lessonKeys,fixed=groupedState(keys,isFixed),prepared=groupedState(keys,k=>isReady(k));
 card.classList.add('has-group-controls');card.classList.toggle('has-fixed-control',admin());
 for(const old of card.querySelectorAll(':scope > .linked-slot-states,:scope > .linked-fixed-summary,:scope > .lesson-fixed-badge'))old.remove();
 let actions=card.querySelector(':scope > .lesson-list-actions');
 if(actions&&!actions.classList.contains('linked-group-actions')){actions.remove();actions=null;}
 if(!actions){actions=document.createElement('div');actions.className='lesson-list-actions linked-group-actions';
  if(admin())actions.appendChild(button('fixed','確定'));else{const label=document.createElement('span');label.className='group-fixed-status';actions.appendChild(label);}
  actions.appendChild(button('ready','準備'));const status=document.createElement('span');status.className='lesson-action-status';status.setAttribute('role','status');actions.appendChild(status);card.appendChild(actions);
 }
 actions.dataset.lessonGroup=group.id;
 for(const [field,state,loaded] of [['fixed',fixed,fixedLoaded],['ready',prepared,stateLoaded]]){
  const b=actions.querySelector(`[data-lesson-action="${field}"]`),on=state==='true',mixed=state==='mixed';
  const title=`連結した全${keys.length}コマを`+(field==='fixed'?(on?'未確定に戻す':'確定する'):(on?'準備未に戻す':'準備済みにする'));
  if(b){b.disabled=!loaded||pending.has('group|'+group.id);b.setAttribute('aria-pressed',state);b.title=title;b.setAttribute('aria-label',title+(mixed?'（現在は一部のみ設定済み）':''));setText(b,!loaded?'読込中…':field==='fixed'?(on?'🔒 確定':mixed?'🔓 一部確定':'🔓 未確定'):(on?'✓ 準備済':mixed?'◐ 一部準備':'○ 準備未'));}
 }
 const label=actions.querySelector('.group-fixed-status');if(label){label.dataset.state=fixed;label.title=fixed==='true'?'連結全体の予定は確定しています':fixed==='mixed'?'一部のみ確定しています':'予定は変更の可能性があります';setText(label,fixed==='true'?'🔒 確定':fixed==='mixed'?'🔓 一部確定':'🔓 未確定');}
 card.classList.toggle('is-ready',prepared==='true');card.classList.toggle('hide-ready-card',!!document.getElementById('hideReadyToggle')?.checked&&prepared==='true');
}
async function actGroup(b,host){
 const group=window.LessonGroups?.groups.find(g=>g.id===host.dataset.lessonGroup),field=b.dataset.lessonAction;if(!group||!staff()||b.disabled||field==='fixed'&&!admin())return;
 const token='group|'+group.id;if(pending.has(token))return;
 const expected=Object.fromEntries(group.lessonKeys.map(k=>[k,field==='fixed'?isFixed(k):isReady(k)])),value=!Object.values(expected).every(Boolean),status=host.querySelector('.lesson-action-status');
 pending.add(token);decorate();actionStatus(status,'保存中…');
 try{const j=await Workspace.api('lesson_group_status_api.php',{id:group.id,field,value,expected});
  for(const key of j.keys){if(field==='fixed')lessons[key]={...(lessons[key]||{}),fixed:value};else states[key]={...(states[key]||{}),ready:value};}
  actionStatus(status,`連結全${j.keys.length}コマを保存しました`);decorate();document.dispatchEvent(new Event(field==='fixed'?'lesson-fixed-updated':'lesson-state-changed'));
 }catch(e){actionStatus(status,e.message,true);}finally{pending.delete(token);decorate();}
}
function decorate(){
 const bySource=new Map(window.Generator?Generator.rows().map(r=>[r._sourceKey,Generator.eventKey(r)]):[]);
 document.querySelectorAll('.lesson[data-source-key],.event[data-key],.event-card[data-key],[data-linked-member][data-key]').forEach(card=>{
  const key=card.dataset.key||bySource.get(card.dataset.sourceKey);if(!key||key.split('|').length<6)return;
  const group=groupInfo(card);if(group&&staff()){decorateGroup(card,group);return;}
  const keys=window.LinkedSchedule?.keys(card)||[key],many=keys.length>1;
  if(many){
   const on=keys.every(isFixed),some=keys.some(isFixed);let summary=card.querySelector(':scope > .linked-fixed-summary');
   if(fixedLoaded){if(!summary){summary=document.createElement('span');summary.className='lesson-fixed-badge linked-fixed-summary';card.appendChild(summary);}summary.classList.toggle('is-fixed',on);setText(summary,on?'🔒 確定':some?'一部確定・未確定のコマは変更の可能性あり':'予定は変更の可能性あり');}
   if(staff()){card.classList.toggle('has-fixed-control',admin());card.classList.toggle('is-ready',keys.every(isReady));card.classList.toggle('hide-ready-card',!!document.getElementById('hideReadyToggle')?.checked&&keys.every(isReady));}
   return;
  }
  let label=card.querySelector('.lesson-fixed-badge');if(fixedLoaded){if(!label)card.insertAdjacentHTML('beforeend',badge(key));else if(label.classList.contains('is-fixed')!==isFixed(key))label.outerHTML=badge(key);}
  if(!staff())return;
  if(card.closest('#gridWrap,body.compact-whole-schedule #schedule'))for(const line of card.children){if(line.matches('strong,div:not(.lesson-list-actions),.lesson-fixed-badge'))line.title=line.textContent;}
  let actions=card.querySelector('.lesson-list-actions');
  if(!actions){actions=document.createElement('div');actions.className='lesson-list-actions';if(admin())actions.appendChild(button('fixed','予定を確定'));actions.appendChild(button('ready','準備未'));const status=document.createElement('span');status.className='lesson-action-status';status.setAttribute('role','status');actions.appendChild(status);card.appendChild(actions);}
  actions.dataset.lessonKey=key;card.classList.toggle('has-fixed-control',admin());
  for(const [action,on,loaded] of [['fixed',isFixed(key),fixedLoaded],['ready',isReady(key),stateLoaded]]){
   const b=actions.querySelector(`[data-lesson-action="${action}"]`);if(!b)continue;
   b.disabled=!loaded||pending.has(action+'|'+key);b.setAttribute('aria-pressed',String(on));
   setText(b,!loaded?'読込中…':action==='fixed'?(on?'🔒 確定済':'予定を確定'):(on?'✓ 準備済':'準備未'));
   b.title=action==='fixed'?(on?'確定を解除して仮予定に戻す':'この授業の予定を確定する'):(on?'準備未に戻す':'授業の準備済みを記録する');
  }
  if(card.hasAttribute('data-linked-member'))for(const b of actions.querySelectorAll('button')){b.title=card.dataset.slot+' '+b.title;b.setAttribute('aria-label',b.title);}
  if(stateLoaded){card.classList.toggle('is-ready',isReady(key));card.classList.toggle('hide-ready-card',!!document.getElementById('hideReadyToggle')?.checked&&isReady(key));}
 });
 if(admin())document.querySelectorAll('.sticky-date-box,.date-cell').forEach(host=>{
  const date=host.querySelector('textarea[data-date]')?.dataset.date?.replaceAll('/','-');if(!date||host.querySelector('[data-lesson-action="fix-date"]'))return;
  const b=button('fix-date','この日の予定を一括確定');b.dataset.fixedDate=date;b.className='date-fixed-button';
  const status=document.createElement('span');status.className='date-fixed-status';status.setAttribute('role','status');host.append(b,status);
 });
 document.dispatchEvent(new Event('lesson-fixed-updated'));
}
// Details show status only; fixed controls live on the schedule cards.
async function editor(key,host){if(!host)return;await ready;host.querySelector('.lesson-fixed-editor')?.remove();if(!fixedLoaded)return;const box=document.createElement('span');box.className='lesson-fixed-editor';box.innerHTML=badge(key);host.appendChild(box);}
async function act(b){
 const action=b.dataset.lessonAction;
 if(action==='fix-date'){
  if(!admin()||b.disabled)return;const date=b.dataset.fixedDate,status=b.parentElement.querySelector('.date-fixed-status');b.disabled=true;setText(status,'確認中…');
  try{
   const {plan}=await Workspace.api('lesson_fixed_api.php?date='+encodeURIComponent(date));
   if(!plan.total){setText(status,'この日の授業はありません。');return;}
   if(!plan.pending){await refresh();setText(status,`全${plan.total}コマ確定済み`);return;}
   if(!confirm(`${date.replaceAll('-','/')} の全${plan.total}コマを確定します。\n先生・教室・生徒などの絞り込みに関係なく、この日の全授業が対象です。\n新たに確定する予定は${plan.pending}コマです。実行しますか？`)){setText(status,'キャンセルしました');return;}
   const j=await Workspace.api('lesson_fixed_api.php',{action:'fix_date',date,token:plan.token});
   for(const key of j.keys)lessons[key]={fixed:true};fixedLoaded=true;decorate();setText(status,`全${j.total}コマ確定済み（今回${j.changed}コマ）`);
  }catch(e){setText(status,e.message);}finally{b.disabled=false;}
  return;
 }
 const host=b.closest('.lesson-list-actions');if(host?.dataset.lessonGroup){await actGroup(b,host);return;}const key=host?.dataset.lessonKey;if(!key||!staff()||b.disabled)return;
 const id=action+'|'+key,status=host.querySelector('.lesson-action-status');if(pending.has(id))return;
 pending.add(id);b.disabled=true;actionStatus(status,'保存中…');
 try{
  if(action==='fixed'){
   if(!admin())return;const j=await Workspace.api('lesson_fixed_api.php',{key,fixed:!isFixed(key)});lessons[key]=j.lesson;
  }else if(action==='ready'){
   const patch={ready:!isReady(key)};
   const state=window.SharedClassState?await SharedClassState.save(key,patch):(await Workspace.api('state_api.php',{eventKey:key,...patch})).state;
   stateSaved(key,state);
  }
  actionStatus(status,'保存しました');
 }catch(e){actionStatus(status,e.message,true);}finally{pending.delete(id);decorate();}
}
const ready=StaffAuth.ready.then(async()=>{await Promise.all([refresh(),staff()?refreshState():Promise.resolve()]);}).catch(e=>console.warn('授業状態読込失敗',e));
window.LessonFixed={ready,refresh,refreshAll,isFixed,isReady,stateSaved,badge,editor,decorate,get loaded(){return fixedLoaded;}};
let scheduled=false;
function install(){
 const root=document.getElementById('schedule')||document.getElementById('gridWrap');
 if(root)new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate();});}).observe(root,{childList:true,subtree:true});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-lesson-action]');if(!b)return;e.preventDefault();e.stopPropagation();act(b);},true);
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('[data-lesson-action]'))return;const card=e.target.closest('[draggable="true"]');if(!card)return;card.draggable=false;const restore=()=>{card.draggable=true;document.removeEventListener('pointerup',restore,true);document.removeEventListener('pointercancel',restore,true);};document.addEventListener('pointerup',restore,true);document.addEventListener('pointercancel',restore,true);},true);
 window.addEventListener('focus',()=>{if(staff())Promise.all([refresh(),refreshState()]).catch(e=>console.warn(e));});
 decorate();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
