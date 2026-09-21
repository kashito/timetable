const FILE='schedule.xlsx';
const SLOTS={"①":["13:30","14:10"],"②":["14:20","15:00"],"③":["15:10","15:50"],"④":["16:00","16:40"],"⑤":["16:50","17:30"],"⑥":["17:40","18:20"],"⑦":["18:30","19:10"],"⑧":["19:20","20:00"],"⑨":["20:10","20:50"],"⑩":["21:00","21:40"],"⑪":["21:50","22:30"]};
const SLOT_KEYS=Object.keys(SLOTS);
let rows=[],scheduleLoaded=false,calendarDays=7,calendarStart='',calendarAvailable=0;
const progressiveCalendar=document.body.classList.contains('compact-whole-schedule');
window.getCurrentScheduleRows=()=>rows.map(r=>({date:r.date,teacher:r.teacher,slot:r.slot,dayType:r.dayType}));
const mode=document.body.dataset.mode==='teacher'?'teacher':'student';
const $=id=>document.getElementById(id);
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function isIrregularTime(r){
  const slot=String(r.slot||'').trim();
  const standard=SLOTS[slot];
  if(!standard) return false;
  return (r.start && r.start!==standard[0]) || (r.end && r.end!==standard[1]);
}
function normalizeExcelTime(v){
  if(v===''||v===null||v===undefined) return '';
  const toTime=n=>{
    const fraction=((Number(n)%1)+1)%1;
    let mins=Math.round(fraction*1440);
    if(mins>=1440) mins=0;
    return `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
  };
  if(typeof v==='number'&&Number.isFinite(v)) return toTime(v);
  const s=String(v).trim();
  if(/^-?\d+(\.\d+)?$/.test(s)){
    const n=Number(s);
    if(Number.isFinite(n)&&n>=0&&n<2) return toTime(n);
  }
  const m=s.match(/^(\d{1,2}):(\d{2})/);
  return m?`${m[1].padStart(2,'0')}:${m[2]}`:s;
}

function normalizeExcelDate(v){
  if(v===null||v===undefined||v==='') return '';

  const serialToDate=(n)=>{
    const p=XLSX.SSF.parse_date_code(Number(n));
    if(!p) return '';
    return `${p.y}-${String(p.m).padStart(2,'0')}-${String(p.d).padStart(2,'0')}`;
  };

  if(typeof v==='number' && Number.isFinite(v)){
    return serialToDate(v);
  }

  const s=String(v).trim();

  // Numeric string from WEB editor / JSON, e.g. "46224"
  if(/^\d+(\.\d+)?$/.test(s)){
    const n=Number(s);
    if(Number.isFinite(n) && n>20000){
      return serialToDate(n);
    }
  }

  const m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if(m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;

  return '';
}



function normalize(r){
  const slot = String(r['時間番号'] || '').trim();
  const cls = String(r['クラス'] || '').trim();
  const type = String(r['種別'] || '').trim();
  const teacher = String(r['担当講師'] || '').trim();
  const subjects = String(r['科目'] || '').split(/[,、，]/).map(x=>x.trim()).filter(Boolean);
  const manualId = String(r['授業ID'] || '').trim();
  const autoId = [cls,type,teacher,subjects.join('+')].filter(Boolean).join('|');

  const manualStart = normalizeExcelTime(r['開始']);
  const manualEnd   = normalizeExcelTime(r['終了']);
  const standard = SLOTS[slot] || ['', ''];

  return {
    date: normalizeExcelDate(r['日付']),
    dayType: String(r['日区分'] || '').trim(),
    id: manualId || autoId,
    cls,
    type,
    teacher,
    room: String(r['教室'] || '').trim(),
    slot,
    start: manualStart || standard[0],
    end: manualEnd || standard[1],
    subjects,
    note: String(r['備考'] || '').trim(),
    priority: Number(r['優先度'] || 0) || 0,
    payrollCategory: String(r['給与区分'] || '').trim(),
    sourceKey: String(r['_sourceKey'] || '').trim()
  };
}
function displayDayType(v,date){
  if(/^OFF$/i.test(String(v))&&date)return SchoolHolidays.emptyDayLabel(date);
  return v==='休み'?'休講日':v;
}
function displayType(r){if(mode==='student') return r.type==='補習'?'補習':(r.type?'授業':'');return r.type}
function typeClass(t){return t==='補習'?'support':t==='演習'?'exercise':t==='テスト'?'test':'lesson'}
function uniq(key){return [...new Set(rows.flatMap(r=>key==='subjects'?r.subjects:[r[key]]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'ja'))}
function fillSelect(id,vals){const el=$(id);if(!el)return;const cur=el.value;el.innerHTML='<option value="">すべて</option>'+vals.map(v=>`<option>${esc(v)}</option>`).join('');if(vals.includes(cur))el.value=cur}
function refreshFilters(){fillSelect('classFilter',uniq('cls'));fillSelect('teacherFilter',uniq('teacher'));fillSelect('roomFilter',uniq('room'));fillSelect('typeFilter',mode==='student'?['授業','補習']:uniq('type'));if(mode==='teacher')fillSelect('subjectFilter',uniq('subjects'))}
function currentFilters(){return {cls:$('classFilter')?.value||'',teacher:$('teacherFilter')?.value||'',room:$('roomFilter')?.value||'',type:$('typeFilter')?.value||'',subject:$('subjectFilter')?.value||''}}
function filterMatch(r){const f=currentFilters();return (!f.cls||r.cls===f.cls)&&(!f.teacher||r.teacher===f.teacher)&&(!f.room||r.room===f.room)&&(!f.type||displayType(r)===f.type)&&(!f.subject||r.subjects.includes(f.subject))}
function visibleRows(){return rows.filter(r=>r.dayType||filterMatch(r))}
function weekdays(d){return ['日','月','火','水','木','金','土'][new Date(d+'T00:00:00').getDay()]}
const TEACHER_ROOMS=['','青','黄','白','ガラス','PC','自宅可','__OTHER__'];
const TEACHER_ROOM_LABEL={'':'未設定','青':'青','黄':'黄','白':'白','ガラス':'ガラス','PC':'PC','自宅可':'自宅可','__OTHER__':'その他'};
function teacherRoomKey(v){
  const s=String(v||'').trim();
  if(!s)return '';
  return TEACHER_ROOMS.includes(s)&&s!=='__OTHER__'?s:'__OTHER__';
}
function teacherRoomClass(room){
  switch(room){
    case '青':return 'room-blue'; case '黄':return 'room-yellow'; case '白':return 'room-white';
    case 'ガラス':return 'room-glass'; case 'PC':return 'room-pc'; case '自宅可':return 'room-home';
    case '__OTHER__':return 'room-other'; default:return 'room-unset';
  }
}
function lessonAttributes(r){
  const seriesId=r.id||[r.cls,r.type,r.teacher,r.subjects.join('+')].filter(Boolean).join('|');
  const occurrenceKey=[r.date,r.slot,r.cls,r.teacher,r.type,r.subjects.join('+')].join('|');
  return `data-key="${esc(occurrenceKey)}"
    data-source-key="${esc(r.sourceKey||'')}"
    data-series-id="${esc(seriesId)}"
    data-class="${esc(r.cls)}"
    data-teacher="${esc(r.teacher||'')}"
    data-type="${esc(r.type||'')}"
    data-room="${esc(r.room||'')}"
    data-subject="${esc(r.subjects.join('+'))}"
    data-date="${esc(r.date)}"
    data-slot="${esc(r.slot)}"`;
}
function eventHTML(r){
  const t=displayType(r);
  const icon=r.type==='演習'?'✏️':r.type==='補習'?'🧩':r.type==='テスト'?'📝':'📘';
  const roomClass=r.room?' room-'+r.room:'';
  const subjects=mode==='teacher'&&r.subjects.length?r.subjects.join('・'):'';
  const irregular=r._linked?r._linked.members.some(isIrregularTime):isIrregularTime(r);
  return `<div class="event ${typeClass(r.type)}${roomClass}"
    ${lessonAttributes(r)} ${window.LinkedSchedule?.attributes(r)||''} data-start="${esc(r.start)}" data-end="${esc(r.end)}"
    ${mode==='teacher'&&r.sourceKey?'draggable="true"':''}>
    <div class="event-title">${esc(r.cls||t||'予定')}</div>
    ${mode==='teacher'&&(r.teacher||r._linked?.mealBreak)?`<div class="event-teacher">担当 ${esc(r.teacher||'未設定')}${r._linked&&subjects?' ｜ '+esc(subjects):''}${r._linked?.mealBreak?' ｜ <span class="linked-meal-notice" title="途中で食事休憩が入ります">🍴 食事休憩あり</span>':''}</div>`:''}
    <div class="event-meta">${esc(window.LinkedSchedule?.label(r)||r.slot||'')} ${esc(r.start)}-${esc(r.end)}${mode!=='teacher'&&r.teacher?' ｜ 担当 '+esc(r.teacher):''}${subjects&&!r._linked?' ｜ '+esc(subjects):''}</div>
    <div class="event-badges">
      ${t?`<span class="event-badge lesson-type-badge">${icon} ${esc(t)}</span>`:''}
      ${r.room?`<span class="event-badge lesson-room-badge">🏫 ${esc(r.room)}</span>`:''}
      ${irregular?`<span class="event-badge irregular-time" title="イレギュラー時間">⚠ イレギュラー時間</span>`:''}
    </div>
    ${window.LinkedSchedule?.controls(r)||''}
  </div>`
}
function continuousDates(){
  const actual=uniq('date').filter(Boolean).sort();
  const parse=s=>{const m=String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3])):null};
  const fmt=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const today=new Date(); today.setHours(0,0,0,0);
  let first=actual.length?parse(actual[0]):new Date(today);
  if(!first) first=new Date(today);
  // 終了日より先も常に120日先まで表示。登録済み日がさらに先ならそこまで伸ばす。
  let end=new Date(today); end.setDate(end.getDate()+120);
  if(actual.length){const last=parse(actual[actual.length-1]); if(last&&last>end) end=last;}
  // 過去日の非表示は既存の teacher-past-filter-fix.js に任せるため、先頭は実データ最初の日を維持。
  // 教師用全体ページは、過去日をDOM生成後にdisplay:noneにするとCSS Gridが詰め直されて
  // 日付・教室・コマが横方向に崩れる。最初から表示対象の日付だけ生成する。
  if(mode==='teacher'){
    const pastToggle=document.getElementById('pastDayToggle');
    const showPast=!!(pastToggle&&pastToggle.checked);
    if(window.HistoryWindow)first=new Date(HistoryWindow.start()+'T00:00:00');else if(!showPast&&first<today)first=new Date(today);
  }
  const out=[];
  for(let d=new Date(first); d<=end; d.setDate(d.getDate()+1)) out.push(fmt(d));
  return out;
}
const DAILY_NOTE_API='daily_note_api.php';
async function loadDailyNotes(){
  try{const r=await fetch(DAILY_NOTE_API+'?v='+Date.now(),{cache:'no-store'}); if(!r.ok)return {}; const j=await r.json(); return j.notes||{};}catch(e){return {}};
}
async function saveDailyNote(date,text){
  const r=await fetch(DAILY_NOTE_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date,text})});
  const j=await r.json().catch(()=>({})); if(!r.ok||!j.ok) throw new Error(j.error||'メモ保存失敗'); return true;
}
let dailyNotes={};
function isSchoolHoliday(date){return !!(window.SchoolHolidays&&SchoolHolidays.isHoliday(date));}
function holidayControl(date){const on=isSchoolHoliday(date);return `<label class="school-holiday-toggle" title="塾の休講日として表示"><input type="checkbox" class="school-holiday-check" data-date="${esc(date)}" ${on?'checked':''}><span>塾休み</span></label>`;}
function bindSchoolHolidayChecks(root=document){root.querySelectorAll('.school-holiday-check').forEach(el=>{el.addEventListener('change',async e=>{e.stopPropagation();const before=!el.checked;el.disabled=true;try{await SchoolHolidays.set(el.dataset.date,el.checked);render();}catch(err){el.checked=before;alert(err.message||'休講日を保存できませんでした');}finally{el.disabled=false;}});});}
function bindDailyNotes(root=document){
  root.querySelectorAll('.day-note-text').forEach(el=>{
    let timer=null;
    el.addEventListener('input',()=>{
      const st=el.closest('.day-note-box')?.querySelector('.day-note-status'); if(st)st.textContent='未保存';
      clearTimeout(timer); timer=setTimeout(async()=>{try{await saveDailyNote(el.dataset.date,el.value); dailyNotes[el.dataset.date]=el.value; if(st)st.textContent='保存済み';}catch(e){if(st)st.textContent='保存失敗';}},700);
    });
  });
}
function renderCalendar(append=false){
  const allDates=continuousDates();calendarAvailable=allDates.length;
  const dates=progressiveCalendar?allDates.slice(append?Math.max(0,calendarDays-7):0,calendarDays):allDates;
  const filtered=rows.filter(r=>!r.dayType&&filterMatch(r)),lanes=new Map();
  for(const row of filtered){const key=JSON.stringify([row.date,teacherRoomKey(row.room)]);if(!lanes.has(key))lanes.set(key,[]);lanes.get(key).push(row);}
  let html='';

  if(mode==='teacher'){
    // 全体ページはコマ生成ページの見た目・行構成をそのまま踏襲する。
    if(!append)html='<div class="generator-grid teacher-room-calendar teacher-generator-layout"><div class="cell head">日付・教室・予定メモ</div>';
    if(!append)SLOT_KEYS.forEach(slot=>{const t=SLOTS[slot];html+=`<div class="cell head slot-head"><strong>${slot}</strong><small>${t[0]}<br>〜${t[1]}</small></div>`});
    dates.forEach(d=>{
      const special=rows.find(r=>r.date===d&&r.dayType);
      // v20: 日付・予定メモを教室行から完全分離。未設定は他教室と同じ独立行にする。
      html+=`<div class="cell lane-label teacher-day-note-cell date-start whole-day-collapsed ${isSchoolHoliday(d)?'school-holiday-cell':''}"><div class="sticky-date-box"><strong class="sticky-date-line">${esc(d.slice(5).replace('-','/'))}（${weekdays(d)}）</strong><button type="button" class="whole-day-toggle" data-day-expand="${esc(d)}" aria-expanded="false" aria-controls="whole-day-${esc(d)}">＋ 詳しく</button>${holidayControl(d)}<div class="day-note-box"><textarea class="day-note-text generator-day-note" data-date="${esc(d)}" placeholder="生徒の予定・個人メモ">${esc(dailyNotes[d]||'')}</textarea><span class="day-note-status generator-day-note-status"></span></div></div></div>`;
      html+=`<section id="whole-day-${esc(d)}" class="cell teacher-day-info date-start whole-day-collapsed" data-info-date="${esc(d)}" aria-label="${esc(d)}の学校行事・連絡"><div class="whole-day-events"><strong class="whole-day-events-label">学校行事・お知らせ</strong><div class="ce-day-events" data-calendar-date="${esc(d)}" data-calendar-full="1"></div></div><div class="whole-day-contacts" data-contact-date="${esc(d)}"></div></section>`;
      if(special){
        html+=`<div class="cell lane-label room-unset"><span class="room-chip">休講</span></div><div class="cell special-span room-special-span"><div class="event special special-day" data-key="special-${esc(d)}">${esc(displayDayType(special.dayType,d))}${special.note?'<div class="event-meta">'+esc(special.note)+'</div>':''}</div></div>`;
        return;
      }
      TEACHER_ROOMS.forEach((room)=>{
        const rc=teacherRoomClass(room);
        html+=`<div class="cell lane-label ${rc}"><span class="room-chip">${TEACHER_ROOM_LABEL[room]}</span></div>`;
        const dayRows=lanes.get(JSON.stringify([d,room]))||[];
        const linked=window.LinkedSchedule?.lanes(dayRows);
        const hasSpan=linked?.units.some(u=>u.end>u.start);
        SLOT_KEYS.forEach((slot,index)=>{
          const content=hasSpan?Array.from({length:linked.count},(_,lane)=>{const u=linked.units.find(u=>u.start===index&&u.lane===lane);return `<div class="linked-calendar-track">${u?eventHTML(u.row):''}</div>`;}).join(''):(linked?linked.units.filter(u=>u.start===index).map(u=>u.row):dayRows.filter(r=>r.slot===slot)).map(eventHTML).join('');
          html+=`<div class="cell generator-slot teacher-drop-slot ${rc}" data-date="${esc(d)}" data-slot="${esc(slot)}" data-room="${esc(room)}">${content}</div>`;
        });
      });
    });
    if(!append)html+='</div>';
  }else{
    html='<div class="calendar horizontal-time"><div class="cell head date-head">日付・予定メモ</div>';
    SLOT_KEYS.forEach(slot=>{const t=SLOTS[slot];html+=`<div class="cell head slot-head"><strong>${slot}</strong><small>${t[0]}<br>〜${t[1]}</small></div>`});
    dates.forEach(d=>{const special=rows.find(r=>r.date===d&&r.dayType);html+=`<div class="cell date-cell"><strong>${esc(d.slice(5).replace('-','/'))}</strong><small>(${weekdays(d)})</small><div class="ce-day-events" data-calendar-date="${esc(d)}"></div><div class="day-note-box"><textarea class="day-note-text" data-date="${esc(d)}" placeholder="生徒の予定・個人メモ">${esc(dailyNotes[d]||'')}</textarea><span class="day-note-status"></span></div></div>`;if(special){html+=`<div class="cell special-span"><div class="event special special-day" data-key="special-${esc(d)}">${esc(displayDayType(special.dayType,d))}${special.note?'<div class="event-meta">'+esc(special.note)+'</div>':''}</div></div>`}else{SLOT_KEYS.forEach(slot=>{const es=filtered.filter(r=>r.date===d&&r.slot===slot);html+=`<div class="cell slot-cell">${es.map(eventHTML).join('')}</div>`})}});html+='</div>';
  }
  const fresh=document.createElement('div');fresh.innerHTML=html;
  bindEvents(fresh);bindDailyNotes(fresh);if(mode==='teacher'){bindTeacherDragAndDrop(fresh);bindSchoolHolidayChecks(fresh);}
  if(append)$('schedule').querySelector('.teacher-generator-layout').append(...fresh.childNodes);
  else $('schedule').replaceChildren(...fresh.childNodes);
  window.LinkedSchedule?.layout();
  if(progressiveCalendar){
    let more=$('wholeMoreDays');if(!more){more=document.createElement('button');more.id='wholeMoreDays';more.type='button';more.onclick=showMoreCalendarDays;$('schedule').after(more);}
    more.textContent='次の7日を表示 ↓';more.hidden=calendarDays>=calendarAvailable;
  }
}

let teacherDraggedSourceKey='';
let teacherDragJustFinished=false;
function rowToServerFormat(r,date,slot,room){
  const times=SLOTS[slot]||[r.start||'',r.end||''];
  return {
    '日付':date,
    '日区分':'',
    '授業ID':r.id||'',
    'クラス':r.cls||'',
    '種別':r.type||'',
    '給与区分':r.payrollCategory||'',
    '担当講師':r.teacher||'',
    '教室':room==='__OTHER__'?'':room,
    '時間番号':slot,
    '開始':times[0]||'',
    '終了':times[1]||'',
    '科目':(r.subjects||[]).join('、'),
    '備考':r.note||'',
    '優先度':r.priority||0
  };
}
async function moveTeacherLesson(sourceKey,date,slot,room){
  const row=rows.find(r=>r.sourceKey===sourceKey);
  if(!row){alert('移動対象の授業を特定できませんでした。再読み込みしてください。');return;}
  if(window.LessonGroups?.forSource(sourceKey)){if(await GroupScheduleActions.move(sourceKey,{date,slot,room})){await LessonGroups.refresh();await load();await window.LessonFixed?.refreshAll();$('statusBar').textContent='連結した授業をまとめて移動しました。';}return;}
  const targetRoom=room==='__OTHER__'?'':room;
  const occupied=rows.some(r=>r.sourceKey!==sourceKey&&!r.dayType&&r.date===date&&r.slot===slot&&teacherRoomKey(r.room)===room);

  let sourceVersion,confirmedRow;
  if(Workspace.iso(row.date)!==Workspace.iso(date)){
    const result=await LessonPlacement.drop(sourceKey,{date:Workspace.iso(date),slot,room});if(!result)return;
    if(result.action==='copied'){await load();$('statusBar').textContent='元の授業を残してコピーしました。';return;}
    sourceVersion=result.version;confirmedRow=result.row;
  }
  const payload=confirmedRow?{...confirmedRow,...{日付:date,時間番号:slot,教室:targetRoom,開始:SLOTS[slot][0],終了:SLOTS[slot][1]}}:rowToServerFormat(row,date,slot,room);
  const old={date:row.date,slot:row.slot,room:row.room,start:row.start,end:row.end};
  const times=SLOTS[slot]||['',''];
  row.date=date; row.slot=slot; row.room=targetRoom; row.start=times[0]||row.start; row.end=times[1]||row.end;
  render();
  try{
    const response=await fetch('lesson_add_api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'update',sourceKey,row:payload,...(sourceVersion?{sourceVersion}:{})})});
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result.ok) throw new Error(result.error||'移動保存に失敗しました');
    await load();await window.LessonFixed?.refreshAll();
    $('statusBar').textContent='授業を移動しました。';
  }catch(e){
    row.date=old.date; row.slot=old.slot; row.room=old.room; row.start=old.start; row.end=old.end;
    render();
    alert('移動を保存できませんでした：'+(e.message||e));
  }
}
function bindTeacherDragAndDrop(root=document){
  root.querySelectorAll('.event[draggable="true"]').forEach(card=>{
    card.addEventListener('dragstart',e=>{
      teacherDraggedSourceKey=card.dataset.sourceKey||'';
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed='copyMove';
      e.dataTransfer.setData('text/plain',teacherDraggedSourceKey);
    });
    card.addEventListener('dragend',()=>{
      teacherDragJustFinished=true;
      setTimeout(()=>{teacherDragJustFinished=false},120);
      teacherDraggedSourceKey='';
      card.classList.remove('dragging');
      document.querySelectorAll('.teacher-drop-slot').forEach(c=>c.classList.remove('drop-target'));
    });
  });
  root.querySelectorAll('.teacher-drop-slot').forEach(cell=>{
    cell.addEventListener('dragover',e=>{
      const sourceKey=teacherDraggedSourceKey;
      if(!sourceKey)return;
      const occupied=[...cell.querySelectorAll('.event')].some(ev=>(ev.dataset.sourceKey||'')!==sourceKey);

      e.preventDefault();
      e.dataTransfer.dropEffect='move';
      cell.classList.add('drop-target');
    });
    cell.addEventListener('dragleave',()=>cell.classList.remove('drop-target'));
    cell.addEventListener('drop',e=>{
      e.preventDefault();
      cell.classList.remove('drop-target');
      const sourceKey=e.dataTransfer.getData('text/plain')||teacherDraggedSourceKey;
      if(!sourceKey)return;
      const occupied=[...cell.querySelectorAll('.event')].some(ev=>(ev.dataset.sourceKey||'')!==sourceKey);

      const target=window.LinkedSchedule?.dropCell(cell,e.clientX)||cell;
      moveTeacherLesson(sourceKey,target.dataset.date||'',target.dataset.slot||'',target.dataset.room||'');
    });
  });
}
function renderList(){const specials=rows.filter(r=>r.dayType).sort((a,b)=>a.date.localeCompare(b.date));const lessons=rows.filter(r=>!r.dayType&&filterMatch(r)).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));let html='<div class="list-wrap">';specials.forEach(r=>{html+=`<div class="list-item special-row"><strong>${esc(r.date)} ${esc(displayDayType(r.dayType,r.date))}</strong>${r.note?`<div class="event-meta">${esc(r.note)}</div>`:''}</div>`});lessons.forEach(r=>{html+=`<div class="list-item" ${document.body.classList.contains('compact-whole-schedule')?lessonAttributes(r):`data-key="${esc(r.id||r.date+r.slot+r.cls+r.teacher)}"`}><div class="list-top"><div><strong>${esc(r.date)} ${esc(r.slot)} ${esc(r.start)}-${esc(r.end)}</strong><br>${esc(r.cls)} ｜ ${esc(displayType(r))}</div><span class="badge">${esc(r.room||'-')}</span></div><div class="event-meta">担当 ${esc(r.teacher||'-')}${mode==='teacher'&&r.subjects.length?' ｜ '+esc(r.subjects.join('・')):''}${r.note?' ｜ '+esc(r.note):''}</div></div>`});html+='</div>';$('schedule').innerHTML=html;bindEvents()}
function render(){
  if(!scheduleLoaded)return;
  const start=window.HistoryWindow?.start()||'',dateChanged=start!==calendarStart;
  if(dateChanged){calendarStart=start;calendarDays=7;}
  if($('wholeMoreDays'))$('wholeMoreDays').hidden=$('viewSelect').value==='list';
  const position=dateChanged?null:window.HistoryWindow?.capture();
  const filteredCount=rows.filter(r=>!r.dayType&&filterMatch(r)).length,total=rows.filter(r=>!r.dayType).length;
  $('viewSelect').value==='list'?renderList():renderCalendar();
  $('statusBar').textContent=mode==='teacher'?'':`授業 ${filteredCount}件を表示中（全${total}件）。プルダウンを選ぶと、条件に一致する予定だけを表示します。`;
  if(dateChanged&&progressiveCalendar&&$('schedule').getBoundingClientRect().top<0)window.scrollTo({top:window.scrollY+$('schedule').getBoundingClientRect().top,behavior:'instant'});
  else window.HistoryWindow?.restore(position);
}
const MEMO_API='memo_api.php';
function memoKey(r){return r.id||[r.date,r.slot,r.cls,r.teacher].join('|')}
async function loadMemo(r){
  const res=await fetch(MEMO_API+'?key='+encodeURIComponent(memoKey(r))+'&v='+Date.now(),{cache:'no-store'});
  if(!res.ok) throw new Error('メモを読み込めませんでした');
  const data=await res.json();
  return data.memo||'';
}
async function saveMemo(r,text){
  const res=await fetch(MEMO_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:memoKey(r),memo:text})});
  if(!res.ok) throw new Error('メモを保存できませんでした');
  const data=await res.json();
  return !!data.ok;
}
async function showDetail(key){
  if(key.startsWith('special-'))return;
  const target=rows.find(r=>(r.id||r.date+r.slot+r.cls+r.teacher)===key);
  if(!target)return;
  const group=(target.id?rows.filter(r=>r.id===target.id):[target]).filter(r=>!r.dayType);
  let memoValue='';
  let memoLoadError='';
  if(mode==='teacher'){
    try{memoValue=await loadMemo(target)}catch(e){memoLoadError=e.message||'メモを読み込めませんでした'}
  }
  const memoHtml=mode==='teacher'?`<section class="memo-box"><h3>講師共有メモ</h3><textarea id="teacherMemo" placeholder="この授業についての共有メモを入力">${esc(memoValue)}</textarea><div class="memo-actions"><button id="saveMemoBtn" class="memo-save">共有メモを保存</button><span id="memoStatus" class="memo-status">${esc(memoLoadError)}</span></div><p class="memo-note">※このメモはサーバーに保存され、他の先生が別のPC・スマホからアクセスしても同じ内容が表示されます。</p></section>`:'';
  $('modalBody').innerHTML=`<h2>${esc(target.cls)} ${esc(displayType(target))}</h2><table class="detail-table"><tr><th>担当講師</th><td>${esc(target.teacher||'-')}</td></tr><tr><th>教室</th><td>${esc(target.room||'-')}</td></tr>${mode==='teacher'?`<tr><th>種別</th><td>${esc(target.type||'-')}</td></tr><tr><th>科目</th><td>${esc(target.subjects.join('・')||'-')}</td></tr>`:''}<tr><th>備考</th><td>${esc(target.note||'-')}</td></tr></table>${memoHtml}<h3>この授業のスケジュール一覧</h3><table class="detail-table"><thead><tr><th>日付</th><th>時間</th><th>教室</th></tr></thead><tbody>${group.sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)).map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.slot)} ${esc(r.start)}-${esc(r.end)}${isIrregularTime(r)?' <span class="irregular-inline">⚠ イレギュラー</span>':''}</td><td>${esc(r.room)}</td></tr>`).join('')}</tbody></table>`;
  $('modal').classList.remove('hidden');
  if(mode==='teacher'){
    const btn=$('saveMemoBtn');
    if(btn)btn.onclick=async()=>{
      const status=$('memoStatus');
      btn.disabled=true;
      status.textContent='保存中…';
      try{
        await saveMemo(target,$('teacherMemo').value);
        status.textContent='保存しました';
      }catch(e){status.textContent=e.message||'保存できませんでした'}
      finally{btn.disabled=false}
      setTimeout(()=>{if($('memoStatus')&&$('memoStatus').textContent==='保存しました')$('memoStatus').textContent=''},1800);
    }
  }
}
function bindEvents(root=document){root.querySelectorAll('[data-key]').forEach(e=>e.onclick=ev=>{if(ev.target.closest('[data-lesson-action]')||teacherDragJustFinished)return;showDetail(e.dataset.key)})}
window.WholeSchedule={reload:()=>load()};
async function load(){try{
  const dataPromise=(async()=>{try{const response=await fetch('data_api.php?v='+Date.now(),{cache:'no-store'});const data=await response.json();if(response.ok&&data.ok&&data.initialized&&Array.isArray(data.schedule))return data.schedule;}catch(e){}return null;})();
  const [serverRows,notes]=await Promise.all([dataPromise,loadDailyNotes(),window.LessonGroups?.ready,window.LessonFixed?.ready,window.SchoolHolidays?.load()]);
  dailyNotes=notes;let raw=serverRows;
  if(raw===null){const res=await fetch(FILE+'?v='+Date.now());if(!res.ok)throw new Error('時間割データが見つかりません');const wb=XLSX.read(await res.arrayBuffer(),{type:'array'});raw=XLSX.utils.sheet_to_json(wb.Sheets['時間割データ']||wb.Sheets[wb.SheetNames[0]],{defval:''});}
  else window.__scheduleServerLoaded=true;
  rows=raw.map(normalize).filter(r=>r.date);scheduleLoaded=true;refreshFilters();render();
}catch(e){$('statusBar').innerHTML=`<strong>読込エラー：</strong>${esc(e.message)}`;}}
function showMoreCalendarDays(){
  if(!scheduleLoaded||!progressiveCalendar||$('viewSelect').value==='list'||calendarDays>=calendarAvailable)return;
  calendarDays+=7;renderCalendar(true);
}
let calendarFrame=0;
window.addEventListener('scroll',()=>{
 if(!progressiveCalendar||calendarFrame)return;
 calendarFrame=requestAnimationFrame(()=>{calendarFrame=0;const more=$('wholeMoreDays');if(more&&!more.hidden&&window.scrollY>0&&more.getBoundingClientRect().top<innerHeight+400)showMoreCalendarDays();});
},{passive:true});
['classFilter','teacherFilter','roomFilter','typeFilter','subjectFilter','viewSelect'].forEach(id=>{const el=$(id);if(el)el.addEventListener('change',render)});$('clearFilters').onclick=()=>{['classFilter','teacherFilter','roomFilter','typeFilter','subjectFilter'].forEach(id=>{const el=$(id);if(el)el.value=''});render()};$('modalClose').onclick=()=>{$('modal').classList.add('hidden')};$('modal').onclick=e=>{if(e.target===$('modal'))$('modal').classList.add('hidden')};load();

document.addEventListener('history-window-change',()=>{if(typeof render==='function')render();});
