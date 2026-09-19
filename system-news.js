(()=>{'use strict';
const $=id=>document.getElementById(id),esc=Workspace.esc;
const audiences={teachers:'講師全員',students:'全生徒',everyone:'講師・全生徒',admin:'管理者のみ',selected_students:'指定した生徒宛て'},colors={blue:'青',green:'緑',amber:'黄',rose:'赤',purple:'紫',slate:'グレー'};
let articles=[],canManage=false,readerKind='device',limit=12,current=null,detailBusy=false,editing=null,editorBusy=false,dirty=false,requestId='';
const studentEntry=new URLSearchParams(location.search).get('from')==='student_schedule';
let studentContext=new URLSearchParams(location.search).get('student')||(!studentEntry?sessionStorage.getItem('newsStudent'):'')||'';
const token=()=>[...crypto.getRandomValues(new Uint8Array(16))].map(n=>n.toString(16).padStart(2,'0')).join('');
const date=v=>v?new Date(v.length===10?v+'T12:00:00+09:00':v).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'numeric',day:'numeric',weekday:'short',...(v.length>10?{hour:'2-digit',minute:'2-digit'}:{})}):'';
function message(text,error=false){$('newsMessage').textContent=text;$('newsMessage').classList.toggle('error',error);}
async function request(params='',payload){
 const query=new URLSearchParams(params.replace(/^\?/,''));if(studentEntry)query.set('studentView','1');if(studentContext)query.set('student',studentContext);if($('newsIncludeExpired')?.checked)query.set('includeExpired','1');
 let r,body;try{r=await fetch('system_news_api.php?'+query,payload?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,student:studentContext,...(studentEntry?{studentView:'1'}:{})})}:{cache:'no-store'});body=await r.text();}catch(e){throw Error('通信に失敗しました。入力内容は残しています。接続を確認して再度お試しください。（NEWS_NETWORK）');}
 let j;try{j=JSON.parse(body);}catch(e){throw Error('正常な応答が返りませんでした。入力内容を控えて一覧を確認してください。（NEWS_HTTP_'+r.status+'）');}
 if(!r.ok||!j||j.ok!==true)throw Error(j?.error||'処理を完了できませんでした。');return j;
}
function tags(r){return `<span class="news-tag">${esc(audiences[r.audience]||'')}</span><span class="news-tag subtle">${r.kind==='update'?'システム更新':'案内・お知らせ'}</span>${!r.published?'<span class="news-tag draft">非公開</span>':''}${r.visibleUntil?`<span class="news-tag ${r.expired?'draft':'subtle'}">${r.expired?'掲載終了':'表示期限：'+esc(r.visibleUntil)}</span>`:''}${r.audience==='selected_students'&&r.targetStudents?.length?`<span class="news-tag subtle">${esc(r.targetStudents.join('・'))}</span>`:''}`;}
function counts(r){return `講師 ${r.counts.staff}人・生徒 ${r.counts.device}端末が確認`;}
function render(){
 const q=$('newsSearch').value.trim().toLocaleLowerCase(),kind=$('newsKind').value,audience=$('newsAudience').value;
 const today=new Date(Date.now()+9*3600000).toISOString().slice(0,10);articles.forEach(r=>r.expired=!!r.visibleUntil&&r.visibleUntil<today);
 const filtered=articles.filter(r=>(r.published||(canManage&&$('newsIncludeHidden').checked))&&(!r.expired||(canManage&&$('newsIncludeExpired').checked))&&(!kind||r.kind===kind)&&(!audience||r.audience===audience)&&(!q||(r.title+' '+r.preview).toLocaleLowerCase().includes(q)));
 $('newsCount').textContent=`${filtered.length}件の記事 ／ 未読 ${filtered.filter(r=>!r.read).length}件${readerKind==='device'?' ／ 生徒向けに公開されている記事を表示しています。':''}`;
 $('newsList').innerHTML=filtered.slice(0,limit).map(r=>`<article class="news-card ${r.read?'':'is-unread'}" data-color="${esc(r.color)}" data-news-id="${esc(r.id)}"><button type="button" class="news-open" data-news-open="${esc(r.id)}" aria-label="${esc(r.title)}の詳細を読む"><div class="news-card-meta">${tags(r)}<time>${esc(date(r.createdAt))}</time></div><h2>${r.read?'':'<span class="news-unread-dot" aria-label="未読"></span>'}${esc(r.title)}</h2><p class="news-preview">${esc(r.preview)}</p><div class="news-card-bottom"><span>${esc(r.author||'')}</span><span class="news-reading ${r.seen?'is-seen':''}">${r.read?'既読':'未読'}${r.seen?' ／ ✓ みました':''}　<span class="news-more-link">続きを読む →</span></span></div></button>${canManage?`<div class="news-card-admin"><button type="button" class="ws-button" data-news-edit="${esc(r.id)}">${r.builtin?'公開先・色を変更':'記事を編集'}</button><button type="button" class="ws-button" data-news-visible="${esc(r.id)}" aria-pressed="${r.published}">${r.published?'表示 ON → 非表示':'表示 OFF → 再表示'}</button><small>${esc(counts(r))}</small></div>`:''}</article>`).join('')||'<p class="news-empty">公開中の記事がないか、条件に合う記事がありません。</p>';
 $('newsMore').hidden=filtered.length<=limit;
}
async function load(){
 $('newsReload').disabled=true;try{const j=await request();articles=j.articles;canManage=j.canManage&&!studentEntry;readerKind=j.readerKind;$('newsNew').hidden=$('newsAudienceField').hidden=$('newsExpiredField').hidden=$('newsHiddenField').hidden=!canManage;render();message('');return true;}catch(e){message(e.message,true);return false;}finally{$('newsReload').disabled=false;}
}
function detailShell(){
 $('newsDetail').innerHTML='<div class="news-dialog-head"><h2 id="newsDetailTitle">記事を読み込み中…</h2><button type="button" id="newsDetailClose" class="ws-button">閉じる</button></div><div class="news-dialog-body" id="newsDetailBody"></div><div class="news-dialog-foot"><span id="newsDetailMessage" role="status"></span><button type="button" id="newsSeen" class="ws-button primary" disabled>みました</button></div>';
 $('newsDetailClose').onclick=()=>{if(!detailBusy)$('newsDetail').close();};$('newsSeen').onclick=seen;
}
function drawDetail(r){
 current=r;$('newsDetailTitle').textContent=r.title;$('newsDetail').dataset.color=r.color;
 const body=r.builtin?r.bodyHtml:`<div class="news-plain-body">${esc(r.body)}</div>`;
 $('newsDetailBody').innerHTML=`<div class="news-detail-meta">${tags(r)}<time>${esc(date(r.createdAt))}</time><span>${esc(r.author||'')}</span></div><div class="news-article-body">${body}</div>${r.updatedAt!==r.createdAt?`<p class="news-update-time">更新：${esc(date(r.updatedAt))}</p>`:''}<div class="news-read-info"><p>${esc(counts(r))}</p>${readerKind==='device'?'<small>「みました」はこのブラウザーでの確認です。生徒名は記録しません。</small>':''}${r.seenAt?`<p>あなたの確認：${esc(date(r.seenAt))}</p>`:''}${canManage?`<details class="news-reader-list"><summary>確認した講師を見る</summary>${r.readers?.length?r.readers.map(x=>`<p>${esc(x.name)} ／ ${esc(date(x.at))}</p>`).join(''):'<p>講師の確認はまだありません。</p>'}<small>生徒の確認数は端末単位です。人数とは異なります。</small></details>`:''}</div>`;
 $('newsSeen').textContent=r.seen?'✓ みました（押すと取り消し）':readerKind==='device'?'この端末で「みました」':'みました';$('newsSeen').setAttribute('aria-pressed',String(r.seen));$('newsSeen').disabled=!!r.expired;
}
async function openDetail(id){
 if(detailBusy)return;detailShell();if(!$('newsDetail').open)$('newsDetail').showModal();detailBusy=true;
 try{const j=await request('?id='+encodeURIComponent(id));drawDetail(j.article);try{if(!j.article.expired)await request('',{action:'open',id,version:j.article.version});j.article.read=true;const item=articles.find(r=>r.id===id);if(item)item.read=true;render();Workspace.refreshRequestNotices?.();}catch(err){$('newsDetailMessage').textContent='本文は表示できましたが、既読の記録に失敗しました。'+err.message;}}catch(e){$('newsDetailMessage').textContent=e.message;}finally{detailBusy=false;}
}
async function seen(){
 if(!current||detailBusy)return;detailBusy=true;$('newsSeen').disabled=true;$('newsDetailMessage').textContent='確認を記録中…';
 try{await request('',{action:'seen',id:current.id,version:current.version,seen:!current.seen});const j=await request('?id='+encodeURIComponent(current.id));drawDetail(j.article);await load();$('newsDetailMessage').textContent=j.article.seen?'確認を記録しました。':'確認を取り消しました。';}catch(e){$('newsDetailMessage').textContent=e.message;}finally{detailBusy=false;$('newsSeen').disabled=!!current?.expired;}
}
const options=(values,value)=>Object.entries(values).map(([v,label])=>`<option value="${v}" ${v===value?'selected':''}>${esc(label)}</option>`).join('');
function closeEditor(){if(editorBusy)return;if(dirty&&!confirm('入力中の内容を保存せずに閉じますか？'))return;$('newsEditor').close();dirty=false;}
function editorMessage(text){$('newsEditorMessage').textContent=text;}
function lockEditor(on){editorBusy=on;$('newsEditor').querySelectorAll('button,input,select,textarea').forEach(e=>e.disabled=on);}
async function openEditor(id=''){
 if(!canManage||editorBusy)return;editing=null;dirty=false;requestId=token();$('newsEditor').innerHTML='<div class="news-dialog-head"><h2 id="newsEditorTitle">読み込み中…</h2><button type="button" id="newsEditorClose" class="ws-button">閉じる</button></div><div class="news-dialog-body"><form id="newsForm" class="news-form"></form></div><div class="news-dialog-foot"><span id="newsEditorMessage" role="status"></span><button type="submit" form="newsForm" id="newsSave" class="ws-button primary">保存</button></div>';$('newsEditorClose').onclick=closeEditor;$('newsEditor').showModal();lockEditor(true);
 try{
  await Workspace.ready;
  const r=id?(await request('?id='+encodeURIComponent(id))).article:{title:'',body:'',audience:'teachers',color:'blue',published:true,builtin:false};editing=r;
  $('newsEditorTitle').textContent=r.builtin?'記事の公開先・色を変更':id?'記事を編集':'案内・お知らせを投稿';
  $('newsForm').innerHTML=`${r.builtin?'<p class="news-form-help">更新履歴は最初は管理者のみが閲覧できます。内容を確認し、必要に応じて公開先を変更してください。記事を読むだけでは公開先は変わりません。</p>':''}${r.builtin?`<p class="news-edit-title">${esc(r.title)}</p>`:`<label>見出し<input name="title" maxlength="200" required value="${esc(r.title)}"></label><label>本文<textarea name="body" maxlength="20000" rows="9" required>${esc(r.body)}</textarea></label>`}<div class="news-form-grid"><label>公開先<select name="audience">${options(audiences,r.audience)}</select></label><label>カードの色<select name="color">${options(colors,r.color)}</select></label></div><label>表示終了日（空欄なら期限なし）<input name="visibleUntil" type="date" value="${esc(r.visibleUntil||'')}"><small>指定した日の23:59まで表示します。翌日から通常の一覧に表示されません。</small></label><fieldset id="newsTargetStudents" ${r.audience==='selected_students'?'':'hidden'}><legend>対象の生徒（複数選択可）</legend><input type="search" id="newsTargetSearch" placeholder="生徒名で絞り込み" aria-label="対象の生徒を検索"><div id="newsTargetList">${[...new Set([...Workspace.students.map(s=>s['生徒名']).filter(Boolean),...(r.targetStudents||[])])].sort((a,b)=>a.localeCompare(b,'ja')).map(name=>`<label class="news-target-option"><input type="checkbox" name="targetStudent" value="${esc(name)}" ${(r.targetStudents||[]).includes(name)?'checked':''}><span>${esc(name)}</span></label>`).join('')}</div></fieldset><div id="newsColorPreview" class="news-color-preview" data-color="${esc(r.color)}">カード色のプレビュー　<span id="newsTargetPreview">${esc(audiences[r.audience])}</span></div><label class="news-publish"><input name="published" type="checkbox" ${r.published?'checked':''}>公開する（外すと非公開・下書き）</label><p class="news-form-help">「全生徒」「講師・全生徒」の記事は、生徒側からログインせずに閲覧できます。「指定した生徒宛て」は氏名を選択した画面に表示します。生徒本人のログインによる限定公開ではありません。講師も生徒向けの記事を確認できます。</p>`;
  $('newsForm').oninput=$('newsForm').onchange=()=>{dirty=true;$('newsColorPreview').dataset.color=$('newsForm').elements.color.value;$('newsTargetPreview').textContent=audiences[$('newsForm').elements.audience.value];$('newsTargetStudents').hidden=$('newsForm').elements.audience.value!=='selected_students';};
  $('newsTargetSearch').oninput=()=>{const q=$('newsTargetSearch').value.trim();$('newsTargetList').querySelectorAll('label').forEach(el=>el.hidden=!el.textContent.includes(q));};
  $('newsForm').onsubmit=save;
 }catch(e){editorMessage(e.message);lockEditor(false);$('newsSave').disabled=true;return;}finally{editorBusy=false;}
 lockEditor(false);$('newsForm').querySelector('input,select')?.focus();
}
async function save(e){
 e.preventDefault();if(editorBusy||!editing||!$('newsForm').reportValidity())return;const f=$('newsForm').elements,payload={action:'save',id:editing.id||'',version:editing.version||'',requestId,audience:f.audience.value,color:f.color.value,published:f.published.checked,visibleUntil:f.visibleUntil.value,targetStudents:[...$('newsTargetList').querySelectorAll('input:checked')].map(el=>el.value)};if(!editing.builtin){payload.title=f.title.value;payload.body=f.body.value;}
 lockEditor(true);editorMessage('保存中…');try{await request('',payload);dirty=false;$('newsEditor').close();await load();message(payload.published?'記事を保存しました。':'非公開で保存しました。');}catch(e){editorMessage(e.message);}finally{lockEditor(false);}
}
$('newsList').onclick=async e=>{const vis=e.target.closest('[data-news-visible]');if(vis){const r=articles.find(r=>r.id===vis.dataset.newsVisible);if(!r)return;vis.disabled=true;try{await request('',{action:'visibility',id:r.id,version:r.version,published:!r.published});await load();Workspace.refreshRequestNotices?.();}catch(err){message(err.message,true);vis.disabled=false;}return;}const edit=e.target.closest('[data-news-edit]'),open=e.target.closest('[data-news-open]');if(edit)openEditor(edit.dataset.newsEdit);else if(open)openDetail(open.dataset.newsOpen);};$('newsNew').onclick=()=>openEditor();$('newsReload').onclick=load;
for(const id of ['newsSearch','newsKind','newsAudience'])$(id).addEventListener(id==='newsSearch'?'input':'change',()=>{limit=12;render();});$('newsMore').onclick=()=>{limit+=12;render();};
$('newsDetail').oncancel=e=>{if(detailBusy)e.preventDefault();};$('newsEditor').oncancel=e=>{e.preventDefault();closeEditor();};
for(const id of ['newsDetail','newsEditor'])$(id).onclick=e=>{if(e.target!==$(id))return;const r=e.target.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)return;if(id==='newsEditor')closeEditor();else if(!detailBusy)$(id).close();};
window.addEventListener('beforeunload',e=>{if(dirty&&$('newsEditor').open){e.preventDefault();e.returnValue='';}});
if(studentEntry){$('newsStudentContext').hidden=true;document.body.classList.add('news-student-entry');document.querySelector('.news-heading h1').textContent='塾からのお知らせ';}
$('newsStudentName').value=studentContext;const chooseStudent=()=>{if(studentEntry)return;studentContext=$('newsStudentName').value.trim();sessionStorage.setItem('newsStudent',studentContext);$('newsStudentLabel').textContent=studentContext?studentContext+'さん宛てを含めて表示':'全生徒向けの記事を表示';Workspace.refreshRequestNotices?.();load();};$('newsStudentApply').onclick=chooseStudent;$('newsStudentName').onkeydown=e=>{if(e.key==='Enter')chooseStudent();};$('newsIncludeExpired').onchange=load;$('newsIncludeHidden').onchange=render;
function expireOpenArticles(){if(document.hidden)return;render();const today=new Date(Date.now()+9*3600000).toISOString().slice(0,10);if(!canManage&&current?.visibleUntil&&current.visibleUntil<today&&$('newsDetail').open){$('newsDetail').close();message('この記事は表示期限を過ぎました。');}}
setInterval(expireOpenArticles,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)expireOpenArticles();});
StaffAuth.ready.then(async()=>{if(await load()){const id=new URLSearchParams(location.search).get('id');if(id)openDetail(id);}}).catch(e=>message(e.message,true));
})();
