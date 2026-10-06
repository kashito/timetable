(()=>{
'use strict';
const selector='textarea[data-homework-items]';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function values(source){
 const rows=String(source.value||'').replace(/\r/g,'').split('\n').map(value=>value.trim()).filter(Boolean);
 return rows.length?rows:[''];
}
function mount(source){
 if(source._homeworkItems)return source._homeworkItems;
 const root=document.createElement('div');root.className='homework-item-editor';
 root.innerHTML='<div class="homework-item-editor-list"></div><button type="button" class="homework-item-add">＋ 宿題を追加</button><small>1つの入力欄が1件の宿題です。Enterでも次の宿題を追加できます。生徒は項目ごとにチェックできます。</small>';
 source.insertAdjacentElement('afterend',root);source.classList.add('homework-item-source');source.setAttribute('aria-hidden','true');source.tabIndex=-1;
 const list=root.querySelector('.homework-item-editor-list');let internal=false,last='';
 const disabled=()=>source.disabled||source.readOnly;
 function sync(focus=-1){
  const rows=[...list.querySelectorAll('.homework-item-text')].map(input=>input.value.trim()).filter(Boolean);
  internal=true;source.value=rows.join('\n');last=source.value;source.dispatchEvent(new Event('input',{bubbles:true}));internal=false;
  if(focus>=0)list.querySelectorAll('.homework-item-text')[focus]?.focus();
 }
 function render(focus=-1){
  const rows=values(source);last=source.value;
  list.innerHTML=rows.map((value,index)=>`<div class="homework-item-row"><input class="homework-item-check" type="checkbox" tabindex="-1" aria-hidden="true" disabled><input class="homework-item-text" type="text" value="${esc(value)}" placeholder="宿題 ${index+1}" aria-label="宿題 ${index+1}"><button type="button" class="homework-item-remove" aria-label="宿題 ${index+1}を削除">削除</button></div>`).join('');
  updateDisabled();if(focus>=0)list.querySelectorAll('.homework-item-text')[focus]?.focus();
 }
 function updateDisabled(){const off=disabled();root.classList.toggle('is-disabled',off);root.querySelectorAll('.homework-item-text,.homework-item-add,.homework-item-remove').forEach(control=>control.disabled=off);root.classList.toggle('group-field-missing',source.classList.contains('group-field-missing'));}
 root.addEventListener('input',event=>{if(event.target.matches('.homework-item-text'))sync();});
 root.addEventListener('keydown',event=>{if(event.target.matches('.homework-item-text')&&event.key==='Enter'){event.preventDefault();const rows=[...list.querySelectorAll('.homework-item-text')],index=rows.indexOf(event.target);const row=document.createElement('div');row.className='homework-item-row';row.innerHTML=`<input class="homework-item-check" type="checkbox" tabindex="-1" aria-hidden="true" disabled><input class="homework-item-text" type="text" placeholder="宿題 ${index+2}" aria-label="宿題 ${index+2}"><button type="button" class="homework-item-remove" aria-label="宿題を削除">削除</button>`;rows[index].closest('.homework-item-row').insertAdjacentElement('afterend',row);sync(index+1);}});
 root.addEventListener('click',event=>{if(event.target.matches('.homework-item-add')){const row=document.createElement('div');row.className='homework-item-row';row.innerHTML='<input class="homework-item-check" type="checkbox" tabindex="-1" aria-hidden="true" disabled><input class="homework-item-text" type="text" placeholder="新しい宿題" aria-label="新しい宿題"><button type="button" class="homework-item-remove" aria-label="宿題を削除">削除</button>';list.append(row);sync(list.children.length-1);}if(event.target.matches('.homework-item-remove')){const row=event.target.closest('.homework-item-row'),index=[...list.children].indexOf(row);row.remove();if(!list.children.length){sync();render(0);}else sync(Math.max(0,index-1));}});
 source.addEventListener('input',()=>{if(!internal&&source.value!==last)render(0);});
 const api={source,root,render,updateDisabled,checkExternal:()=>{if(source.value!==last)render();},focus:()=>root.querySelector('.homework-item-text')?.focus()};source._homeworkItems=api;render();return api;
}
function scan(root=document){root.querySelectorAll?.(selector).forEach(mount);}
new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1){if(node.matches?.(selector))mount(node);scan(node);}}).observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>document.querySelectorAll(selector).forEach(source=>{const editor=mount(source);editor.checkExternal();editor.updateDisabled();}),500);
function focus(source){mount(source).focus();}
window.HomeworkItemEditor={mount,scan,focus};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>scan());else scan();
})();
