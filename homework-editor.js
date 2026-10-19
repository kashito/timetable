(()=>{
'use strict';
const materialCache=new Map();
const selector='textarea[data-homework-items]';
const identity=()=>'hwx_'+crypto.randomUUID().replaceAll('-','');
const taskText=value=>value&&value!=='宿題なし'&&value!=='未定';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function values(source){
 const rows=String(source.value||'').replace(/\r/g,'').split('\n').map(value=>value.trim()).filter(Boolean);
 return rows.length?rows:[''];
}
function mount(source){
 if(source._homeworkItems)return source._homeworkItems;
 const root=document.createElement('div');root.className='homework-item-editor';
 root.innerHTML='<div class="homework-item-editor-list"></div><button type="button" class="homework-item-add">＋ 宿題を追加</button><small>1つの入力欄が1件の宿題です。期限は日付が空欄なら表示・判定しません。時刻は日本時間で、空欄ならその日の終わりが期限です。資料は配布教材用です。URLを知る人が取得できます。個人情報を含む資料は添付しないでください。Enterでも次の宿題を追加できます。授業・解説の完了は先生が項目ごとに記録します。</small>';
 source.insertAdjacentElement('afterend',root);source.classList.add('homework-item-source');source.setAttribute('aria-hidden','true');source.tabIndex=-1;
 const list=root.querySelector('.homework-item-editor-list');let internal=false,last='',lastRefs='';
 function refs(){const seen=new Set();return [...list.querySelectorAll('.homework-item-text')].map(input=>({id:input.closest('.homework-item-row').dataset.homeworkId||(input.closest('.homework-item-row').dataset.homeworkId=identity()),text:input.value.trim(),dueDate:input.closest('.homework-item-row').querySelector('.homework-item-due')?.value||'',dueTime:input.closest('.homework-item-row').querySelector('.homework-item-due-time')?.value||''})).filter(ref=>{if(!taskText(ref.text)||seen.has(ref.text))return false;seen.add(ref.text);return true;});}
 function storeRefs(){source.dataset.homeworkTaskRefs=JSON.stringify(refs());lastRefs=source.dataset.homeworkTaskRefs;}
 const disabled=()=>source.disabled||source.readOnly;
 function dates(existing=[]){
  const known=new Map(existing.map(ref=>[ref.id,ref]));
  for(const row of list.children){if(row.querySelector('.homework-item-due'))continue;const label=document.createElement('label');label.className='homework-item-deadline';label.textContent='期限（任意）';const input=document.createElement('input');input.type='date';input.className='homework-item-due';input.setAttribute('aria-label','宿題の期限（任意）');input.value=known.get(row.dataset.homeworkId)?.dueDate||'';label.append(input);const time=document.createElement('input');time.type='time';time.className='homework-item-due-time';time.step='60';time.setAttribute('aria-label','宿題の期限時刻（日本時間・任意）');time.value=known.get(row.dataset.homeworkId)?.dueTime||'';time.disabled=disabled()||!input.value;label.append(time);row.append(label);const material=document.createElement('div');material.className='homework-item-materials';material.innerHTML='<button type="button" class="homework-item-upload">資料を添付</button><input type="file" class="homework-item-file" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv,.docx,.xlsx,.pptx" hidden><span class="homework-item-upload-status" role="status"></span><div class="homework-item-files"></div>';row.append(material);const id=row.dataset.homeworkId;if(!materialCache.has(id))materialCache.set(id,known.get(id)?.attachments||[]);showFiles(row);}
 }
 function showFiles(row){const box=row.querySelector('.homework-item-files');box.replaceChildren();for(const file of materialCache.get(row.dataset.homeworkId)||[]){const link=document.createElement('a');link.href='student_file_download.php?id='+encodeURIComponent(file.id);link.textContent=file.name;link.target='_blank';link.rel='noopener';box.append(link);}}
 root.addEventListener('click',event=>{if(event.target.matches('.homework-item-upload')){const input=event.target.closest('.homework-item-row').querySelector('.homework-item-file');if(input.files?.length)input.dispatchEvent(new Event('change',{bubbles:true}));else input.click();}});
 root.addEventListener('change',async event=>{
  if(!event.target.matches('.homework-item-file'))return;const input=event.target,file=input.files?.[0];if(!file)return;const row=input.closest('.homework-item-row'),button=row.querySelector('.homework-item-upload'),status=row.querySelector('.homework-item-upload-status'),id=row.dataset.homeworkId;
  if(!taskText(row.querySelector('.homework-item-text').value.trim())){status.textContent='先に宿題の内容を入力してください';return;}
  button.dataset.busy='1';button.disabled=true;status.textContent='アップロード中…';
  try{const form=new FormData();form.append('taskId',id);form.append('file',file);const response=await fetch('homework_material_api.php',{method:'POST',body:form}),data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'資料を添付できませんでした');const files=materialCache.get(id)||[];files.push(data.attachment);materialCache.set(id,files);showFiles(row);input.value='';button.textContent='資料を添付';status.textContent='添付しました。宿題の変更も保存してください。';source.dispatchEvent(new Event('input',{bubbles:true}));}
  catch(error){button.textContent='添付を再試行';status.textContent=error.message+'。入力と選択したファイルは保持しています。';}
  finally{delete button.dataset.busy;updateDisabled();}
 });
 function sync(focus=-1){
  dates();
  const rows=[...list.querySelectorAll('.homework-item-text')].map(input=>input.value.trim()).filter(Boolean);
  internal=true;source.value=rows.join('\n');last=source.value;storeRefs();source.dispatchEvent(new Event('input',{bubbles:true}));internal=false;
  if(focus>=0)list.querySelectorAll('.homework-item-text')[focus]?.focus();
 }
 function render(focus=-1){
  const rows=values(source);last=source.value;let existing=[];try{existing=JSON.parse(source.dataset.homeworkTaskRefs||'[]');}catch{}const ids=new Map(existing.map(ref=>[ref.text,ref.id]));
  list.innerHTML=rows.map((value,index)=>`<div class="homework-item-row" data-homework-id="${esc(ids.get(value)||identity())}"><input class="homework-item-check" type="checkbox" tabindex="-1" aria-hidden="true" disabled><input class="homework-item-text" type="text" value="${esc(value)}" placeholder="宿題 ${index+1}" aria-label="宿題 ${index+1}"><button type="button" class="homework-item-remove" aria-label="宿題 ${index+1}を削除">削除</button></div>`).join('');
  dates(existing);storeRefs();updateDisabled();if(focus>=0)list.querySelectorAll('.homework-item-text')[focus]?.focus();
 }
 function updateDisabled(){const off=disabled();root.classList.toggle('is-disabled',off);root.querySelectorAll('.homework-item-text,.homework-item-due,.homework-item-due-time,.homework-item-add,.homework-item-remove,.homework-item-upload,.homework-item-file').forEach(control=>control.disabled=off||!!control.dataset.busy||(control.matches('.homework-item-due-time')&&!control.closest('.homework-item-row').querySelector('.homework-item-due').value));root.classList.toggle('group-field-missing',source.classList.contains('group-field-missing'));}
 root.addEventListener('input',event=>{if(event.target.matches('.homework-item-due')&&!event.target.value)event.target.closest('.homework-item-row').querySelector('.homework-item-due-time').value='';if(event.target.matches('.homework-item-text,.homework-item-due,.homework-item-due-time')){sync();updateDisabled();}});
 root.addEventListener('keydown',event=>{if(event.target.matches('.homework-item-text')&&event.key==='Enter'){event.preventDefault();const rows=[...list.querySelectorAll('.homework-item-text')],index=rows.indexOf(event.target);const row=document.createElement('div');row.className='homework-item-row';row.innerHTML=`<input class="homework-item-check" type="checkbox" tabindex="-1" aria-hidden="true" disabled><input class="homework-item-text" type="text" placeholder="宿題 ${index+2}" aria-label="宿題 ${index+2}"><button type="button" class="homework-item-remove" aria-label="宿題を削除">削除</button>`;rows[index].closest('.homework-item-row').insertAdjacentElement('afterend',row);sync(index+1);}});
 root.addEventListener('click',event=>{if(event.target.matches('.homework-item-add')){const row=document.createElement('div');row.className='homework-item-row';row.innerHTML='<input class="homework-item-check" type="checkbox" tabindex="-1" aria-hidden="true" disabled><input class="homework-item-text" type="text" placeholder="新しい宿題" aria-label="新しい宿題"><button type="button" class="homework-item-remove" aria-label="宿題を削除">削除</button>';list.append(row);sync(list.children.length-1);}if(event.target.matches('.homework-item-remove')){const row=event.target.closest('.homework-item-row'),index=[...list.children].indexOf(row);row.remove();if(!list.children.length){sync();render(0);}else sync(Math.max(0,index-1));}});
 source.addEventListener('input',()=>{if(!internal&&source.value!==last)render(0);});
 const api={source,root,render,updateDisabled,checkExternal:()=>{if(source.value!==last||(source.dataset.homeworkTaskRefs||'')!==lastRefs)render();},refs:()=>{if(source.value!==last)render();return refs();},focus:()=>root.querySelector('.homework-item-text')?.focus()};source._homeworkItems=api;render();return api;
}
function scan(root=document){root.querySelectorAll?.(selector).forEach(mount);}
new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1){if(node.matches?.(selector))mount(node);scan(node);}}).observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>document.querySelectorAll(selector).forEach(source=>{const editor=mount(source);editor.checkExternal();editor.updateDisabled();}),500);
function focus(source){mount(source).focus();}
window.HomeworkItemEditor={mount,scan,focus,bind:(source,record,kind)=>{if(!source)return;for(const ref of record?.homeworkTaskRefs?.[kind]||[])if(ref.attachments)materialCache.set(ref.id,ref.attachments);source.dataset.homeworkTaskRefs=JSON.stringify(record?.homeworkTaskRefs?.[kind]||[]);mount(source).render();},refs:fields=>Object.fromEntries(Object.entries(fields).filter(([,source])=>source).map(([kind,source])=>[kind,mount(source).refs()]))};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>scan());else scan();
})();
