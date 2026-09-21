(()=>{
const slots=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];
const ends=['14:10','15:00','15:50','16:40','17:30','18:20','19:10','20:00','20:50','21:40','22:30'];
let rows=[],state={},pending=[],limit=8,busy=false,saving=false,refreshAgain=false,revision=0;
const key=r=>[Workspace.iso(r['日付']),r['時間番号'],r['クラス'],r['担当講師'],r['種別'],String(r['科目']||'').split(/[,、，]/).map(s=>s.trim()).filter(Boolean).join('+')].join('|');
const roster=r=>Workspace.roster(r['クラス'],r['日付']).filter(s=>!Workspace.hiddenStudent(s['生徒名']));
function missing(r){const attendance=state[key(r)]?.attendance||{};return roster(r).filter(s=>(!attendance[s['生徒名']]||attendance[s['生徒名']]==='---')&&!Workspace.exempt(s['生徒名'],r['クラス'],r['日付'],state[key(r)]||{}));}
function box(){let b=document.getElementById('attendanceNotices');if(!b){b=document.createElement('section');b.id='attendanceNotices';b.className='ws-panel';document.querySelector('main').prepend(b);}return b;}
function render(){
 const b=box(),esc=Workspace.esc;const me=StaffAuth.user,now=Date.now();
 const open=!!b.querySelector('details')?.open,drafts=new Map();
 b.querySelectorAll('[data-notice-key]').forEach(card=>{const values=new Map();card.querySelectorAll('[data-att-name]').forEach(s=>{if(s.value!=='---')values.set(s.dataset.attName,s.value);});drafts.set(card.dataset.noticeKey,values);});
 pending=rows.filter(r=>{const teacher=r['担当講師']||'',end=r['終了']||ends[slots.indexOf(r['時間番号'])];return !r['日区分']&&end&&(teacher===me.name||(!teacher&&me.role==='admin'))&&Date.parse(Workspace.iso(r['日付'])+'T'+end+':00')<now&&missing(r).length;}).sort((a,b)=>(b['日付']+b['終了']).localeCompare(a['日付']+a['終了']));
 b.hidden=!pending.length;if(!pending.length){b.replaceChildren();return;}
 b.innerHTML=`<details><summary style="cursor:pointer;font-weight:700;color:#9a4f16">出席未入力 ${pending.length}コマ — 開いて入力</summary><p class="ws-muted">終了した自分の担当授業です。担当講師未設定の授業は管理者に表示します。</p>`+pending.slice(0,limit).map((r,i)=>`<div class="ws-card" data-notice-key="${esc(key(r))}"><b>${esc(r['日付'])} ${esc(r['時間番号'])} ${esc(r['クラス'])}</b><div class="attendance-bulk-actions"><button type="button" data-all-present='[data-att-row="${i}"]'>全員出席にする</button><button type="button" class="ce-copy-previous" data-previous-mode="notice" data-previous-key="${esc(key(r))}" data-copy-previous='[data-att-row="${i}"]'>前の授業と同じ出席</button><span data-attendance-bulk-message role="status"></span></div><p class="ws-muted">未入力の生徒だけに反映します。記録済みの出欠は変更しません。</p><div class="ws-controls" style="margin:10px 0">${missing(r).map(s=>`<label>${esc(s['生徒名'])} <select data-att-row="${i}" data-att-name="${esc(s['生徒名'])}">${['---','出席','遅刻','欠席','早退','免除','その他','不明','未定'].map(v=>`<option>${v}</option>`).join('')}</select></label>`).join('')}<button data-att-save="${i}">この授業の出席を保存</button></div><span role="status" data-att-msg="${i}"></span><div data-sc-missing-key="${esc(key(r))}"></div></div>`).join('')+(pending.length>limit?'<button class="ws-button" data-att-more>さらに8コマ表示</button>':'')+'</details>';
 b.querySelector('details').open=open;
 b.querySelectorAll('[data-notice-key]').forEach(card=>card.querySelectorAll('[data-att-name]').forEach(s=>{const value=drafts.get(card.dataset.noticeKey)?.get(s.dataset.attName);if(value)s.value=value;}));
 if(window.StaffContacts)b.querySelectorAll('[data-sc-missing-key]').forEach(root=>StaffContacts.mount(root,{keys:[root.dataset.scMissingKey]}));
}
async function refresh(){
 if(!StaffAuth.user)return;
 if(busy||saving){refreshAgain=true;return;}
 busy=true;const started=revision;
 try{
  await Workspace.refresh();const [data,states]=await Promise.all([Workspace.api('data_api.php'),Workspace.api('state_api.php')]);
  if(saving||started!==revision){refreshAgain=true;return;}
  rows=data.schedule||[];state=states.state||{};render();box().querySelector('[data-att-load-error]')?.remove();
 }catch(e){let message=box().querySelector('[data-att-load-error]');if(!message){message=document.createElement('p');message.dataset.attLoadError='';message.setAttribute('role','status');box().prepend(message);}box().hidden=false;message.textContent='出席通知を読み込めません：'+e.message;}
 finally{busy=false;if(refreshAgain&&!saving){refreshAgain=false;void refresh();}}
}
document.addEventListener('click',async e=>{
 const more=e.target.closest('[data-att-more]');if(more){if(saving)return;limit+=8;render();return;}
 const btn=e.target.closest('[data-att-save]');if(!btn||saving)return;
 const card=btn.closest('[data-notice-key]'),eventKey=card.dataset.noticeKey,controls=[...card.querySelectorAll('[data-att-name]')];
 const values=controls.filter(s=>s.value!=='---').map(s=>[s.dataset.attName,s.value]);
 const msg=card.querySelector('[role=status][data-att-msg]');
 if(!values.length){msg.textContent='出席状況を選んでください。';return;}
 saving=true;++revision;btn.disabled=true;controls.forEach(s=>s.disabled=true);msg.textContent='保存中…';
 try{
  const latest=await Workspace.api('state_api.php');const attendance={...(latest.state?.[eventKey]?.attendance||{}),...Object.fromEntries(values)};
  const saved=await Workspace.api('state_api.php',{eventKey,attendance,attendanceTouched:true});
  state[eventKey]=saved.state||{...latest.state?.[eventKey],attendance,attendanceTouched:true};
  ++revision;render();refreshAgain=true;document.dispatchEvent(new Event('lesson-recording-saved'));
 }catch(err){msg.textContent=err.message;}
 finally{saving=false;btn.disabled=false;controls.forEach(s=>s.disabled=false);if(refreshAgain){refreshAgain=false;void refresh();}}
});
StaffAuth.ready.then(async()=>{await Workspace.ready;await refresh();});
for(const event of ['roster-updated','student-contact-confirmed','lesson-state-changed','lesson-recording-saved'])document.addEventListener(event,refresh);
window.addEventListener('focus',refresh);window.addEventListener('pageshow',refresh);
window.AttendanceNotices={refresh};
})();
