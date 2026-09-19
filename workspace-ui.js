(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=v=>String(v||'').replaceAll('/','-');
const today=()=>new Date().toLocaleDateString('sv-SE');
const hiddenAt=(name,date=today())=>!!directory.hiddenStudents?.[name]&&iso(date)>=(directory.hiddenStudentFrom?.[name]||today());
const enrolled=(r,date=today(),includeHidden=false)=>(includeHidden||!hiddenAt(r['生徒名'],date))&&(!Array.isArray(r['在籍期間'])||r['在籍期間'].some(p=>(!p.from||p.from<=iso(date))&&(!p.until||iso(date)<p.until)));
let directory={},students=[];
function exempt(name,cls,date,state={}){const value=state.attendance?.[name];if(value&&value!=='---')return value==='免除';if(typeof state.exemptionOverrides?.[name]==='boolean')return state.exemptionOverrides[name];return students.some(r=>r['生徒名']===name&&r['クラス']===className(cls)&&(r['免除期間']||[]).some(p=>(!p.from||p.from<=iso(date))&&(!p.until||iso(date)<p.until)));}
function className(name){const seen=new Set();while(directory.classNameAliases?.[name]&&!seen.has(name)){seen.add(name);name=directory.classNameAliases[name];}return name;}
async function api(url,payload){const r=await fetch(url,payload?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}:{cache:'no-store'});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'読込・保存に失敗しました');return j;}
async function refresh(){const j=await api('class_members_api.php');directory=j.directory||{};students=j.students||[];return j;}
window.Workspace={esc,iso,today,enrolled,api,refresh,className,exempt,get students(){return students;},get directory(){return directory;},hiddenStudent:name=>!!directory.hiddenStudents?.[name],hiddenAt,roster:(cls,date,includeHidden=false)=>students.filter(r=>r['クラス']===className(cls)&&r['生徒名']&&enrolled(r,date,includeHidden)),classLink:cls=>'class_schedule.html?class='+encodeURIComponent(className(cls))};
Workspace.ready=StaffAuth.ready.then(refresh).catch(e=>{console.warn(e);return {};});
Workspace.ready.then(()=>{const url=new URL(location.href),cls=url.searchParams.get('class');if(cls&&className(cls)!==cls){url.searchParams.set('class',className(cls));location.replace(url.href);}});
function safeReturn(){const fallback=StaffAuth.user?.role==='admin'?'schedule_generator.html':'teacher2026summer.html',p=sessionStorage.getItem('workspace.return')||fallback;if(StaffAuth.user?.role!=='admin'&&p.startsWith('schedule_generator.'))return fallback;return /^[a-zA-Z0-9_-]+\.html(?:\?.*)?$/.test(p)?p:fallback;}
let noticeLoading=false,noticeAgain=false,noticeTimer;
Workspace.refreshRequestNotices=async()=>{if(noticeLoading){noticeAgain=true;return;}noticeLoading=true;const user=StaffAuth.user;const set=(id,n,label)=>{const e=document.getElementById(id);if(e){e.textContent=n>99?'99+':n;e.hidden=!n;e.setAttribute('aria-label',label+' '+n+'件');}};
 try{const results=await Promise.allSettled([api('system_news_api.php'+(!user&&sessionStorage.getItem('newsStudent')?'?student='+encodeURIComponent(sessionStorage.getItem('newsStudent')):'')),user?api('student_contact_api.php?action=inbox&countOnly=1'):Promise.resolve({count:0}),user?api('staff_requests_api.php'):Promise.resolve({items:[]}),user?api('lesson_tasks_api.php?countOnly=1'):Promise.resolve({count:0}),user?api('incident_reports_api.php?countOnly=1'):Promise.resolve({unread:0}),user?api('shared_notes_api.php?inbox=1&countOnly=1'):Promise.resolve({unread:0,pending:0})]);
 const news=results[0],contact=results[1],requests=results[2],tasks=results[3],incidents=results[4],shared=results[5];if(shared.status==='fulfilled')set('todoNoticeCount',shared.value.pending,'担当の未完了TODO');if(tasks.status==='fulfilled')set('recordNoticeCount',tasks.value.count,'担当授業の未記入');if(incidents.status==='fulfilled')set('incidentNoticeCount',incidents.value.unread,'未読のトラブル・来客・預かり報告');if(news.status==='fulfilled'&&contact.status==='fulfilled'&&tasks.status==='fulfilled'&&requests.status==='fulfilled'&&shared.status==='fulfilled')set('newsNoticeCount',news.value.articles.filter(r=>r.published&&!r.expired&&!r.read).length+contact.value.count+tasks.value.count+requests.value.items.filter(r=>!r.done).length+shared.value.unread,'未読のお知らせ・共有メモ・担当授業の未記入');if(contact.status==='fulfilled'&&requests.status==='fulfilled')set('requestNoticeCount',contact.value.count+requests.value.items.filter(r=>!r.done&&r.kind==='ng_change').length,'未読連絡・勤務予定変更');
 }finally{noticeLoading=false;if(noticeAgain){noticeAgain=false;setTimeout(Workspace.refreshRequestNotices,200);}}};
