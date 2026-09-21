(()=>{
  const list=document.getElementById('generatorAttendanceList');
  if(list)new MutationObserver(()=>{
    const message=list.parentElement.querySelector('[data-attendance-bulk-message]');
    if(message)message.textContent='';
  }).observe(list,{childList:true});
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-all-present],[data-all-unknown]');
    if(!button)return;
    const unknown=button.hasAttribute('data-all-unknown'),value=unknown?'不明':'出席';
    const controls=[...document.querySelectorAll(unknown?button.dataset.allUnknown:button.dataset.allPresent)]
      .filter(select=>!select.disabled&&(!unknown||!select.value||select.value==='---')&&[...select.options].some(option=>option.value===value));
    for(const select of controls){
      select.value=value;
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
    const message=button.parentElement.querySelector('[data-attendance-bulk-message]');
    if(message)message.textContent=controls.length
      ? `${controls.length}人を${value}にしました。保存ボタンで確定してください。`
      : unknown?'未入力の生徒はいません。記録済みの出欠は変更していません。':'出席を選択できる生徒がいません。';
  });
})();
(()=>{
 const paramsFor=button=>{
  if(button.dataset.previousMode==='notice')return {key:button.dataset.previousKey||''};
  if(button.dataset.previousMode==='group')return {groupId:new URLSearchParams(location.search).get('id')||''};
  if(button.dataset.previousMode==='generator'){const r=window.Generator?.currentRow();return r?{key:Generator.eventKey(r),className:r['クラス']||'',date:r['日付']||'',slot:r['時間番号']||'',start:r['開始']||''}:{};}
  return {key:document.getElementById('teacherOpsModal')?.dataset.currentKey||''};
 };
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-copy-previous]');if(!button||button.disabled)return;
  const controls=[...document.querySelectorAll(button.dataset.copyPrevious)].filter(s=>!s.disabled),params=paramsFor(button),identity=JSON.stringify(params),values=controls.map(s=>s.value);
  let message=button.parentElement.querySelector('[data-previous-message]');if(!message){message=document.createElement('span');message.dataset.previousMessage='';message.className='ce-copy-message';message.setAttribute('role','status');button.parentElement.append(message);}
  if(!controls.length){message.textContent='出欠を入力できる生徒がいません。';return;}
  button.disabled=true;message.textContent='同じ日の前の授業を確認中…';
  try{
   const j=await Workspace.api('previous_attendance_api.php?'+new URLSearchParams(params));
   if(!button.isConnected||JSON.stringify(paramsFor(button))!==identity||controls.some((s,i)=>!s.isConnected||s.disabled||s.value!==values[i])){message.textContent='読み込み中に画面や出欠が変わったため、コピーを中止しました。';return;}
   if(!j.found){message.textContent=j.message;return;}
   let copied=0,skipped=0;for(const s of controls){const name=s.dataset.name||s.dataset.groupAttendance||s.dataset.attName,v=j.attendance[name];if(s.value==='免除'||s.dataset.currentExempt==='true'){skipped++;continue;}if(v&&[...s.options].some(o=>o.value===v)){s.value=v;s.dataset.autoExempt='false';s.dispatchEvent(new Event('change',{bubbles:true}));copied++;}}
   message.textContent=copied?`${j.source.date} ${j.source.slot}の出欠を${copied}人に反映しました。${skipped?'免除中の生徒は変更していません。':''}内容を確認して保存してください。`:`${j.source.slot}にコピーできる出欠記録がありません。出欠は変更していません。`;
  }catch(e){message.textContent=e.message+' 出欠は変更していません。';}finally{if(button.isConnected)button.disabled=false;}
 });
})();
