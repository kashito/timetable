
(function(){
'use strict';

const FILE='schedule.xlsx';
const ROOMS=['','青','黄','白','ガラス','PC','自宅可','__OTHER__'];
const ROOM_LABEL={'':'未設定','青':'青','黄':'黄','白':'白','ガラス':'ガラス','PC':'PC','自宅可':'自宅可','__OTHER__':'その他'};
const SLOT_KEYS=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];
const SLOTS={'①':['13:30','14:10'],'②':['14:20','15:00'],'③':['15:10','15:50'],'④':['16:00','16:40'],'⑤':['16:50','17:30'],'⑥':['17:40','18:20'],'⑦':['18:30','19:10'],'⑧':['19:20','20:00'],'⑨':['20:10','20:50'],'⑩':['21:00','21:40'],'⑪':['21:50','22:30']};

let excelRows=[], addedRows=[], edits={}, allRows=[];
window.getCurrentScheduleRows=()=>allRows.map(r=>({date:r['日付'],teacher:r['担当講師'],slot:r['時間番号'],dayType:r['日区分']}));
let studentRows=[];
let hiddenClassNames=new Set();
let baseWorkbook=null;
let baseWorkbookName='schedule.xlsx';
let baseSheetName='時間割データ';
let draggedSourceKey='';
let generatorClassState={},generatorOpsLoaded=false;
const $=id=>document.getElementById(id);
function genHoliday(date){const iso=generatorDateToIso(date);return !!(window.SchoolHolidays&&SchoolHolidays.isHoliday(iso));}
function genHolidayControl(date){const iso=generatorDateToIso(date),on=genHoliday(date);return `<label class="school-holiday-toggle"><input type="checkbox" class="school-holiday-check" data-date="${esc(iso)}" ${on?'checked':''}><span>塾休み</span></label>`;}
function bindGeneratorHolidayChecks(){document.querySelectorAll('.school-holiday-check').forEach(el=>{el.onchange=async e=>{e.stopPropagation();const before=!el.checked;el.disabled=true;try{await SchoolHolidays.set(el.dataset.date,el.checked);render();}catch(err){el.checked=before;alert(err.message||'休講日を保存できませんでした');}finally{el.disabled=false;}};});}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function setTypeValue(value){
  const known=['授業','演習','補習','テスト','休み・キャンプ・OFF'];
  const v=String(value||'授業').trim()||'授業';
  if(known.includes(v)){
    $('fTypeSelect').value=v;
    $('fTypeCustom').value='';
    $('fTypeCustom').classList.add('hidden');
  }else{
    $('fTypeSelect').value='__CUSTOM__';
    $('fTypeCustom').value=v;
    $('fTypeCustom').classList.remove('hidden');
  }
}
function getTypeValue(){
  return $('fTypeSelect').value==='__CUSTOM__'
    ? String($('fTypeCustom').value||'').trim()
    : String($('fTypeSelect').value||'').trim();
}


function excelDate(v){
  if(v instanceof Date) return `${v.getFullYear()}/${String(v.getMonth()+1).padStart(2,'0')}/${String(v.getDate()).padStart(2,'0')}`;
  if(typeof v==='number'){
    const d=XLSX.SSF.parse_date_code(v);
    if(d) return `${d.y}/${String(d.m).padStart(2,'0')}/${String(d.d).padStart(2,'0')}`;
  }
  const s=String(v||'').trim().replaceAll('-','/');
  const m=s.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  return m?`${m[1]}/${m[2].padStart(2,'0')}/${m[3].padStart(2,'0')}`:s;
}


function isoToGeneratorDate(v){
  const m=String(v||'').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m?`${m[1]}/${m[2]}/${m[3]}`:String(v||'').trim();
}
function generatorDateToIso(v){
  const m=String(v||'').trim().match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  return m?`${m[1]}-${String(+m[2]).padStart(2,'0')}-${String(+m[3]).padStart(2,'0')}`:'';
}

function weekdayLabel(s){
  const d=dateObj(s);
  return d?['日','月','火','水','木','金','土'][d.getDay()]:'';
}
function dateObj(s){
  const m=String(s).match(/(\d{4})\/(\d{2})\/(\d{2})/);
  return m?new Date(+m[1],+m[2]-1,+m[3]):null;
}
function isPast(s){
  const d=dateObj(s);
  if(!d) return false;
  d.setHours(23,59,59,999);
  return d<Date.now();
}
function roomKey(v){
  const s=String(v||'').trim();
  if(!s) return '';
  return ROOMS.includes(s)&&s!=='__OTHER__'?s:'__OTHER__';
}

function roomClass(room){
  switch(room){
    case '青': return 'room-blue';
    case '黄': return 'room-yellow';
    case '白': return 'room-white';
    case 'ガラス': return 'room-glass';
    case 'PC': return 'room-pc';
    case '自宅可': return 'room-home';
    case '__OTHER__': return 'room-other';
    default: return 'room-unset';
  }
}

function sourceKey(r,index){
  if(r['_sourceKey']) return String(r['_sourceKey']);
  if(r['_追加ID']) return 'ADD:'+r['_追加ID'];
  return 'XLSX:'+[
    index,
    excelDate(r['日付']),
    String(r['時間番号']||'').trim(),
    String(r['クラス']||'').trim(),
    String(r['担当講師']||'').trim()
  ].join('|');
}
function normalizeRoom(value){
  const room=String(value||'').trim();

  // 時間番号が誤って教室欄に入ったデータは「未設定」として扱う
  if(/^[①②③④⑤⑥⑦⑧⑨⑩⑪]$/.test(room)) return '';

  // Excelの時刻値・時刻文字列も教室としては無効
  if(/^\d{1,2}:\d{2}$/.test(room)) return '';
  if(/^0?\.\d+$/.test(room)) return '';

  return room;
}

function normalize(r){
  return {...r,
    '日付':excelDate(r['日付']),
    '日区分':String(r['日区分']||'').trim(),
    '授業ID':String(r['授業ID']||'').trim(),
    'クラス':String(r['クラス']||'').trim(),
    '種別':String(r['種別']||'授業').trim(),
    '給与区分':String(r['給与区分']||'').trim(),
    '担当講師':String(r['担当講師']||'').trim(),
    '教室':normalizeRoom(r['教室']),
    '時間番号':String(r['時間番号']||'').trim(),
    '開始':String(r['開始']||'').trim(),
    '終了':String(r['終了']||'').trim(),
    '科目':String(r['科目']||'').trim(),
    '備考':String(r['備考']||'').trim(),
    '_追加ID':r['_追加ID']||'',
    '_sourceKey':r['_sourceKey']||''
  };
}
function applyEdits(){
  const baseExcel=excelRows.map((row,index)=>{
    const key=sourceKey(row,index);
    const edited=edits[key];
    if(edited && edited._deleted) return null;
    return normalize(Object.assign({},row,edited||{}, {'_sourceKey':key}));
  }).filter(Boolean);
  const baseAdded=addedRows.map(row=>{
    const key=sourceKey(row,0);
    const edited=edits[key];
    if(edited && edited._deleted) return null;
    return normalize(Object.assign({},row,edited||{}, {'_sourceKey':key}));
  }).filter(Boolean);
  const rebuilt=[...baseExcel,...baseAdded];
  allRows=rebuilt;
}
function uniq(field){
  return [...new Set(allRows.map(r=>r[field]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'ja'));
}
function normalizeStudentRow(r){
  return {...r,
    '生徒名':String((r&&r['生徒名'])||'').trim(),
    'クラス':String((r&&r['クラス'])||'').trim(),
    '優先度':String((r&&r['優先度'])??'').trim()
  };
}
async function loadLessonVisibility(){
  try{
    const r=await fetch('lesson_visibility_api.php?v='+Date.now(),{cache:'no-store'});
    const j=await r.json();
    if(r.ok&&j&&j.ok&&Array.isArray(j.hidden)) hiddenClassNames=new Set(j.hidden.map(v=>String(v).trim()).filter(Boolean));
  }catch(e){ console.warn('lesson visibility load failed',e); }
}
function visibleClassNames(){
  return allClassNames().filter(v=>$('generatorShowHidden')?.checked||!hiddenClassNames.has(v));
}
function renderLessonVisibilityList(){
  const host=$('lessonVisibilityList'); if(!host) return;
  const names=allClassNames();
  host.innerHTML=names.length?names.map(name=>`<label class="lesson-visibility-item"><input type="checkbox" data-lesson-visible="${esc(name)}" ${hiddenClassNames.has(name)?'':'checked'}><span>${esc(name)}</span></label>`).join(''):'<div class="lesson-visibility-empty">登録されている授業がありません。</div>';
  host.querySelectorAll('[data-lesson-visible]').forEach(cb=>cb.addEventListener('change',async()=>{
    const name=cb.dataset.lessonVisible;
    if(cb.checked) hiddenClassNames.delete(name); else hiddenClassNames.add(name);
    cb.disabled=true;
    try{
      const r=await fetch('lesson_visibility_api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hidden:[...hiddenClassNames]})});
      const j=await r.json(); if(!r.ok||!j.ok) throw new Error(j.error||'保存失敗');
      $('lessonVisibilityStatus').textContent='✓ 保存しました';
      refreshChoices();
    }catch(e){
      if(cb.checked) hiddenClassNames.add(name); else hiddenClassNames.delete(name);
      cb.checked=!cb.checked;
      $('lessonVisibilityStatus').textContent='保存失敗：'+(e.message||e);
    }finally{cb.disabled=false;}
  }));
}
async function showAllLessonsInChoices(){
  hiddenClassNames.clear();
  const r=await fetch('lesson_visibility_api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hidden:[]})});
  const j=await r.json(); if(!r.ok||!j.ok) throw new Error(j.error||'保存失敗');
  renderLessonVisibilityList(); refreshChoices();
  $('lessonVisibilityStatus').textContent='✓ すべて表示に戻しました';
}

function allClassNames(){
  return [...new Set([
    ...allRows.map(r=>String(r['クラス']||'').trim()),
    ...studentRows.map(r=>String(r['クラス']||'').trim())
  ].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ja'));
}
function studentSheetRowsFromWorkbook(wb){
  const ws=wb && wb.Sheets && wb.Sheets['生徒マスタ'];
  return ws ? XLSX.utils.sheet_to_json(ws,{defval:''}).map(normalizeStudentRow).filter(r=>r['クラス']) : null;
}
async function loadStudentMaster(wb){
  let apiRows=null;
  try{
    const res=await fetch('student_master_api.php?v='+Date.now(),{cache:'no-store'});
    if(res.ok){
      const j=await res.json();
      if(j&&j.ok&&j.initialized) apiRows=(j.students||[]).map(normalizeStudentRow).filter(r=>r['クラス']);
    }
  }catch(e){ console.warn('生徒マスタAPI読込失敗',e); }
  const excelMaster=studentSheetRowsFromWorkbook(wb);
  studentRows=apiRows!==null ? apiRows : (excelMaster||[]);
  renderMasterList();
}
async function saveStudentMaster(){
  const res=await fetch('student_master_api.php',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({students:studentRows})
  });
  const j=await res.json().catch(()=>({}));
  if(!res.ok||!j.ok) throw new Error(j.error||'生徒マスタを保存できません');
  return j;
}
function setMasterMsg(msg,error=false){
  const el=$('masterMsg'); if(!el) return;
  el.textContent=msg||''; el.classList.toggle('error',!!error);
}
function refreshMasterClassFilter(){
  const el=$('masterClassFilter'); if(!el) return;
  const cur=el.value;
  const classes=[...new Set(studentRows.map(r=>String(r['クラス']||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ja'));
  el.innerHTML='<option value="">すべて</option>'+classes.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  el.value=classes.includes(cur)?cur:'';
}
function renderMasterList(){
  const list=$('masterList'); if(!list) return;
  refreshMasterClassFilter();

  const q=String($('masterSearch')?.value||'').trim().toLocaleLowerCase('ja');
  const classFilter=String($('masterClassFilter')?.value||'').trim();
  const sortField=String($('masterSortField')?.value||'class');
  const sortDir=String($('masterSortDir')?.value||'asc')==='desc'?-1:1;

  const rows=studentRows.map((r,i)=>({r,i})).filter(({r})=>{
    const cls=String(r['クラス']||'').trim();
    const student=String(r['生徒名']||'').trim();
    if(classFilter && cls!==classFilter) return false;
    if(q && !(`${cls} ${student}`.toLocaleLowerCase('ja').includes(q))) return false;
    return true;
  }).sort((a,b)=>{
    let cmp=0;
    if(sortField==='student'){
      cmp=String(a.r['生徒名']||'').localeCompare(String(b.r['生徒名']||''),'ja',{numeric:true});
    }else if(sortField==='priority'){
      const av=Number(a.r['優先度']||0), bv=Number(b.r['優先度']||0);
      cmp=(av-bv) || String(a.r['クラス']||'').localeCompare(String(b.r['クラス']||''),'ja',{numeric:true});
    }else{
      cmp=String(a.r['クラス']||'').localeCompare(String(b.r['クラス']||''),'ja',{numeric:true});
    }
    if(!cmp) cmp=String(a.r['生徒名']||'').localeCompare(String(b.r['生徒名']||''),'ja',{numeric:true});
    return cmp*sortDir;
  });

  const count=$('masterResultCount');
  if(count) count.textContent=`${rows.length}件 / 全${studentRows.length}件`;

  list.innerHTML=rows.length ? rows.map(({r,i})=>`<div class="master-row">
    <span class="master-class">${esc(r['クラス'])}</span>
    <span class="${r['生徒名']?'':'master-empty'}">${esc(r['生徒名']||'（生徒未登録のクラス）')}</span>
    <span>優先度 ${esc(r['優先度']||'0')}</span>
    <button type="button" data-master-delete="${i}">参加を変更</button>
  </div>`).join('') : '<div class="master-row"><span class="master-empty">該当する登録はありません</span></div>';
  list.querySelectorAll('[data-master-delete]').forEach(btn=>btn.addEventListener('click',async()=>{
    const i=Number(btn.dataset.masterDelete);
    const row=studentRows[i]; if(!row) return;
    await Workspace.openMembers(row['クラス']);
  }));
}
async function addMasterClass(){
  const cls=String($('masterClass').value||'').trim();
  if(!cls){setMasterMsg('クラス名を入力してください。',true);return;}
  if(!studentRows.some(r=>r['クラス']===cls && !r['生徒名'])) studentRows.push({'生徒名':'','クラス':cls,'優先度':'0'});
  try{await saveStudentMaster(); renderMasterList(); refreshChoices(); $('masterClass').value=cls; setMasterMsg(`${cls} を追加・同期しました。`);}
  catch(e){setMasterMsg(e.message||e,true);}
}
async function addMasterStudent(){
  const cls=String($('masterClass').value||'').trim();
  if(!cls){setMasterMsg('クラス名を選んでください。',true);return;}
  await Workspace.openMembers(cls);
}

function fillSelect(id,vals){
  const el=$(id),cur=el.value;
  el.innerHTML='<option value="">すべて</option>'+vals.map(v=>`<option>${esc(v)}</option>`).join('');
  el.value=vals.includes(cur)?cur:'';
}
function fillChoiceSelect(id,vals,{allowBlank=true}={}){
  const el=$(id);
  const current=el.value;
  let options='';
  if(allowBlank) options+='<option value="">未設定</option>';
  options+=vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  options+='<option value="__CUSTOM__">その他（自由入力）</option>';
  el.innerHTML=options;
  if([...el.options].some(o=>o.value===current)){
    el.value=current;
  }else{
    el.value=allowBlank?'':'__CUSTOM__';
  }
}

function setChoiceValue(selectId,customId,value,{allowBlank=true}={}){
  const select=$(selectId);
  const custom=$(customId);
  const v=String(value||'').trim();

  if(v==='' && allowBlank){
    select.value='';
    custom.value='';
    custom.classList.add('hidden');
    return;
  }

  if([...select.options].some(o=>o.value===v)){
    select.value=v;
    custom.value='';
    custom.classList.add('hidden');
  }else{
    select.value='__CUSTOM__';
    custom.value=v;
    custom.classList.remove('hidden');
  }
}

function getChoiceValue(selectId,customId){
  const select=$(selectId);
  if(select.value==='__CUSTOM__'){
    return String($(customId).value||'').trim();
  }
  return String(select.value||'').trim();
}

function setRoomValue(value){
  const v=String(value||'').trim();
  const known=['','青','黄','白','ガラス','PC','自宅可'];
  if(known.includes(v)){
    $('fRoomSelect').value=v;
    $('fRoomCustom').value='';
    $('fRoomCustom').classList.add('hidden');
  }else{
    $('fRoomSelect').value='__CUSTOM__';
    $('fRoomCustom').value=v;
    $('fRoomCustom').classList.remove('hidden');
  }
}
function getRoomValue(){
  return $('fRoomSelect').value==='__CUSTOM__'
    ? String($('fRoomCustom').value||'').trim()
    : String($('fRoomSelect').value||'').trim();
}

function refreshChoices(){
  fillSelect('teacherFilter',uniq('担当講師'));
  fillSelect('classFilter',visibleClassNames());
  fillChoiceSelect('fClassSelect',visibleClassNames(),{allowBlank:false});
  fillChoiceSelect('fTeacherSelect',uniq('担当講師'),{allowBlank:true});
  fillChoiceSelect('fSubjectSelect',uniq('科目'),{allowBlank:true});
  window.ClassTreePicker?.sync();
}
function filteredRows(){
  const tf=$('teacherFilter').value,cf=$('classFilter').value,showPast=$('showPast').checked;
  return allRows.filter(r=>
    (!tf||r['担当講師']===tf) &&
    (!cf||r['クラス']===cf) &&
    (window.DayCompare?.active?DayCompare.dates().includes(String(r['日付']).replaceAll('/','-')):(window.HistoryWindow?HistoryWindow.includes(r['日付']):(showPast||!isPast(r['日付'])))) &&
    (!window.GeneratorExtras||GeneratorExtras.matches(r))
  );
}
function lessonHTML(r){
  const cls=r._roomClass||roomClass(roomKey(r['教室']));
  return `<div role="button" tabindex="0" draggable="true" class="lesson ${cls} ${r._linked?'generator-linked-card':''}" ${window.LinkedSchedule?.attributes(r)||''} data-source-key="${esc(r['_sourceKey'])}">
    <strong>${r._linked?esc(r._linked.slots.join(''))+' ':''}${esc(r['クラス'])}</strong>
    <div>${esc(r['種別'])}　${esc(r['科目'])}</div>
    <div class="lesson-meta">担当 ${esc(r['担当講師'])}</div>
  </div>`;
}

const DAILY_NOTE_API='daily_note_api.php';
let generatorDailyNotes={};
async function loadGeneratorDailyNotes(){
  try{const r=await fetch(DAILY_NOTE_API+'?v='+Date.now(),{cache:'no-store'});if(!r.ok)return {};const j=await r.json();return j.notes||{};}catch(e){return {}};
}
async function saveGeneratorDailyNote(date,text){
  const r=await fetch(DAILY_NOTE_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:date.replaceAll('/','-'),text})});
  const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw new Error(j.error||'メモ保存失敗');
}
function bindGeneratorDailyNotes(){
  document.querySelectorAll('.generator-day-note').forEach(el=>{let t=null;el.addEventListener('input',()=>{const st=el.parentElement.querySelector('.generator-day-note-status');if(st)st.textContent='未保存';clearTimeout(t);t=setTimeout(async()=>{try{await saveGeneratorDailyNote(el.dataset.date,el.value);generatorDailyNotes[el.dataset.date.replaceAll('/','-')]=el.value;if(st)st.textContent='保存済み';}catch(e){if(st)st.textContent='保存失敗';}},700);});});
}
function render(){
  const rows=filteredRows();
  const registeredDates=[...new Set(rows.map(r=>String(r['日付']||'').trim()).filter(Boolean))].sort();
  // コマ生成は「登録済み日だけ」ではなく、これから授業を登録する未来日も表示する。
  // 基準日は本日。登録済みの最終日より先も120日後まで連続表示する。
  // 「過去日も表示」がONなら、登録済みの最初の日から表示する。
  let dates=[];
  const today=new Date();
  today.setHours(0,0,0,0);
  const horizon=new Date(today);
  horizon.setDate(horizon.getDate()+120);

  let start=window.HistoryWindow?new Date(HistoryWindow.start()+'T00:00:00'):new Date(today);

  let end=new Date(horizon);
  if(registeredDates.length){
    const lastRegistered=dateObj(registeredDates[registeredDates.length-1]);
    if(lastRegistered && lastRegistered>end) end=lastRegistered;
  }

  const cur=new Date(start.getFullYear(),start.getMonth(),start.getDate());
  while(cur<=end){
    dates.push(`${cur.getFullYear()}/${String(cur.getMonth()+1).padStart(2,'0')}/${String(cur.getDate()).padStart(2,'0')}`);
    cur.setDate(cur.getDate()+1);
  }

  if(window.DayCompare?.active)dates=DayCompare.dates().map(d=>d.replaceAll('-','/'));
  let h='<div class="generator-grid"><div class="cell head">日付・教室</div>';
  SLOT_KEYS.forEach(s=>{
    h+=`<div class="cell head"><strong>${s}</strong><br><small>${SLOTS[s][0]}〜${SLOTS[s][1]}</small></div>`;
  });

  dates.forEach(date=>{
    ROOMS.filter(room=>(!window.GeneratorExtras||GeneratorExtras.showRoom(room))&&(!window.DayCompare?.active||DayCompare.showRoom(room,rows))).forEach((room,i)=>{
      h+=`<div class="cell lane-label ${roomClass(room)} ${i===0?'date-start':''} ${i===0&&genHoliday(date)?'school-holiday-cell':''}">
        ${i===0?`<div class="sticky-date-box">
          <div class="generator-date-head"><button type="button" class="sticky-date" data-availability-date="${esc(date)}" aria-haspopup="dialog" aria-controls="teacherAvailabilityPanel" aria-label="${esc(date)}の講師OK・NGを表示">${esc(date.slice(5).replace('/','-'))}（${esc(weekdayLabel(date))}）</button><button type="button" class="date-fixed-focus" data-fixed-focus-date="${esc(date)}" aria-pressed="false" aria-label="確定状態を読み込み中…" disabled>🔓</button></div>
          <button type="button" class="copy-prev-week" data-copy-target="${esc(date)}" title="7日前の予定をこの日にコピー">先週の同曜日をコピー</button>
          ${genHolidayControl(date)}<div class="ce-day-events" data-calendar-date="${esc(date)}"></div>
          <textarea class="generator-day-note" data-date="${esc(date)}" placeholder="生徒の予定・個人メモ">${esc(generatorDailyNotes[date.replaceAll('/','-')]||'')}</textarea><span class="generator-day-note-status"></span>
        </div>`:''}
        <span class="room-chip">${ROOM_LABEL[room]}</span>
      </div>`;

      const laneRows=rows.filter(r=>r['日付']===date&&roomKey(r['教室'])===room);
      const linked=window.LinkedSchedule?.lanes(laneRows.map(r=>({date:r['日付'].replaceAll('/','-'),slot:r['時間番号'],cls:r['クラス'],teacher:r['担当講師'],type:r['種別'],subjects:String(r['科目']||'').split(/[,、，]/).filter(Boolean),room:r['教室'],start:r['開始'],end:r['終了'],sourceKey:r._sourceKey,_original:r})));
      const hasSpan=linked?.units.some(u=>u.end>u.start);
      SLOT_KEYS.forEach((slot,index)=>{
        const items=rows.filter(r=>
          r['日付']===date &&
          r['時間番号']===slot &&
          roomKey(r['教室'])===room
        );

        h+=`<div class="cell generator-slot ${roomClass(room)} ${i===0?'date-start':''}"
          data-date="${date}" data-slot="${slot}" data-room="${room}">
          ${hasSpan?Array.from({length:linked.count},(_,lane)=>{const u=linked.units.find(u=>u.start===index&&u.lane===lane);return '<div class="generator-linked-track">'+(u?lessonHTML({...u.row._original,_linked:u.row._linked,_roomClass:roomClass(room)}):'')+'</div>';}).join(''):items.map(r=>lessonHTML(Object.assign({},r,{_roomClass:roomClass(room)}))).join('')}
          ${items.length===0
            ? `<button class="add-cell" data-date="${date}" data-slot="${slot}" data-room="${room}" title="授業追加">＋</button>`
            : `<button class="add-cell add-shared" data-date="${date}" data-slot="${slot}" data-room="${room}" title="同じ枠に授業を追加">＋ 授業を追加</button>`}
        </div>`;
      });
    });
  });

  h+='</div>';
  $('grid').innerHTML=h;
  window.DayCompare?.layout();
  bindAdd();
  bindEdit();
  bindDragAndDrop();
  bindGeneratorDailyNotes();
  bindGeneratorHolidayChecks();
  bindPreviousWeekCopyButtons();
  $('status').textContent=`${dates.length}日分・${rows.length}件を表示`;
}
function shiftGeneratorDate(date,deltaDays){
  const d=dateObj(date); if(!d) return '';
  d.setDate(d.getDate()+deltaDays);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}
function scheduleCopySignature(r){
  return ['時間番号','教室','クラス','種別','給与区分','担当講師','開始','終了','科目','備考'].map(k=>String(r[k]||'').trim()).join('\u241f');
}
async function addCopiedLesson(row){
  let payload={action:'add',row};
  let r=await fetch('lesson_add_api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  let j=await r.json();
  if(!window.StaffAuth && r.status===409 && j&&j.ngConflict){
    if(!confirm((j.error||'担当講師がNG登録されています。')+'\n\nそれでもこの授業をコピーしますか？')) return null;
    payload.overrideNg=true;
    r=await fetch('lesson_add_api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    j=await r.json();
  }
  if(!r.ok||!j.ok) throw new Error(j.error||'コピーに失敗しました');
  return normalize(j.row||row);
}
async function copyPreviousWeekSchedule(targetDate,button){await WeekCopy.open(shiftGeneratorDate(targetDate,-7),targetDate);}

function bindPreviousWeekCopyButtons(){
  document.querySelectorAll('[data-copy-target]').forEach(btn=>{
    btn.onclick=e=>{e.preventDefault();e.stopPropagation();copyPreviousWeekSchedule(btn.dataset.copyTarget,btn);};
  });
}

function bindAdd(){
  document.querySelectorAll('.add-cell').forEach(b=>{
    b.onclick=()=>openAddModal(b.dataset.date,b.dataset.slot,b.dataset.room);
  });
}
function bindEdit(){
  document.querySelectorAll('.lesson').forEach(b=>{
    b.onkeydown=e=>{if(e.target===b&&(e.key==='Enter'||e.key===' ')){e.preventDefault();b.click();}};
    b.onclick=e=>{
      if(e.target.closest('[data-lesson-action]'))return;
      const row=allRows.find(r=>r['_sourceKey']===b.dataset.sourceKey);
      if(row) openEditModal(row);
    };
  });
}

function generatorNormalizeDate(value){
  const s=String(value||'').trim().replaceAll('/','-');
  const m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return m?`${m[1]}-${String(+m[2]).padStart(2,'0')}-${String(+m[3]).padStart(2,'0')}`:s;
}
function generatorEventKey(row){
  const subjects=String(row['科目']||'')
    .split(/[,、，]/).map(v=>v.trim()).filter(Boolean).join('+');
  return [
    generatorNormalizeDate(row['日付']),
    String(row['時間番号']||'').trim(),
    String(row['クラス']||'').trim(),
    String(row['担当講師']||'').trim(),
    String(row['種別']||'').trim(),
    subjects
  ].join('|');
}
function currentModalRow(){
  return normalize({
    '日付':isoToGeneratorDate($('fDate').value),
    'クラス':getChoiceValue('fClassSelect','fClassCustom'),
    '種別':getTypeValue(),
    '給与区分':String($('fPayrollCategory')?.value||'').trim(),
    '担当講師':getChoiceValue('fTeacherSelect','fTeacherCustom'),
    '教室':getRoomValue(),
    '時間番号':$('fSlot').value,
    '開始':$('fStart').value,
    '終了':$('fEnd').value,
    '科目':getChoiceValue('fSubjectSelect','fSubjectCustom'),
    '備考':$('fNote').value
  });
}
async function loadGeneratorClassState(){
  try{
    const res=await fetch('state_api.php?v='+Date.now(),{cache:'no-store'});
    const j=await res.json();
    if(!res.ok||!j.ok)throw new Error(j.error||'出席読込失敗');generatorClassState=j.state||{};return true;
  }catch(e){
    return false;
  }
}
function generatorRosterForClass(cls,date){
  return [...new Set(
    studentRows
      .filter(r=>String(r['クラス']||'').trim()===String(cls||'').trim() && (!window.Workspace||(!Workspace.hiddenStudent(String(r['生徒名']||'').trim())&&Workspace.enrolled(r,date))))
      .map(r=>String(r['生徒名']||'').trim())
      .filter(Boolean)
  )].sort((a,b)=>a.localeCompare(b,'ja',{numeric:true}));
}
async function loadGeneratorOps(row){
  if(window.Workspace)await Workspace.ready;
  const ops=$('generatorOps');
  if(!ops) return;
  const isEdit=$('fMode').value==='edit';
  ops.classList.toggle('hidden',!isEdit);
  $('duplicateNextLesson').classList.toggle('hidden',!isEdit);
  if(!isEdit) return;

  const cls=String(row['クラス']||'').trim();
  const eventKey=generatorEventKey(row);
  const recordListLink=$('generatorRecordListLink');
  if(recordListLink) recordListLink.href='lesson_records.html?class='+encodeURIComponent(cls);

  $('teacherSharedMemoMsg').textContent='';
  $('generatorAttendanceMsg').textContent='';
  $('fTeacherSharedMemo').value='';
  $('generatorAttendanceList').innerHTML='<div class="generator-loading">読み込み中…</div>';

  generatorOpsLoaded=false;
  try{if(window.Workspace)await Workspace.refresh();}catch(e){$('generatorAttendanceList').textContent='生徒一覧を読み込めません。詳細を開き直してください。';return;}
  if(!await loadGeneratorClassState()){$('generatorAttendanceList').textContent='出席を読み込めません。詳細を開き直してください。';return;}
  generatorOpsLoaded=true;

  const classMemoKey='__CLASS_MEMO__|'+cls;
  const classMemoState=generatorClassState[classMemoKey]||{};
  SharedNotes.mount($('fTeacherSharedMemo'),cls);

  const st=generatorClassState[eventKey]||{};
  const roster=generatorRosterForClass(cls,row['日付']);
  const rawAttendance=(st.attendance&&typeof st.attendance==='object')?st.attendance:{};
  // 旧版で詳細を保存しただけで全員『出席』が自動保存されたデータは、未選択として扱う。
  // v73以降に明示保存した出席情報は attendanceTouched=true なのでそのまま表示する。
  const legacyAutoPresent=st.attendanceTouched!==true && roster.length>0 && roster.every(name=>rawAttendance[name]==='出席');
  const attendance={...rawAttendance},autoExempt=new Set();
  if(window.Workspace)for(const n of roster)if((!attendance[n]||attendance[n]==='---')&&Workspace.exempt(n,cls,row['日付'],st)){attendance[n]='免除';autoExempt.add(n);}

  const recordBox=$('generatorLessonRecord');
  if(recordBox){
    recordBox.textContent='読み込み中…';
    recordBox.classList.remove('is-empty');
    try{
      const rr=await fetch('lesson_record_api.php?key='+encodeURIComponent(eventKey)+'&v='+Date.now(),{cache:'no-store'});
      const rj=await rr.json();
      const memo=(rj&&rj.ok&&rj.record)?String(rj.record.memo||'').trim():'';
      recordBox.textContent=memo||'このコマのカルテ記録はまだありません。';
      recordBox.classList.toggle('is-empty',!memo);
    }catch(e){
      recordBox.textContent='カルテを読み込めませんでした。';
      recordBox.classList.add('is-empty');
    }
  }

  $('generatorAttendanceList').innerHTML=roster.length
    ? roster.map(name=>`<div class="generator-att-row ${attendance[name]==='免除'?'is-exempt':''}">
        <span>${esc(name)}</span>
        <select class="generator-att-select" data-name="${esc(name)}" data-auto-exempt="${autoExempt.has(name)}">
          ${['---','出席','遅刻','欠席','早退','免除','その他','不明','未定'].map(v=>`<option value="${v}" ${(attendance[name]||'---')===v?'selected':''}>${v}</option>`).join('')}
        </select>
      </div>`).join('')
    : '<div class="generator-empty">このクラスの参加生徒登録がありません。</div>';

  const scRoot=$('scGeneratorContacts');if(scRoot&&window.StaffContacts){scRoot.innerHTML='';delete scRoot._scInbox;StaffContacts.mount(scRoot,{keys:[eventKey],onConfirmed:async item=>{
    const latest=await Workspace.api('state_api.php');generatorClassState=latest.state||{};
    if(generatorEventKey(currentModalRow())!==eventKey)return;
    const a=item.attendance[eventKey];if(a){const initial=JSON.parse(generatorModalSnapshot||'{}');initial['att:'+item.student]=a.value;generatorModalSnapshot=JSON.stringify(initial);}if(a)document.querySelectorAll('.generator-att-select').forEach(sel=>{if(sel.dataset.name===item.student){sel.value=a.value;sel.dataset.autoExempt='false';sel.closest('.generator-att-row')?.classList.toggle('is-exempt',a.value==='免除');}});
  }});}
  document.querySelectorAll('.generator-att-select').forEach(sel=>{
    sel.addEventListener('change',()=>{
      sel.closest('.generator-att-row')?.classList.toggle('is-exempt',sel.value==='免除');
    });
  });
}
async function saveGeneratorTeacherMemo(){
  const context=generatorSaveContext();
  const btn=$('saveTeacherSharedMemo');btn.disabled=true;
  try{await SharedNotes.post(currentModalRow()['クラス']||'',$('fTeacherSharedMemo'));if(generatorSaveIsCurrent(context)){markGeneratorFieldsSaved({fTeacherSharedMemo:''},context);$('teacherSharedMemoMsg').textContent='共有メモを記録しました。';}return true;}
  catch(e){$('teacherSharedMemoMsg').textContent=e.message;return false;}finally{btn.disabled=false;}
}
async function persistGeneratorAttendance(options={}){
  const context=generatorSaveContext(),savedFields={};
  const row=options.row||currentModalRow();
  const eventKey=generatorEventKey(row);
  const attendance={};
  document.querySelectorAll('.generator-att-select').forEach(sel=>{
    const name=String(sel.dataset.name||'').trim();
    savedFields['att:'+sel.dataset.name]=sel.value;
    if(name && sel.value && sel.value!=='---' && !(sel.dataset.autoExempt==='true'&&sel.value==='免除')) attendance[name]=sel.value;
  });
  const btn=$('saveGeneratorAttendance');
  if(btn) btn.disabled=true;
  $('generatorAttendanceMsg').textContent='保存中…';
  try{
    if(!generatorOpsLoaded)throw new Error('出席を読み込めていないため保存を中止しました');
    if(!eventKey || eventKey==='|||||') throw new Error('授業情報を取得できません');
    const res=await fetch('state_api.php?v='+Date.now(),{
      method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({eventKey,attendance,attendanceTouched:true})
    });
    const raw=await res.text();
    let j={};
    try{j=JSON.parse(raw);}catch(e){throw new Error('サーバー応答が不正です');}
    if(!res.ok||!j.ok) throw new Error(j.error||'保存失敗');
    generatorClassState[eventKey]=j.state||{attendance};
    if(generatorSaveIsCurrent(context)){
      markGeneratorFieldsSaved(savedFields,context);
      $('generatorAttendanceMsg').textContent='保存しました';
    }
    return true;
  }catch(e){
    $('generatorAttendanceMsg').textContent='保存失敗：'+(e.message||e);
    return false;
  }finally{
    if(btn) btn.disabled=false;
  }
}
async function saveGeneratorAttendance(){return await persistGeneratorAttendance();}

async function duplicateLessonToNextSlot(){
  if(generatorModalHasChanges()){$('formMsg').textContent='詳細に未保存の変更があります。先に保存してから複製してください。';return;}
  const result=await LessonPlacement.next($('fSourceKey').value);
  if(!result)return;
  if(result.group){forceCloseModal();LessonGroups.returnToGenerator(result.group);return;}
  await load();$('formMsg').textContent=result.rows.length+'コマを複製しました。';
}

async function populateModal(row,mode){
  const session=++generatorModalSession;
  $('fMode').value=mode;
  $('fSourceKey').value=row['_sourceKey']||'';
  $('fDate').value=generatorDateToIso(row['日付']);
  $('fSlot').value=row['時間番号'];
  setRoomValue(normalizeRoom(row['教室']));
  setChoiceValue('fClassSelect','fClassCustom',row['クラス'],{allowBlank:false});
  setTypeValue(row['種別']||'授業');
  if($('fPayrollCategory')) $('fPayrollCategory').value=String(row['給与区分']||'');
  setChoiceValue('fTeacherSelect','fTeacherCustom',row['担当講師'],{allowBlank:true});
  setChoiceValue('fSubjectSelect','fSubjectCustom',row['科目'],{allowBlank:true});
  $('fStart').value=row['開始']||SLOTS[row['時間番号']]?.[0]||'';
  $('fEnd').value=row['終了']||SLOTS[row['時間番号']]?.[1]||'';
  $('fNote').value=row['備考'];
  for(const id of ['fDate','fSlot','fClassSelect','fClassCustom','fTypeSelect','fTypeCustom','fPayrollCategory','fTeacherSelect','fTeacherCustom','fSubjectSelect','fSubjectCustom','fStart','fEnd','fRoomSelect','fRoomCustom'])if($(id))$(id).disabled=StaffAuth.user?.role!=='admin';
  window.ClassTreePicker?.sync();
  $('formMsg').textContent='';
  $('saveAdd').textContent=mode==='edit'?'変更を保存':'授業を追加';
  $('deleteLesson').classList.toggle('hidden',mode!=='edit');
  $('deleteLesson').disabled=false;
  $('duplicateNextLesson').classList.toggle('hidden',mode!=='edit');
  $('duplicateNextLesson').disabled=false;
  $('generatorOps').classList.toggle('hidden',mode!=='edit');
  $('modalTitle').textContent=mode==='edit'
    ? `${row['日付']} ${row['時間番号']} 授業編集`
    : `${row['日付']} ${row['時間番号']} 授業追加`;
  $('modal').classList.remove('hidden');
  await Promise.all([loadGeneratorOps(row),window.GeneratorExtras?GeneratorExtras.open(row,mode):Promise.resolve()]);
  if(session===generatorModalSession)markGeneratorModalSnapshot();
}
function openAddModal(date,slot,room){
  populateModal(normalize({
    '日付':date,
    '時間番号':slot,
    '教室':room==='__OTHER__'?'':ROOM_LABEL[room],
    '種別':'授業',
    '給与区分':'',
    '担当講師':$('teacherFilter').value||'',
    '開始':SLOTS[slot][0],
    '終了':SLOTS[slot][1]
  }),'add');
}
async function openEditModal(row){
  if(window.LessonGroups){try{await LessonGroups.ready;}catch(e){alert(e.message+'。再読み込みしてください。');return;}const group=LessonGroups.forSource(row._sourceKey);if(group){location.assign(LessonGroups.url(group.id));return;}}
  populateModal(row,'edit');
}

let generatorModalSnapshot='',generatorModalSession=0;
function generatorModalState(){const ids=['fDate','fSlot','fRoomSelect','fRoomCustom','fClassSelect','fClassCustom','fTypeSelect','fTypeCustom','fPayrollCategory','fTeacherSelect','fTeacherCustom','fSubjectSelect','fSubjectCustom','fStart','fEnd','fNote','fTeacherSharedMemo','generatorRecordMemo','generatorHomework'];const s={};ids.forEach(id=>{const e=$(id);if(e)s[id]=e.value});document.querySelectorAll('.generator-att-select').forEach(e=>s['att:'+e.dataset.name]=e.value);return JSON.stringify(s)}
function markGeneratorModalSnapshot(){generatorModalSnapshot=generatorModalState()}
function generatorModalHasChanges(){
  const saved=JSON.parse(generatorModalSnapshot||'{}'),current=JSON.parse(generatorModalState());
  return Object.keys(saved).length!==Object.keys(current).length||Object.keys(current).some(key=>saved[key]!==current[key]);
}
function generatorSaveContext(){return {session:generatorModalSession,source:$('fSourceKey').value};}
function generatorSaveIsCurrent(context){return context.session===generatorModalSession&&context.source===$('fSourceKey').value&&!$('modal').classList.contains('hidden');}
function markGeneratorFieldsSaved(values,context){
  if(!generatorSaveIsCurrent(context))return;
  // A section save acknowledges only the submitted fields, never unrelated drafts
  // or edits made while its request was in flight.
  generatorModalSnapshot=JSON.stringify({...JSON.parse(generatorModalSnapshot||'{}'),...values});
  if(!generatorModalHasChanges()&&$('formMsg').textContent.startsWith('詳細に未保存の変更があります。'))$('formMsg').textContent='';
}
async function requestCloseModal(){
  if(window.SharedNotes?.busy($('fTeacherSharedMemo'))){$('teacherSharedMemoMsg').textContent='共有メモを保存中です。完了後に閉じてください。';return;}
  if($('modal').classList.contains('hidden')) return;
  if(!generatorModalHasChanges()){
    forceCloseModal();
    return;
  }

  let confirmBox=document.getElementById('generatorSaveConfirm');
  if(!confirmBox){
    confirmBox=document.createElement('div');
    confirmBox.id='generatorSaveConfirm';
    confirmBox.className='ops-save-confirm hidden';
    confirmBox.innerHTML=`
      <div class="ops-save-confirm-box">
        <div class="ops-save-confirm-title">変更内容を保存しますか？</div>
        <div class="ops-save-confirm-actions">
          <button id="generatorConfirmYes" type="button">はい（保存）</button>
          <button id="generatorConfirmNo" type="button">いいえ</button>
        </div>
      </div>`;
    document.body.appendChild(confirmBox);
  }

  confirmBox.classList.remove('hidden');

  const yes=confirmBox.querySelector('#generatorConfirmYes');
  const no=confirmBox.querySelector('#generatorConfirmNo');

  yes.onclick=async()=>{
    yes.disabled=true;
    no.disabled=true;
    yes.textContent='保存中…';
    try{
      await saveForm();
      confirmBox.classList.add('hidden');
    }finally{
      yes.disabled=false;
      no.disabled=false;
      yes.textContent='はい（保存）';
    }
  };

  no.onclick=()=>{
    confirmBox.classList.add('hidden');
    forceCloseModal();
  };
}
function closeModal(){requestCloseModal()}
function forceCloseModal(){
  generatorModalSession++;
  $('generatorSaveConfirm')?.classList.add('hidden');
  $('modal').classList.add('hidden');
}
async function saveForm(){
  if($('saveAdd').disabled)return;
  const mode=$('fMode').value;
  const source=$('fSourceKey').value;
  if(mode==='edit'&&(!generatorOpsLoaded||(window.GeneratorExtras&&!GeneratorExtras.loaded))){$('formMsg').textContent='読込に失敗しています。詳細を開き直してください。';return;}

  const row=normalize({
    '日付':isoToGeneratorDate($('fDate').value),
    'クラス':getChoiceValue('fClassSelect','fClassCustom'),
    '種別':getTypeValue(),
    '給与区分':String($('fPayrollCategory')?.value||'').trim(),
    '担当講師':getChoiceValue('fTeacherSelect','fTeacherCustom'),
    '教室':getRoomValue(),
    '時間番号':$('fSlot').value,
    '開始':$('fStart').value,
    '終了':$('fEnd').value,
    '科目':getChoiceValue('fSubjectSelect','fSubjectCustom'),
    '備考':$('fNote').value
  });

  if(!row['日付']){ $('formMsg').textContent='日付は必須です。'; return; }
  if(!row['クラス']||!row['種別']){
    $('formMsg').textContent='クラス・種別は必須です。担当講師は空欄でも保存できます。';
    return;
  }

  $('saveAdd').disabled=true;
  $('formMsg').textContent='保存中…';

  try{
    const payload=mode==='edit'
      ? {action:'update',sourceKey:source,row}
      : {action:'add',row};

    const r=await fetch('lesson_add_api.php',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const j=await r.json();
    if(!r.ok||!j.ok) throw new Error(j.error||'保存失敗');

    if(mode==='edit'){
      edits[source]=normalize(j.row||row);
    }else{
      addedRows.push(normalize(j.row||row));
    }

    applyEdits();
    await window.LessonFixed?.refreshAll();
    refreshChoices();
    render();
    if(mode==='edit' && document.querySelector('.generator-att-select')){
      const attendanceSaved=await persistGeneratorAttendance({row:normalize(j.row||row)});
      if(!attendanceSaved) return;
    }
    if(mode==='edit'&&!await saveGeneratorTeacherMemo()){$('formMsg').textContent='授業予定は保存済みです。共有メモ：'+$('teacherSharedMemoMsg').textContent;return;}
    if(window.GeneratorExtras && mode==='edit') await GeneratorExtras.save(j.row||row);
    forceCloseModal();
  }catch(e){
    $('formMsg').textContent='保存失敗：'+(e.message||e);
  }finally{
    $('saveAdd').disabled=false;
  }
}

async function deleteCurrentLesson(){
  const sourceKey=String($('fSourceKey').value||'').trim();
  if(!sourceKey) return;

  const row=getRowBySourceKey(sourceKey);
  const label=row ? `${row['日付']} ${row['時間番号']} ${row['クラス']}` : 'この授業';
  if(!confirm(`${label}を削除しますか？`)) return;

  $('deleteLesson').disabled=true;
  $('saveAdd').disabled=true;
  $('formMsg').textContent='削除中…';

  try{
    const response=await fetch('lesson_add_api.php',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'delete',sourceKey})
    });
    const result=await response.json();
    if(!response.ok||!result.ok) throw new Error(result.error||'削除失敗');

    edits[sourceKey]={_deleted:true};

    applyEdits();
    await window.LessonFixed?.refreshAll();
    refreshChoices();
    render();
    forceCloseModal();
    $('status').textContent='授業を削除しました。';
  }catch(e){
    $('formMsg').textContent='削除失敗：'+(e.message||e);
  }finally{
    $('deleteLesson').disabled=false;
    $('saveAdd').disabled=false;
  }
}

function setExcelIoStatus(message,isError=false){
  const el=$('excelIoStatus');
  if(!el) return;
  el.textContent=message;
  el.classList.toggle('error',!!isError);
}
function chooseScheduleSheet(wb){
  if(wb.Sheets['時間割データ']) return '時間割データ';
  if(wb.Sheets['時間割']) return '時間割';
  for(const name of wb.SheetNames){
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:'',range:0});
    const first=rows.slice(0,5).flat().map(v=>String(v||'').replace(/[\s　]+/g,''));
    if(first.includes('日付') && (first.includes('クラス') || first.includes('担当講師'))) return name;
  }
  return wb.SheetNames[0];
}
async function importSelectedExcel(){
  const file=$('excelUpload').files && $('excelUpload').files[0];
  if(!file){
    setExcelIoStatus('先にExcelファイルを選択してください。',true);
    return;
  }
  $('loadExcel').disabled=true;
  setExcelIoStatus(`${file.name} を読み込んでいます…`);
  try{
    const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});
    if(!wb.SheetNames.length) throw new Error('Excelにシートがありません');
    const sheetName=chooseScheduleSheet(wb);
    const imported=XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{defval:''}).map(normalize);
    if(!imported.length) throw new Error('時間割データを読み込めませんでした');

    baseWorkbook=wb;
    baseWorkbookName=file.name||'schedule.xlsx';
    baseSheetName=sheetName;
    excelRows=imported;
    addedRows=[];
    edits={};
    const importedStudents=studentSheetRowsFromWorkbook(wb);
    if(importedStudents!==null){
      studentRows=importedStudents;
      await saveStudentMaster();
      renderMasterList();
    }
    applyEdits();
    await window.LessonFixed?.refreshAll();
    refreshChoices();
    render();
    setExcelIoStatus(`${baseWorkbookName} を土台として読み込みました（時間割 ${allRows.length}件／生徒マスタ ${studentRows.filter(r=>r['生徒名']).length}件）`);
  }catch(e){
    console.error(e);
    setExcelIoStatus('Excel読込エラー：'+(e.message||e),true);
  }finally{
    $('loadExcel').disabled=false;
  }
}
function getRowBySourceKey(sourceKey){
  return allRows.find(r=>r['_sourceKey']===sourceKey)||null;
}
async function moveLessonToCell(sourceKey,date,slot,room){
  let row=getRowBySourceKey(sourceKey),sourceVersion;
  if(!row) return;
  if(window.LessonGroups?.forSource(sourceKey)){if(await GroupScheduleActions.move(sourceKey,{date,slot,room})){await LessonGroups.refresh();await load();await window.LessonFixed?.refreshAll();$('status').textContent='連結した授業をまとめて移動しました。';}return;}
  if(Workspace.iso(row['日付'])!==Workspace.iso(date)){
    const result=await LessonPlacement.drop(sourceKey,{date:Workspace.iso(date),slot,room});if(!result)return;
    if(result.action==='copied'){await load();$('status').textContent='元の授業を残してコピーしました。';return;}
    row=result.row;sourceVersion=result.version;
  }


  const occupied=allRows.some(r=>
    r['_sourceKey']!==sourceKey &&
    r['日付']===date &&
    r['時間番号']===slot &&
    roomKey(r['教室'])===room
  );


  const times=SLOTS[slot]||['',''];
  const moved=normalize(Object.assign({},row,{
    '日付':date,
    '時間番号':slot,
    '教室':room==='__OTHER__'?'':room,
    '開始':times[0],
    '終了':times[1]
  }));

  try{
    let payload={action:'update',sourceKey,row:moved,...(sourceVersion?{sourceVersion}:{})};
    let response=await fetch('lesson_add_api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    let result=await response.json();
    if(!window.StaffAuth&&response.status===409&&result.ngConflict&&confirm(result.error+'\nそれでも移動しますか？')){payload.overrideNg=true;response=await fetch('lesson_add_api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});result=await response.json();}
    if(!response.ok||!result.ok) throw new Error(result.error||'移動保存失敗');
    edits[sourceKey]=normalize(result.row||moved);
    applyEdits();
    await window.LessonFixed?.refreshAll();
    refreshChoices();
    render();
    $('status').textContent='授業を移動しました。';
  }catch(e){
    alert('移動保存に失敗しました：'+(e.message||e));
  }
}
function bindDragAndDrop(){
  document.querySelectorAll('.lesson[draggable="true"]').forEach(card=>{
    card.addEventListener('dragstart',e=>{
      draggedSourceKey=card.dataset.sourceKey||'';
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed='copyMove';
      e.dataTransfer.setData('text/plain',draggedSourceKey);
    });
    card.addEventListener('dragend',()=>{
      draggedSourceKey='';
      card.classList.remove('dragging');
      document.querySelectorAll('.generator-slot').forEach(cell=>cell.classList.remove('drop-target'));
    });
  });

  document.querySelectorAll('.generator-slot').forEach(cell=>{
    const occupied=cell.querySelector('.lesson')!==null;
    cell.addEventListener('dragover',e=>{

      e.preventDefault();
      e.dataTransfer.dropEffect='move';
      cell.classList.add('drop-target');
    });
    cell.addEventListener('dragleave',()=>cell.classList.remove('drop-target'));
    cell.addEventListener('drop',e=>{
      e.preventDefault();
      cell.classList.remove('drop-target');

      const sourceKey=e.dataTransfer.getData('text/plain')||draggedSourceKey;
      if(!sourceKey) return;
      const target=window.DayCompare?.dropCell(cell,e.clientX)||cell;moveLessonToCell(sourceKey,target.dataset.date||'',target.dataset.slot||'',target.dataset.room||'');
    });
  });
}

function exportExcel(){
  try{
    const headers=['日付','日区分','授業ID','クラス','種別','給与区分','担当講師','教室','時間番号','開始','終了','科目','備考'];
    const rows=allRows.map(r=>Object.fromEntries(headers.map(k=>[k,r[k]||''])));
    const ws=XLSX.utils.json_to_sheet(rows,{header:headers});
    let wb;
    if(baseWorkbook){
      wb=baseWorkbook;
      wb.Sheets[baseSheetName]=ws;
      if(!wb.SheetNames.includes(baseSheetName)) wb.SheetNames.push(baseSheetName);
    }else{
      wb=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb,ws,'時間割データ');
    }
    const studentHeaders=['生徒名','クラス','優先度'];
    const studentWs=XLSX.utils.json_to_sheet(studentRows.map(r=>Object.fromEntries(studentHeaders.map(k=>[k,r[k]??'']))),{header:studentHeaders});
    wb.Sheets['生徒マスタ']=studentWs;
    if(!wb.SheetNames.includes('生徒マスタ')) wb.SheetNames.push('生徒マスタ');
    const base=String(baseWorkbookName||'schedule.xlsx').replace(/\.(xlsx|xls)$/i,'');
    const filename=base+'_updated.xlsx';
    XLSX.writeFile(wb,filename,{compression:true});
    setExcelIoStatus(`${filename} をダウンロードしました`);
  }catch(e){
    console.error(e);
    setExcelIoStatus('Excel出力エラー：'+(e.message||e),true);
  }
}
async function load(){
  try{
    await window.LessonGroups?.ready;
    await loadLessonVisibility();
    if(window.Workspace)await Workspace.refresh();
    if(window.SchoolHolidays) await SchoolHolidays.load();
    // コマ生成は schedule.xlsx だけではなく、サーバーの現在データ(data/)を正として読む。
    // これにより全体スケに残っている追加・編集済み授業も、そのままコマ生成に表示される。
    const [xr,dr,ar]=await Promise.all([
      fetch(FILE+'?v='+Date.now()).catch(()=>null),
      fetch('data_api.php?v='+Date.now(),{cache:'no-store'}).catch(()=>null),
      fetch('lesson_add_api.php?v='+Date.now(),{cache:'no-store'}).catch(()=>null)
    ]);

    // Excelは「Excel書出し」のひな形として保持する。読めなくてもサーバーデータがあれば画面は動かす。
    if(xr&&xr.ok){
      const wb=XLSX.read(await xr.arrayBuffer(),{type:'array',cellDates:true});
      baseWorkbook=wb;
      baseWorkbookName='schedule.xlsx';
      baseSheetName=chooseScheduleSheet(wb);
      await loadStudentMaster(wb);
    }

    let loadedFromServer=false;
    if(dr&&dr.ok){
      const dj=await dr.json();
      if(dj&&dj.ok&&dj.initialized&&Array.isArray(dj.schedule)){
        // サーバーの現在データを編集用の基底にも保持する。
        // これを allRows だけに入れると、ドラッグ/編集後の applyEdits() で全件が空になるため。
        excelRows=dj.schedule.filter(r=>!String(r._sourceKey||'').startsWith('ADD:')).map(normalize);
        addedRows=dj.schedule.filter(r=>String(r._sourceKey||'').startsWith('ADD:')).map(normalize);
        edits={};
        applyEdits();
        if(Array.isArray(dj.students)){
          studentRows=dj.students.map(normalizeStudentRow).filter(r=>r['クラス']);
        }
        loadedFromServer=true;
      }
    }

    if(!loadedFromServer){
      // 初期化前の環境だけ従来方式(schedule.xlsx + added/edited)へフォールバック。
      if(!(xr&&xr.ok)) throw new Error('現在の時間割データを読み込めません');
      const ws=baseWorkbook.Sheets[baseSheetName];
      excelRows=XLSX.utils.sheet_to_json(ws,{defval:''}).map(normalize);
      addedRows=[];
      edits={};
      if(ar&&ar.ok){
        const j=await ar.json();
        if(j.ok&&Array.isArray(j.rows)) addedRows=j.rows.map(normalize);
        if(j.ok&&j.edits&&typeof j.edits==='object') edits=j.edits;
      }
      applyEdits();
    }

    refreshChoices();
    if(window.GeneratorExtras) GeneratorExtras.refresh();
    $('excelIoStatus').textContent='最新の授業を表示しています。';
    render();
    const linkedDate=new URLSearchParams(location.search).get('linkedDate');
    if(linkedDate&&/^\d{4}-\d{2}-\d{2}$/.test(linkedDate)&&!window.__generatorLinkedDate){
      window.__generatorLinkedDate=true;const jump=$('historyJump');if(jump){jump.value=linkedDate;jump.dispatchEvent(new Event('change',{bubbles:true}));}
      $('status').textContent='授業を連結しました。コマを押すと共通の詳細を開けます。';
    }
    const openSource=new URLSearchParams(location.search).get('openSource');
    if(openSource&&!window.__generatorOpenedSource){const target=allRows.find(r=>r._sourceKey===openSource);if(target){window.__generatorOpenedSource=true;openEditModal(target);}}
  }catch(e){
    console.error(e);
    $('status').textContent='読込エラー：'+e.message;
  }
}


const quickAddDate=$('quickAddDate');
if(quickAddDate && !quickAddDate.value){
  const d=new Date(); d.setDate(d.getDate()+1);
  quickAddDate.value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
if($('quickAddLesson')) $('quickAddLesson').onclick=()=>{
  const iso=String($('quickAddDate')?.value||'').trim();
  const slot=String($('quickAddSlot')?.value||'①').trim();
  if(!iso){ setExcelIoStatus('追加する日付を選んでください',true); return; }
  openAddModal(isoToGeneratorDate(iso),slot,'');
};
if($('fSlot')) $('fSlot').addEventListener('change',()=>{
  const slot=$('fSlot').value;
  if(SLOTS[slot]){ $('fStart').value=SLOTS[slot][0]; $('fEnd').value=SLOTS[slot][1]; }
});

['teacherFilter','classFilter','showPast'].forEach(id=>$(id).addEventListener('change',render));
$('clearFilters').onclick=()=>{
  $('teacherFilter').value='';
  $('classFilter').value='';
  render();
};
$('modalClose').onclick=$('cancelAdd').onclick=closeModal;
// Close only clicks that start and finish on the backdrop, not text-selection drags.
let generatorBackdropPressed=false;
$('modal').addEventListener('pointerdown',e=>{generatorBackdropPressed=e.target===$('modal');});
$('modal').addEventListener('click',e=>{
  const outside=e.target===$('modal')&&generatorBackdropPressed;
  generatorBackdropPressed=false;
  if(outside)requestCloseModal();
});
$('saveAdd').onclick=saveForm;
$('deleteLesson').onclick=(e)=>{e.preventDefault();e.stopPropagation();deleteCurrentLesson();};
$('duplicateNextLesson').onclick=duplicateLessonToNextSlot;
$('saveTeacherSharedMemo').onclick=saveGeneratorTeacherMemo;
$('saveGeneratorAttendance').onclick=(e)=>{e.preventDefault();e.stopPropagation();persistGeneratorAttendance();};
$('loadExcel').onclick=importSelectedExcel;
$('exportExcel').onclick=exportExcel;

const futureToggle=$('toggleFutureAddPanel');
if(futureToggle){
  futureToggle.onclick=()=>{
    const body=$('futureAddPanelBody');
    if(!body) return;
    const open=body.classList.contains('hidden');
    body.classList.toggle('hidden',!open);
    futureToggle.textContent=open?'閉じる':'開く';
  };
}
$('toggleMasterPanel').onclick=()=>{
  const body=$('masterPanelBody');
  const open=body.classList.contains('hidden');
  body.classList.toggle('hidden',!open);
  $('toggleMasterPanel').textContent=open?'閉じる':'開く';
  if(open) renderMasterList();
};
$('addMasterClass').onclick=addMasterClass;
$('addMasterStudent').onclick=addMasterStudent;
['masterClassFilter','masterSortField','masterSortDir'].forEach(id=>$(id).addEventListener('change',renderMasterList));
$('masterSearch').addEventListener('input',renderMasterList);
$('masterClearFilters').onclick=()=>{
  $('masterSearch').value='';
  $('masterClassFilter').value='';
  $('masterSortField').value='class';
  $('masterSortDir').value='asc';
  renderMasterList();
};

const lessonVisibilityToggle=$('toggleLessonVisibilityPanel');
if(lessonVisibilityToggle){
  lessonVisibilityToggle.onclick=()=>{
    const body=$('lessonVisibilityPanelBody');
    const open=body.classList.contains('hidden');
    body.classList.toggle('hidden',!open);
    lessonVisibilityToggle.textContent=open?'閉じる':'開く';
    if(open) renderLessonVisibilityList();
  };
}
if($('lessonVisibilityShowAll')) $('lessonVisibilityShowAll').onclick=async()=>{
  try{await showAllLessonsInChoices();}catch(e){$('lessonVisibilityStatus').textContent='保存失敗：'+(e.message||e);}
};

$('fTypeSelect').addEventListener('change',()=>{
  const custom=$('fTypeSelect').value==='__CUSTOM__';
  $('fTypeCustom').classList.toggle('hidden',!custom);
  if(custom) $('fTypeCustom').focus();
});


$('fRoomSelect').addEventListener('change',()=>{
  const custom=$('fRoomSelect').value==='__CUSTOM__';
  $('fRoomCustom').classList.toggle('hidden',!custom);
  if(custom) $('fRoomCustom').focus();
  else $('fRoomCustom').value='';
});

[
  ['fClassSelect','fClassCustom'],
  ['fTeacherSelect','fTeacherCustom'],
  ['fSubjectSelect','fSubjectCustom']
].forEach(([selectId,customId])=>{
  $(selectId).addEventListener('change',()=>{
    const custom=$(selectId).value==='__CUSTOM__';
    $(customId).classList.toggle('hidden',!custom);
    if(custom) $(customId).focus();
    else $(customId).value='';
  });
});




$('excelUpload').addEventListener('change',()=>{
  const file=$('excelUpload').files && $('excelUpload').files[0];
  if(file) setExcelIoStatus(`${file.name} を選択しました。「Excelを読み込む」を押してください。`);
});

loadGeneratorDailyNotes().then(n=>{generatorDailyNotes=n||{}; if(document.getElementById('grid')) render();});
load();

window.Generator={hasDraft:()=>!$('modal').classList.contains('hidden')&&generatorModalHasChanges(),saveContext:generatorSaveContext,isCurrentSave:generatorSaveIsCurrent,markSaved:markGeneratorFieldsSaved,currentRow:currentModalRow,reload:load,render,refreshChoices,rows:()=>allRows,students:()=>studentRows,eventKey:generatorEventKey,open:openEditModal};
document.addEventListener('history-window-change',render);
})();