window.addEventListener('focus',()=>Workspace.refreshRequestNotices());
window.addEventListener('pageshow',()=>Workspace.refreshRequestNotices());
document.addEventListener('lesson-recording-saved',()=>{clearTimeout(noticeTimer);noticeTimer=setTimeout(Workspace.refreshRequestNotices,350);});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)Workspace.refreshRequestNotices();});setInterval(()=>{if(!document.hidden)Workspace.refreshRequestNotices();},60000);
function nav(user){
 const page=StaffAuth.page;const student=page==='student.html',publicPage=student||page==='notices.html'||page==='system_updates.php'||page==='daily_board.html'||page==='room_board.html';
 const admin=user?.role==='admin',fullMenu=!!user&&(admin||!publicPage||page==='system_updates.php');
 document.body.classList.toggle('workspace-admin',admin);
 const links=fullMenu?[['teacher2026summer.html','全体時間割'],['teacher2026summer_vertical.html?teacher='+encodeURIComponent(user.name),'講師別'],['student.html','生徒別'],['lesson_records.html','カルテ'],['availability.html','勤務OK・NG']]:[['student.html','生徒一覧']];
 if(admin){links.unshift(['schedule_generator.html','コマ生成']);links.push(['class_manage.html','クラス管理'],['student_manage.html','生徒管理'],['payroll.html','給与'],['codex_memos.php','CODEXメモ一覧']);}
 links.push(['daily_board.html','今日の動き'],['room_board.html?mode=monitor','青教室の指示']);if(user)links.push(['presence.html','入退室'],['shared_todos.html','TODO'],['test_results.html','テスト結果'],['test_results.html?pending=1','テスト未報告']);
 links.push(['notices.html','学校行事・お知らせ']);if(user?.role==='admin')links.push(['school_events.php','学校・お知らせ管理']);
 if(user)links.push(['incident_reports.php','トラブル・来客']);links.push(['system_updates.php','更新履歴・お知らせ']);
 const n=document.createElement('nav');n.className='workspace-nav';n.setAttribute('aria-label','画面の切り替え');
 n.innerHTML=links.map(([url,label])=>`<a href="${esc(url)}" ${url.split('?')[0]===page?'aria-current="page"':''}>${label}${label==='TODO'?'<span id="todoNoticeCount" class="notice-count" hidden></span>':label==='カルテ'?'<span id="recordNoticeCount" class="notice-count" hidden></span>':label==='トラブル・来客'?'<span id="incidentNoticeCount" class="notice-count" hidden></span>':label==='連絡・要望'?'<span id="requestNoticeCount" class="notice-count" hidden></span>':label==='更新履歴・お知らせ'?'<span id="newsNoticeCount" class="notice-count" hidden></span>':''}</a>`).join('')+'<span class="nav-spacer"></span>'+(user?`<span class="nav-user">${esc(user.name)}でログイン中</span><a href="staff_account.html">アカウント</a><button type="button" id="staffLogout">ログアウト</button>`:'<a href="staff_login.html">先生のログイン</a>');
 document.body.prepend(n);n.querySelector('#staffLogout')?.addEventListener('click',async()=>{await StaffAuth.api({action:'logout'});location.assign('staff_login.html');});
 if(admin){const size=()=>document.body.style.setProperty('--workspace-nav-height',n.getBoundingClientRect().height+'px');size();new ResizeObserver(size).observe(n);}
 if(['schedule_generator.html','teacher2026summer.html','teacher2026summer_vertical.html'].includes(page))sessionStorage.setItem('workspace.return',page+location.search);
 else if(!publicPage){const a=document.createElement('a');a.href=safeReturn();a.textContent='← 一覧に戻る';a.className='ws-button';(document.querySelector('main')||document.body).prepend(a);}
 Workspace.refreshRequestNotices();
 if(user?.role!=='admin')document.querySelectorAll('[data-admin],#backupBtn').forEach(e=>e.hidden=true);
}
StaffAuth.ready.then(j=>{const run=()=>{if(j.user||/\/(student|notices|daily_board|room_board)\.html$/.test(location.pathname)||/\/system_updates\.php$/.test(location.pathname))nav(j.user);const v=document.querySelector('.viewer');if(v&&j.user){const span=document.createElement('span');span.textContent=j.user.name;v.appendChild(span);}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();});

document.addEventListener('click',e=>{const b=e.target.closest('[data-homework-none]');if(!b||b.disabled)return;const scope=b.closest('.editBox')||document;const target=scope.querySelector(b.dataset.homeworkNone);if(!target||target.disabled||target.readOnly)return;if(target.value.trim()&&target.value.trim()!=='宿題なし'&&!confirm('入力済みの宿題を「宿題なし」に置き換えますか？'))return;target.value='宿題なし';target.dispatchEvent(new Event('input',{bubbles:true}));target.focus();});
Workspace.openMembers=async cls=>{
 await Workspace.ready;await refresh();cls=className(cls);
 let d=document.getElementById('membersDialog');if(!d){d=document.createElement('dialog');d.id='membersDialog';d.className='ws-dialog';document.body.appendChild(d);}
 const admin=StaffAuth.user?.role==='admin';let date=today();let selected=new Set(Workspace.roster(cls,date,true).map(r=>r['生徒名']));
 const names=[...new Set(students.map(r=>r['生徒名']).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ja'));
 d.innerHTML=`<div class="ws-dialog-inner"><div class="ws-dialog-head"><h2>${esc(cls)}の参加生徒</h2><button class="ws-button" id="membersClose">閉じる</button></div><div class="ws-dialog-body"><p class="ws-muted">チェックで参加生徒を選びます。外した生徒も、適用日より前の出席・カルテは残ります。</p><div class="ws-controls"><label>適用日 <input id="membersDate" type="date" value="${date}"></label><input id="membersSearch" type="search" placeholder="生徒名で検索"><label class="ws-check"><input id="membersShowHidden" type="checkbox">非表示の生徒も表示</label></div><div id="membersList" class="ws-roster-list"></div>${admin?'<p class="ws-muted">生徒をシステム全体で非表示にする場合は <a href="student_manage.html">生徒管理</a> を開いてください。</p><div class="ws-controls"><input id="newMemberName" placeholder="新しい生徒名"><button id="addNewMember" class="ws-button">候補に追加</button></div>':''}</div><div class="ws-dialog-foot"><div id="membersMessage" class="ws-message" role="status"></div>${admin?'<button id="membersSave" class="ws-button primary">参加生徒を保存</button>':''}</div></div>`;
 function render(){const q=d.querySelector('#membersSearch').value;const show=d.querySelector('#membersShowHidden').checked;d.querySelector('#membersList').innerHTML=names.filter(n=>n.includes(q)&&(show||!Workspace.hiddenStudent(n)||selected.has(n))).map(n=>`<div><label class="ws-check"><input type="checkbox" data-member="${esc(n)}" ${selected.has(n)?'checked':''} ${!admin?'disabled':''}><span>${esc(n)}${Workspace.hiddenStudent(n)?'（非表示）':''}</span></label></div>`).join('');}
 d.querySelector('#membersSearch').oninput=render;d.querySelector('#membersShowHidden').onchange=render;d.querySelector('#membersClose').onclick=()=>d.close();
 d.querySelector('#membersDate').onchange=e=>{date=e.target.value;selected=new Set(Workspace.roster(cls,date,true).map(r=>r['生徒名']));render();};
 d.querySelector('#membersList').onchange=e=>{const n=e.target.dataset.member;if(n)e.target.checked?selected.add(n):selected.delete(n);};
 d.querySelector('#addNewMember')?.addEventListener('click',()=>{const el=d.querySelector('#newMemberName'),n=el.value.trim();if(!n)return;if(!names.includes(n))names.push(n);selected.add(n);el.value='';render();});
 d.querySelector('#membersSave')?.addEventListener('click',async e=>{e.target.disabled=true;try{await api('class_members_api.php',{action:'members',className:cls,names:[...selected],date});await refresh();if(window.Generator)await Generator.reload();d.close();document.dispatchEvent(new Event('roster-updated'));}catch(err){d.querySelector('#membersMessage').textContent=err.message;}finally{e.target.disabled=false;}});
 render();d.showModal();
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-manage-class]');if(b){e.preventDefault();Workspace.openMembers(b.dataset.manageClass);}});
})();
