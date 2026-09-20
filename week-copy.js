(()=>{
'use strict';
const dateLabel=value=>value?new Date(value+'T12:00:00+09:00').toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short',timeZone:'Asia/Tokyo'}):'';
window.WeekCopy={open:async(from,to)=>{
 let d=document.getElementById('weekCopyDialog');
 if(!d){d=document.createElement('dialog');d.id='weekCopyDialog';d.className='ws-dialog';document.body.appendChild(d);}
 if(d.open)return;
 let plan=null,busy=false,generation=0;
 d.innerHTML=`<div class="ws-dialog-inner"><div class="ws-dialog-head"><h2>日付を指定して予定をコピー</h2><button id="weekCopyClose" class="ws-button">閉じる</button></div><div class="ws-dialog-body">
 <div class="ws-form"><label>コピー元の日付<input type="date" id="weekCopyFrom" value="${Workspace.esc(Workspace.iso(from))}"><small id="weekCopyFromLabel"></small></label><label>コピー先の日付<input type="date" id="weekCopyTo" value="${Workspace.esc(Workspace.iso(to))}"><small id="weekCopyToLabel"></small></label></div>
 <button id="weekCopyPreview" class="ws-button" type="button">この日付の予定を確認</button><p id="weekCopySummary" class="ws-panel" role="status"></p>
 <div class="ws-form"><label class="ws-check"><input type="radio" name="weekCopyMode" value="empty" checked>空き枠にだけ追加する</label><small class="ws-muted">作成済みの予定を残し、同じ教室が埋まっている枠は飛ばします。PC教室は複数配置できます。</small><label class="ws-check"><input type="radio" name="weekCopyMode" value="append">作成済みを残して追加する</label><small class="ws-muted">同じ内容の授業は飛ばし、同じ教室の同時利用は確認します。</small><label class="ws-check"><input type="radio" name="weekCopyMode" value="replace">確定済み以外をコピー元の内容で組み直す</label><small class="ws-muted">コピー先の確定していない予定を取り消してコピーします。過去のカルテ・出席は残し、確定済みの予定とその連結コマは維持します。</small></div>
 <p class="ws-muted">コピー元の予定は変更しません。連結は全コマをコピーできる場合に再現し、食事休憩も引き継ぎます。出席・カルテ・準備・確定はコピーしません。</p>
 </div><div class="ws-dialog-foot"><span id="weekCopyMessage" class="ws-message" role="status"></span><button id="weekCopyRun" class="ws-button primary" disabled>この方式でコピーする</button></div></div>`;
 const $=id=>d.querySelector('#'+id);
 function labels(){for(const id of ['weekCopyFrom','weekCopyTo'])$(id+'Label').textContent=dateLabel($(id).value);}
 function invalidate(){generation++;plan=null;labels();$('weekCopyRun').disabled=true;$('weekCopySummary').textContent='日付を変更しました。「この日付の予定を確認」を押してください。';$('weekCopyMessage').textContent='';}
 async function preview(){
  if(busy)return;
  const serial=++generation,from=$('weekCopyFrom').value,to=$('weekCopyTo').value;plan=null;labels();$('weekCopyRun').disabled=true;$('weekCopyMessage').textContent='';
  if(!from||!to||from===to){$('weekCopySummary').textContent='コピー元とコピー先に、異なる日付を指定してください。';return;}
  $('weekCopySummary').textContent='予定を確認しています…';
  try{
   const j=await Workspace.api('week_copy_api.php?'+new URLSearchParams({from,to}));
   if(serial!==generation||!d.open)return;
   plan={from,to,version:j.version,requestId:crypto.randomUUID(),sourceCount:j.sourceCount,targetCount:j.targetCount,fixedPreserved:j.fixedPreserved};
   $('weekCopySummary').textContent=`${dateLabel(from)}の ${j.sourceCount}コマ → ${dateLabel(to)}。コピー先は ${j.targetCount}コマ（確定・連結により保持する ${j.fixedPreserved}コマ）。`;
   $('weekCopyRun').disabled=false;
  }catch(err){if(serial===generation&&d.open)$('weekCopySummary').textContent=err.message;}
 }
 for(const id of ['weekCopyFrom','weekCopyTo'])$(id).addEventListener('input',invalidate);
 $('weekCopyPreview').onclick=preview;
 $('weekCopyClose').onclick=()=>{if(!busy){generation++;d.close();}};
 d.oncancel=e=>{if(busy)e.preventDefault();else generation++;};
 $('weekCopyRun').onclick=async()=>{
  if(busy||!plan)return;
  if(plan.from!==$('weekCopyFrom').value||plan.to!==$('weekCopyTo').value){invalidate();return;}
  const draft=plan,mode=d.querySelector('[name=weekCopyMode]:checked').value;
  if(mode==='replace'&&!confirm(`${dateLabel(draft.to)}の確定していない ${draft.targetCount-draft.fixedPreserved}コマを取り消して、${dateLabel(draft.from)}の内容で組み直します。実行しますか？`))return;
  busy=true;d.querySelectorAll('button,input').forEach(el=>el.disabled=true);$('weekCopyMessage').textContent='コピーしています…';
  let result;
  try{result=await Workspace.api('week_copy_api.php',{from:draft.from,to:draft.to,mode,version:draft.version,requestId:draft.requestId});}
  catch(err){$('weekCopyMessage').textContent=err.message;}
  finally{busy=false;d.querySelectorAll('button,input').forEach(el=>el.disabled=false);}
  if(!result)return;
  // Saving succeeded. A later refresh failure must never invite a second copy.
  generation++;plan=null;$('weekCopyRun').disabled=true;d.close();
  const status=document.getElementById('status'),summary=`${dateLabel(draft.to)}へ ${result.copied}件コピー・${result.skipped}件スキップ・${result.removed}件取消（確定・連結 ${result.fixedPreserved}件を維持）`;
  try{await LessonGroups.refresh();await Generator.reload();if(!window.DayCompare?.active)window.HistoryWindow?.goTo(draft.to);if(status)status.textContent=summary;}
  catch(err){if(status)status.textContent=summary+'。保存済みですが、表示の更新に失敗しました。画面を再読み込みしてください。';}
 };
 d.showModal();labels();await preview();
}};
})();
