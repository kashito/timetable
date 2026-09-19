(()=>{'use strict';
// Only links to this application's staff-only test result page are made clickable.
const destination=new URL('test_results.html',location.href),seen=new WeakMap(),previews=new WeakMap();
function target(text){try{const u=new URL(text);const id=u.searchParams.get('test');if(u.origin!==destination.origin||u.pathname!==destination.pathname||u.username||u.password||!id||!/^[a-f0-9]{24}$/.test(id))return null;const safe=new URL(destination);safe.searchParams.set('test',id);return safe.href;}catch{return null;}}
function matches(text){return [...String(text).matchAll(/https?:\/\/[^\s<>"'）)]+/g)].map(m=>({text:m[0],index:m.index,href:target(m[0])})).filter(m=>m.href);}
function anchor(href,label){const a=document.createElement('a');a.href=href;a.textContent=label;a.target='_blank';a.rel='noopener';a.className='record-test-link';return a;}
function decorate(){
 for(const root of document.querySelectorAll('.memo,.group-original')){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];let node;while(node=walker.nextNode())if(!node.parentElement.closest('a,button,textarea,script,style'))nodes.push(node);
  for(const node of nodes){const found=matches(node.nodeValue);if(!found.length)continue;const fragment=document.createDocumentFragment();let offset=0;for(const m of found){fragment.append(node.nodeValue.slice(offset,m.index),anchor(m.href,'テスト結果を開く'));offset=m.index+m.text.length;}fragment.append(node.nodeValue.slice(offset));node.replaceWith(fragment);}
 }
 for(const field of document.querySelectorAll('#groupMemo,#lessonRecordMemo,#generatorRecordMemo,.editBox .editMemo')){
  if(seen.get(field)===field.value)continue;seen.set(field,field.value);let box=previews.get(field);const urls=[...new Set(matches(field.value).map(m=>m.href))];
  if(!box&&urls.length){box=document.createElement('div');box.className='record-test-previews';field.after(box);previews.set(field,box);}if(!box)continue;
  box.replaceChildren();box.hidden=!urls.length;urls.forEach((href,i)=>box.append(anchor(href,'カルテ内のテスト結果を開く'+(urls.length>1?' '+(i+1):''))));
 }
}
let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate();});};
function boot(){decorate();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});document.addEventListener('input',schedule);document.addEventListener('lesson-recording-saved',schedule);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
