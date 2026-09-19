(()=>{
let active=false;const esc=Workspace.esc;
async function show(sourceKey,target=null){
 if(active||StaffAuth.user?.role!=='admin')return null;active=true;
 let dialog=document.getElementById('lessonPlacementDialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='lessonPlacementDialog';dialog.className='ws-dialog';document.body.appendChild(dialog);}
 dialog.innerHTML=`<div class="ws-dialog-inner"><div class="ws-dialog-head"><h2>${target?'別の日へ移動・コピー':'次のコマへ複製'}</h2><button class="ws-button" data-placement-cancel>キャンセル</button></div><div class="ws-dialog-body" id="placementBody"></div><div class="ws-dialog-foot"><span id="placementMessage" class="ws-message" role="status">授業を確認中…</span><button class="ws-button" id="placementMove" ${target?'':'hidden'} disabled>移動する</button><button class="ws-button primary" id="placementCopy" disabled>${target?'コピーする':'複製する'}</button></div></div>`;
 let busy=false,resolve,data;const outcome=new Promise(r=>resolve=r),body=dialog.querySelector('#placementBody'),message=dialog.querySelector('#placementMessage'),copy=dialog.querySelector('#placementCopy'),move=dialog.querySelector('#placementMove');
 const pending=on=>{busy=on;dialog.querySelectorAll('button,input,select').forEach(e=>e.disabled=on);};
 const close=value=>{if(busy)return;dialog.close();active=false;resolve(value);};
 dialog.querySelector('[data-placement-cancel]').onclick=()=>close(null);dialog.oncancel=e=>{e.preventDefault();close(null);};dialog.showModal();pending(true);
 try{
  data=await Workspace.api('lesson_copy_api.php?sourceKey='+encodeURIComponent(sourceKey));const row=data.row;
  body.innerHTML=`<p><strong>${esc(row['クラス'])}</strong><br>${esc(Workspace.iso(row['日付']))} ${esc(row['時間番号'])} ／ ${esc(row['担当講師'])} ／ ${esc(row['教室']||'未設定')}</p>`;
  if(target){body.innerHTML+=`<p>移動・コピー先：<strong>${esc(target.date)} ${esc(target.slot)}</strong> ／ ${esc(target.room==='__OTHER__'?'未設定':target.room)}</p><p class="ws-muted">移動は元のコマと記録を移します。コピーは元を残して授業予定を追加します。コピー先の出欠・カルテ・準備済み・確定は未設定です。</p>${data.group?'<p class="ws-muted">このコマは連結中です。コピーはこの1コマが対象です。移動する場合は先に連結を解除してください。</p>':''}`;}
  else{
   const slots=Object.keys(data.slots),index=slots.indexOf(row['時間番号']),remaining=slots.slice(index+1);if(index<0||!remaining.length)throw new Error('この日の次のコマはありません。');
   body.innerHTML+=`<label class="ws-form">複製するコマ数<select id="placementCount">${remaining.map((s,i)=>`<option value="${i+1}">${i+1}コマ</option>`).join('')}</select></label><p id="placementPreview"></p><label class="ws-check"><input id="placementLink" type="checkbox">元の授業と複製したコマを連結する</label><label class="ws-form" id="placementMealField" hidden>途中の食事休憩<select id="placementMealBreak"><option value="0">なし</option><option value="1">あり（途中で食事休憩が入ります）</option></select></label><p class="ws-muted">連結すると出席・カルテ・報告や返信を1つの詳細で記録できます。給与は元のコマを含むコマ数分です。複製だけの場合、出欠・カルテ・準備済み・確定はコピーしません。</p>`;
   const preview=()=>{const n=Number(dialog.querySelector('#placementCount').value);dialog.querySelector('#placementPreview').textContent='複製先：'+remaining.slice(0,n).join('')+' ／ 連結する場合は合計'+(n+1)+'コマ分';};dialog.querySelector('#placementCount').onchange=preview;dialog.querySelector('#placementLink').onchange=()=>{dialog.querySelector('#placementMealField').hidden=!dialog.querySelector('#placementLink').checked;};preview();
  }
  pending(false);move.disabled=!!data.group;if(!target&&data.group){copy.disabled=true;throw new Error('連結済みです。連結を解除してから複製してください。');}message.textContent='';
 }catch(e){pending(false);move.disabled=copy.disabled=true;message.textContent=e.message;message.classList.add('error');return outcome;}
 move.onclick=()=>close({action:'move',row:data.row,version:data.version});
 let requestId='',signature='';
 copy.onclick=async()=>{
  if(busy)return;const row=data.row,slots=Object.keys(data.slots),count=target?1:Number(dialog.querySelector('#placementCount').value),targets=target?[target]:slots.slice(slots.indexOf(row['時間番号'])+1,slots.indexOf(row['時間番号'])+1+count).map(slot=>({date:Workspace.iso(row['日付']),slot,room:row['教室']||''}));
  const link=target?false:dialog.querySelector('#placementLink').checked,mealBreak=link&&dialog.querySelector('#placementMealBreak').value==='1',next=JSON.stringify({targets,link,mealBreak});if(next!==signature){signature=next;requestId=crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');}
  pending(true);message.classList.remove('error');message.textContent='複製を保存中…';
  try{const result=await Workspace.api('lesson_copy_api.php',{sourceKey,version:data.version,requestId,targets,link,mealBreak});pending(false);close({action:'copied',...result});}
  catch(e){message.textContent=e.message;message.classList.add('error');pending(false);move.disabled=!!data.group;}
 };
 return outcome;
}
window.LessonPlacement={drop:(source,target)=>show(source,target),next:source=>show(source)};
})();
