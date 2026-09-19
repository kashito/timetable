(()=>{
const $=id=>document.getElementById(id),esc=Workspace.esc;let busy=false,pendingClass=null,hiddenClasses=null;
function message(text,error=false){$('studentManageMessage').textContent=text;$('studentManageMessage').classList.toggle('error',error);}
function membership(records,date){
 if(records.some(r=>Workspace.enrolled(r,date,true))){
  const optional=records.some(r=>StudentParticipation.freeAt(r,date));
  return records.some(r=>(r['免除期間']||[]).some(p=>(!p.from||p.from<=date)&&(!p.until||date<p.until)))?{status:'exempt',label:'免除',order:2,resumeLabel:optional?'自由参加':'参加中'}:optional?{status:'optional',label:'自由参加',order:1}:{status:'active',label:'参加中',order:0};
 }
 const next=records.flatMap(r=>r['在籍期間']||[]).filter(p=>p.from>date&&(!p.until||p.from<p.until)).map(p=>p.from).sort()[0];
 return next?{status:'upcoming',label:'参加予定',order:2,note:next+'から参加予定'}:{status:'ended',label:'参加終了',order:3};
}
function classTag(name,c){
 const text=`<span>${esc(c.name)}</span><span class="student-class-status">${pendingClass?.name===name&&pendingClass?.className===c.name?'保存中…':c.label}</span>`;
 if(!['active','optional','exempt'].includes(c.status))return `<a class="ws-tag student-class-tag" data-membership-status="${c.status}" href="${Workspace.classLink(c.name)}" title="${esc(c.name+'：'+(c.note||c.label))}">${text}</a>`;
 const action=c.status==='exempt'?(c.resumeLabel||'参加中')+'に戻す':'免除にする',label=`${name}の${c.name}：${c.label}。${c.status==='optional'?StudentParticipation.explanation:''}押すと今日から${action}`;
 return `<span class="student-class-chip"><button type="button" class="ws-tag student-class-tag" data-student-class-toggle="${esc(name)}" data-class-name="${esc(c.name)}" data-membership-status="${c.status}" aria-label="${esc(label)}" title="${esc(label)}" ${busy?'disabled':''}>${text}</button><a class="student-class-schedule" href="${Workspace.classLink(c.name)}" aria-label="${esc(c.name+'の予定を開く')}" title="${esc(c.name+'の予定を開く')}">↗</a></span>`;
}
function render(){
 if(hiddenClasses===null)return;
 const date=Workspace.today(),byName=new Map(),hidden=new Set(hiddenClasses.map(name=>Workspace.className(name)));
 for(const r of Workspace.students){const n=r['生徒名'],c=r['クラス'];if(!n)continue;if(!byName.has(n))byName.set(n,new Map());const classes=byName.get(n);if(c&&!hidden.has(Workspace.className(c))){if(!classes.has(c))classes.set(c,[]);classes.get(c).push(r);}}
 const q=$('studentManageSearch').value.trim(),show=$('studentManageHidden').checked;
 const rows=[...byName].sort(([a],[b])=>a.localeCompare(b,'ja')).filter(([n,classes])=>{const info=StudentProfiles.get(n);return (show||!Workspace.hiddenStudent(n))&&(!q||[n,...classes.keys(),info.registrationNumber,info.school,info.addressShort].some(v=>String(v||'').includes(q)));});
 $('studentManageCount').textContent=`${rows.length}人を表示 / 登録 ${byName.size}人（同じ生徒は1人にまとめて表示）`;
 $('studentMembershipHint').textContent=`${date}時点の参加クラスです。クラス名を押すと、今日から参加中・自由参加と免除を切り替えます。薄い表示は免除中、緑色は自由参加です。自由参加は「参加クラスの設定」から選べます。↗でクラスの予定を開きます。1コマだけの変更は「授業ごとの免除」を使ってください。`;
 $('studentManageList').innerHTML=rows.map(([n,classes])=>{
  const tags=[...classes].map(([name,records])=>({name,...membership(records,date)})).sort((a,b)=>a.name.localeCompare(b.name,'ja'));
  const info=StudentProfiles.get(n),details=[info.registrationNumber?'塾籍 '+info.registrationNumber:'',info.school?'学校 '+info.school:'',info.addressShort].filter(Boolean);
  return `<article class="directory-row ${Workspace.hiddenStudent(n)?'is-hidden':''}"><div class="directory-info"><div class="student-name-row"><p class="directory-name"><a class="student-name-link" href="student.html?v=20260914-r39&amp;name=${encodeURIComponent(n)}&amp;from=student_manage" title="${esc(n)}の縦型スケジュールを開く">${esc(n)}</a>${Workspace.hiddenStudent(n)?'<span class="directory-badge">非表示</span>':''}</p><div class="student-profile-summary">${details.map(s=>`<span>${esc(s)}</span>`).join('')}</div></div><div class="ws-tags">${tags.map(c=>classTag(n,c)).join('')}</div></div><div class="directory-actions"><button class="ws-button" data-student-profile="${esc(n)}" ${busy?'disabled':''}>生徒情報</button><button class="ws-button" data-student-memberships="${esc(n)}" ${busy?'disabled':''}>参加クラスの設定</button><button class="ws-button" data-student-priorities="${esc(n)}" ${busy?'disabled':''}>クラス優先度</button><button class="ws-button" data-student-lessons="${esc(n)}" ${busy?'disabled':''}>授業ごとの免除</button><button class="ws-button" data-student-visibility="${esc(n)}" ${busy?'disabled':''}>${Workspace.hiddenStudent(n)?'表示に戻す':'システム全体で非表示'}</button></div></article>`;
 }).join('')||'<p class="directory-empty">該当する生徒はいません。</p>';
}
async function reload(){try{const [,,visibility]=await Promise.all([Workspace.refresh(),StudentProfiles.refresh(),Workspace.api('lesson_visibility_api.php')]);if(!Array.isArray(visibility.hidden))throw new Error('授業の表示設定を読み込めませんでした。再読み込みしてください。');hiddenClasses=visibility.hidden;render();message('');}catch(e){message(e.message,true);}}
async function toggleClass(button){
 if(busy||StaffAuth.user?.role!=='admin')return;
 const name=button.dataset.studentClassToggle,className=button.dataset.className,expected=button.dataset.membershipStatus,date=Workspace.today();
 busy=true;pendingClass={name,className};render();message('保存中…');let saved=false;
 try{
  const data=await Workspace.api('student_manage_api.php?action=memberships&name='+encodeURIComponent(name));
  const state=membership(data.rows.filter(r=>r['クラス']===className),date);
  if(state.status!==expected)throw new Error('参加状態が更新されました。表示を確認して、もう一度押してください。');
  const exempt=expected!=='exempt';
  await Workspace.api('student_manage_api.php',{action:'class_exemption',name,className,date,version:data.version,exempt});saved=true;
  await Workspace.refresh();const after=membership(Workspace.students.filter(r=>r['生徒名']===name&&r['クラス']===className),date);message(`${name}の${className}を今日から${exempt?'免除にしました。もう一度押すと'+after.resumeLabel+'に戻せます。':after.label+'に戻しました。'}`);
 }catch(e){message(saved?'保存しましたが表示を更新できませんでした。「再読み込み」を押してください。':e.message,true);if(!saved)try{await Workspace.refresh();}catch(_){} }
 finally{busy=false;pendingClass=null;render();if(document.activeElement===document.body)[...$('studentManageList').querySelectorAll('[data-student-class-toggle]')].find(b=>b.dataset.studentClassToggle===name&&b.dataset.className===className)?.focus({preventScroll:true});}
}
document.addEventListener('student-management-updated',render);
document.addEventListener('student-profiles-updated',render);
const preset=new URLSearchParams(location.search);if(preset.get('student'))$('studentManageSearch').value=preset.get('student');if(preset.get('hidden')==='1')$('studentManageHidden').checked=true;
$('studentManageSearch').oninput=render;$('studentManageHidden').onchange=render;$('studentManageReload').onclick=reload;
$('studentManageList').onclick=async e=>{const toggle=e.target.closest('[data-student-class-toggle]');if(toggle){await toggleClass(toggle);return;}const b=e.target.closest('[data-student-visibility]');if(!b||busy)return;const name=b.dataset.studentVisibility,hidden=!Workspace.hiddenStudent(name);busy=true;render();message('保存中…');try{await Workspace.api('class_members_api.php',{action:'visibility',name,hidden});await Workspace.refresh();message(`${name}を${hidden?'システム全体で非表示にしました。':'表示に戻しました。'}`);}catch(err){message(err.message,true);}finally{busy=false;render();}};
StaffAuth.ready.then(async j=>{if(j.user?.role!=='admin'){message('生徒の表示・非表示は管理者が設定します。',true);return;}$('studentManagePanel').hidden=false;await reload();}).catch(e=>message(e.message,true));
})();
