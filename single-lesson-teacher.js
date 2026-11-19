(()=>{'use strict';
function mount(modal,card,initialTeacher){
 const source=card.dataset.sourceKey,body=modal.querySelector('#opsBody');
 let teacher=initialTeacher,row=null,version='',changed=false,loadError=null;
 const section=document.createElement('section');section.className='ws-panel single-teacher-editor';
 const label=document.createElement('label');label.htmlFor='singleLessonTeacher';label.textContent='担当講師（このコマのみ）';label.style.fontWeight='bold';
 const select=document.createElement('select');select.id='singleLessonTeacher';select.setAttribute('aria-label',label.textContent);select.style.cssText='display:block;width:100%;min-height:44px;margin:8px 0;font:inherit';select.add(new Option(initialTeacher||'未設定',initialTeacher));select.disabled=true;
 const help=document.createElement('small');help.textContent=source?'講師を読み込み中…':'この予定の編集元を確認できないため、担当講師は変更できません。';section.append(label,select,help);body.prepend(section);
 const ready=source?Workspace.api('lesson_add_api.php?sourceKey='+encodeURIComponent(source)).then(j=>{
  if(!j.row||!j.sourceVersion)throw new Error('予定が見つかりません。詳細を開き直してください。');
  if(String(j.row['担当講師']||'')!==initialTeacher)throw new Error('担当講師が変更されました。時間割を再読み込みしてください。');
  row=j.row;version=j.sourceVersion;
  select.replaceChildren();for(const name of [...new Set(['',initialTeacher,...(j.teachers||[])])])select.add(new Option(name||'未設定',name));select.value=initialTeacher;select.disabled=false;
  help.textContent='「まとめて保存」でこの1コマだけ変更します。出欠・カルテ・資料は引き継ぎます。';
 }).catch(e=>{loadError=e;help.textContent='講師変更の読込失敗：'+e.message;}):Promise.resolve();
 return {get teacher(){return teacher;},get changed(){return changed;},async save(){
  await ready;if(select.value===teacher)return;
  if(loadError)throw loadError;if(!row)throw new Error('予定を開き直してください。');
  if(!version){
   const latest=await Workspace.api('lesson_add_api.php?sourceKey='+encodeURIComponent(source));
   const fields=['日付','クラス','種別','給与区分','担当講師','教室','時間番号','開始','終了','科目','備考'];
   if(!latest.row||!latest.sourceVersion||!fields.every(f=>String(latest.row[f]||'')===String(row[f]||'')))throw new Error('予定が変更されました。詳細を開き直してください。');
   row=latest.row;version=latest.sourceVersion;
  }
  const target=select.value,payload={action:'update',sourceKey:source,sourceVersion:version,row:{...row,'担当講師':target}};
  // Use the existing guarded move path, including note/attendance/file aliases.
  let j;
  try{j=await Workspace.api('lesson_add_api.php',payload);}catch(error){
   // A response can fail after the schedule was committed. Reconcile without replaying the move.
   let latest;try{latest=await Workspace.api('lesson_add_api.php?sourceKey='+encodeURIComponent(source));}catch(_){throw error;}
   const fields=['日付','クラス','種別','給与区分','担当講師','教室','時間番号','開始','終了','科目','備考'];
   if(!latest.row||!fields.every(f=>String(latest.row[f]||'')===String(payload.row[f]||'')))throw error;
   j=latest;
  }
  if(!j.row)throw new Error('担当講師の保存結果を確認できません。詳細を開き直してください。');
  row=j.row;teacher=String(row['担当講師']||'');changed=true;
  const subjects=String(row['科目']||'').split(/[,、，]/).map(v=>v.trim()).filter(Boolean).join('+');
  modal.dataset.currentKey=[String(row['日付']).replaceAll('/','-'),row['時間番号'],row['クラス'],teacher,row['種別'],subjects].join('|');
  // Fetch a fresh version only if another teacher change is requested.
  // A later record-save retry must not depend on another GET or repeat this move.
  version='';
 }};
}
window.SingleLessonTeacher={mount};
})();
