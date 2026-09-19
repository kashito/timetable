(()=>{
const $=id=>document.getElementById(id),esc=Workspace.esc;let opening=false;
async function open(name){
 if(opening||StaffAuth.user?.role!=='admin')return;opening=true;
 let d=$('studentPriorityDialog');if(!d){d=document.createElement('dialog');d.id='studentPriorityDialog';d.className='ws-dialog directory-dialog';document.body.appendChild(d);}
 d.innerHTML=`<div class="ws-dialog-inner"><div class="ws-dialog-head"><h2>${esc(name)}のクラス優先度</h2><button type="button" id="priorityClose" class="ws-button">閉じる</button></div><div class="ws-dialog-body"><p>この生徒の授業時間が重なったとき、<strong>数字の大きいクラス</strong>を生徒の予定表に表示します。同じ数字なら両方を表示します。</p><p class="ws-muted">例：英語を2、演習を1にすると、重なった時間は英語を優先します。保存後、過去を含め予定表全体に反映します。出欠の記録・参加期間・免除設定は変わりません。</p><div id="priorityRows"></div></div><div class="ws-dialog-foot"><span id="priorityMessage" class="ws-message" role="status"></span><button type="button" id="prioritySave" class="ws-button primary">優先度を保存</button></div></div>`;
 let busy=false,saved=false,initial=new Map(),version='';
 const inputs=()=>[...d.querySelectorAll('[data-class-priority]')];
 const dirty=()=>!saved&&inputs().some(e=>e.value!==initial.get(e.dataset.classPriority));
 function message(text,error=false){$('priorityMessage').textContent=text;$('priorityMessage').classList.toggle('error',error);}
 function pending(value){busy=value;d.querySelectorAll('button,input').forEach(e=>e.disabled=value);}
 function close(){if(busy)return;if(dirty()&&!confirm('優先度の変更を保存せずに閉じますか？'))return;d.close();}
 $('priorityClose').onclick=close;d.oncancel=e=>{e.preventDefault();close();};d.onclose=()=>{opening=false;};
 d.showModal();pending(true);message('読み込み中…');
 try{
  const [data,visibility]=await Promise.all([Workspace.api('student_manage_api.php?action=memberships&name='+encodeURIComponent(name)),Workspace.api('lesson_visibility_api.php')]);
  if(!Array.isArray(data.rows)||!Array.isArray(visibility.hidden))throw new Error('クラスを読み込めませんでした。開き直してください。');
  version=data.version;const hidden=new Set(visibility.hidden),classes=new Map(),date=Workspace.today();
  for(const r of data.rows){const c=r['クラス'];if(!c||hidden.has(c))continue;const current=classes.get(c)||{records:[]};current.records.push(r);current.priority=String(Number(r['優先度']||0)||0);classes.set(c,current);}
  $('priorityRows').innerHTML=[...classes].sort(([a],[b])=>a.localeCompare(b,'ja')).map(([c,value])=>{
   initial.set(c,value.priority);const active=value.records.some(r=>Workspace.enrolled(r,date,true));
   const exempt=value.records.some(r=>(r['免除期間']||[]).some(p=>(!p.from||p.from<=date)&&(!p.until||date<p.until)));
   const upcoming=value.records.some(r=>(r['在籍期間']||[]).some(p=>p.from>date&&(!p.until||p.from<p.until)));
   const status=active?(exempt?'免除中':value.records.some(r=>StudentParticipation.freeAt(r,date))?'自由参加':'参加中'):(upcoming?'参加予定':'参加終了');
   return `<label class="student-priority-row"><span><strong>${esc(c)}</strong><small>${status}</small></span><input type="number" step="1" required inputmode="numeric" data-class-priority="${esc(c)}" aria-label="${esc(c)}の優先度" value="${esc(value.priority)}"></label>`;
  }).join('')||'<p class="directory-empty">優先度を変更できるクラスはありません。</p>';
  pending(false);$('prioritySave').disabled=!classes.size;message('');
 }catch(e){pending(false);$('prioritySave').disabled=true;message(e.message,true);return;}
 $('prioritySave').onclick=async()=>{
  if(busy||saved)return;const changes=[];
  for(const e of inputs()){
   if(e.value===initial.get(e.dataset.classPriority))continue;
   if(e.value.trim()===''||!e.checkValidity()||!Number.isSafeInteger(Number(e.value))){message('優先度は整数で入力してください。',true);e.focus();return;}
   changes.push({className:e.dataset.classPriority,priority:String(Number(e.value))});
  }
  if(!changes.length){message('変更はありません。');return;}
  pending(true);message('保存中…');
  try{await Workspace.api('student_manage_api.php',{action:'priorities',name,version,changes});saved=true;await Workspace.refresh();document.dispatchEvent(new Event('student-management-updated'));d.close();$('studentManageMessage').textContent=name+'のクラス優先度を保存しました。';}
  catch(e){message(saved?'保存しましたが、一覧を更新できませんでした。閉じて「再読み込み」を押してください。':e.message,true);}
  finally{pending(false);if(saved)$('prioritySave').disabled=true;}
 };
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-student-priorities]');if(b&&!b.disabled)open(b.dataset.studentPriorities);});
})();
