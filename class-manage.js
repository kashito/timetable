(()=>{
const $=id=>document.getElementById(id),esc=Workspace.esc;let classes=[],version='';
function message(text,error=false){$('classManageMessage').textContent=text;$('classManageMessage').classList.toggle('error',error);}
function render(){const q=$('classManageSearch').value.trim(),show=$('classManageHidden').checked;
 $('classManageList').innerHTML=classes.filter(c=>(show||!c.hidden)&&c.name.includes(q)).map(c=>`<article class="directory-row ${c.hidden?'is-hidden':''}"><div class="directory-info"><p class="directory-name">${esc(c.name)}${c.hidden?'<span class="directory-badge">選択肢で非表示</span>':''}</p><span class="ws-muted">参加生徒 ${new Set(Workspace.roster(c.name,Workspace.today()).map(r=>r['生徒名'])).size}人 / 授業予定 ${c.lessons}コマ</span></div><div class="directory-actions"><a class="ws-button" href="${Workspace.classLink(c.name)}">予定一覧</a><button class="ws-button" data-manage-class="${esc(c.name)}">参加生徒</button><button class="ws-button" data-class-action="rename" data-class-name="${esc(c.name)}">名前を変更</button><button class="ws-button" data-class-action="clone" data-class-name="${esc(c.name)}">複製して編集</button></div></article>`).join('')||'<p class="directory-empty">該当するクラスはいません。</p>';
}
async function reload(){await Workspace.refresh();const j=await Workspace.api('class_manage_api.php');classes=(j.classes||[]).sort((a,b)=>a.name.localeCompare(b.name,'ja'));version=j.version;render();}
async function edit(action,source){
 try{await reload();}catch(e){message(e.message,true);return;}
 const draftVersion=version,d=$('classEditDialog'),create=action==='create',clone=action==='clone',members=create||clone;let date=Workspace.today(),selected=new Set(create?[]:Workspace.roster(source,date).map(r=>r['生徒名'])),busy=false;
 const names=[...new Set(Workspace.students.map(r=>r['生徒名']).filter(n=>n&&!Workspace.hiddenStudent(n)))].sort((a,b)=>a.localeCompare(b,'ja'));
 d.innerHTML=`<div class="ws-dialog-inner"><div class="ws-dialog-head"><h2>${create?'新しいクラスを作成':clone?'複製して編集・追加':'クラス名を変更'}</h2><button class="ws-button" id="classEditCancel">キャンセル</button></div><div class="ws-dialog-body">${create?'':'<p>元のクラス：<b>'+esc(source)+'</b></p>'}<label class="ws-form">${members?'追加する':'新しい'}クラス名<input type="text" id="classEditName" value="${esc(create?'':clone?source+'（コピー）':source)}" maxlength="100"></label>${members?`<label class="ws-form">参加開始日<input id="classEditDate" type="date" value="${date}"></label><p class="ws-muted">${create?'参加生徒を選んでください。生徒を選ばずにクラスだけ作成することもできます。':date+'現在の参加生徒をコピーしました。チェックを外したり、生徒を追加してから保存できます。'}</p><div class="ws-controls"><input type="search" id="classEditSearch" aria-label="生徒名で検索" placeholder="生徒名で検索"></div><div id="classEditRoster" class="directory-roster"></div><div class="ws-controls"><input id="classEditNewMember" type="text" placeholder="新しい生徒名" aria-label="新しい生徒名"><button class="ws-button" id="classEditAddMember">候補に追加</button></div><p class="ws-muted">${create?'授業予定は、作成後にコマ生成から配置してください。':'授業予定・出席・カルテ・準備済み・固定状態は複製しません。'}</p>`:'<p class="ws-panel">このクラスのすべての授業予定と、過去の出席・カルテも新しいクラス名で表示します。記録の内容と授業日時は引き継ぎます。</p>'}</div><div class="ws-dialog-foot"><span id="classEditMessage" class="ws-message" role="status"></span><button id="classEditSave" class="ws-button primary">${create?'クラスを作成':clone?'編集した内容でクラスを追加':'クラス名を変更して保存'}</button></div></div>`;
 function roster(){if(!members)return;const q=$('classEditSearch').value;$('classEditRoster').innerHTML=names.filter(n=>n.includes(q)).map(n=>`<label class="ws-check"><input type="checkbox" data-draft-member="${esc(n)}" ${selected.has(n)?'checked':''}><span>${esc(n)}</span></label>`).join('')||'<p class="ws-muted">候補がありません。生徒名を追加できます。</p>';}
 $('classEditCancel').onclick=()=>{if(!busy)d.close();};d.oncancel=e=>{if(busy)e.preventDefault();};
 if(members){$('classEditSearch').oninput=roster;$('classEditRoster').onchange=e=>{const n=e.target.dataset.draftMember;if(n)e.target.checked?selected.add(n):selected.delete(n);};$('classEditDate').onchange=e=>date=e.target.value;$('classEditAddMember').onclick=()=>{const n=$('classEditNewMember').value.trim();if(!n)return;if(Workspace.hiddenStudent(n)){$('classEditMessage').textContent='この生徒は非表示です。生徒管理で表示に戻してから追加してください。';return;}if(!names.includes(n))names.push(n);selected.add(n);$('classEditNewMember').value='';$('classEditSearch').value='';roster();};roster();}
 $('classEditSave').onclick=async()=>{
  if(busy)return;const name=$('classEditName').value.trim();if(!name||name===source){$('classEditMessage').textContent=create?'クラス名を入力してください。':'元のクラスとは異なる名前を入力してください。';return;}
  busy=true;d.querySelectorAll('button,input').forEach(el=>el.disabled=true);$('classEditMessage').textContent='保存中…';
  try{await Workspace.api('class_manage_api.php',{action,sourceClass:source,name,version:draftVersion,...(members?{date,names:[...selected]}:{})});d.close();await reload();message(members?`${name}を追加しました。コマ生成で授業を配置できます。`:`${source}を${name}に変更しました。`);}
  catch(e){$('classEditMessage').textContent=e.message;$('classEditMessage').classList.add('error');}
  finally{busy=false;d.querySelectorAll('button,input').forEach(el=>el.disabled=false);}
 };
 d.showModal();$('classEditName').focus();$('classEditName').select();
}
$('classManageCreate').onclick=()=>edit('create','');
$('classManageSearch').oninput=render;$('classManageHidden').onchange=render;$('classManageReload').onclick=()=>reload().catch(e=>message(e.message,true));
$('classManageList').onclick=e=>{const b=e.target.closest('[data-class-action]');if(b)edit(b.dataset.classAction,b.dataset.className);};
document.addEventListener('roster-updated',()=>reload().catch(e=>message(e.message,true)));
StaffAuth.ready.then(async j=>{if(j.user?.role!=='admin'){message('クラス管理は管理者が操作します。',true);return;}$('classManagePanel').hidden=false;await reload();}).catch(e=>message(e.message,true));
})();
