<?php require_once __DIR__.'/admin_page_guard.php'; requireAdminPage('schedule_generator.html'); ?>
<!doctype html>
<html lang="ja">
<head><script src="staff-auth.js?v=20260917-r56-ready" data-staff="required"></script><script src="workspace-ui.js?v=20260921-scroll"></script><script src="lesson-groups.js?v=20260916-r53"></script><script src="history-window.js?v=20260920-keep-date"></script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>コマ生成・授業管理2026</title>
<link rel="stylesheet" href="schedule-generator.css?v=20260910-r1">
<script src="vendor/xlsx.full.min.js"></script>

<style id="generator-nowline-modal-layer-fix">
body:has(#modal:not(.hidden)) .generator-nowline,
body:has(#modal:not(.hidden)) .generator-nowline-label{
  display:none!important;
}
#modal{z-index:20000!important}
#modal .modal-card{position:relative;z-index:20001!important}
</style>


<style id="generator-nowline-today-only-v2">
.generator-today-nowline{position:absolute;top:0;bottom:0;width:3px;background:#ef4444;z-index:20;pointer-events:none}
.generator-today-nowline-label{position:absolute;top:0;transform:translate(-50%,-100%);background:#ef4444;color:#fff;padding:4px 7px;border-radius:999px;font-size:11px;font-weight:800;line-height:1;white-space:nowrap;z-index:21}
body:has(#modal:not(.hidden)) .generator-today-nowline,body:has(#modal:not(.hidden)) .generator-today-nowline-label{display:none!important}
</style>

<link rel="stylesheet" href="teacher-availability.css?v=20260912-r25">
<script src="student-attachments.js?v=20260910-r5"></script>
<style id="school-holiday-generator-v63">.school-holiday-toggle{display:inline-flex;align-items:center;gap:4px;margin:4px 0 2px;font-size:12px;font-weight:800;color:#9f1239;cursor:pointer}.school-holiday-toggle input{accent-color:#ec4899}.school-holiday-cell{background:#fce7f3!important}.school-holiday-cell .sticky-date{color:#9d174d!important}</style>
<style id="confirmed-date-v67">.confirmed-date-bar{display:flex;align-items:center;gap:8px;padding:8px 12px;margin:8px 0;background:#fff;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;font-weight:800}.confirmed-date-bar input{padding:6px 8px;border:1px solid #cbd5e1;border-radius:8px}.confirmed-date-status{color:#64748b;font-size:12px}</style>
<style id="modal-sticky-head-v67">#modal .modal-head{position:sticky;top:-22px;z-index:50;background:#fff;padding:14px 0 12px;border-bottom:1px solid #e2e8f0;margin-bottom:12px}</style><link rel="stylesheet" href="workspace-ui.css?v=20260912-r24"><script defer src="lesson-fixed.js?v=20260913-r28"></script><link rel="stylesheet" href="quick-controls.css?v=20260917-r55-ready"><script defer src="attendance-actions.js?v=20260912-r17"></script><script defer src="generator-view.js?v=20260921-scroll"></script><link rel="stylesheet" href="generator-date-navigation.css?v=20260921-scroll"><link rel="stylesheet" href="lesson-group.css?v=20260913-r28"><link rel="stylesheet" href="generator-fixed-focus.css?v=20260911-r10"><script defer src="generator-fixed-focus.js?v=20260915-r50"></script><link rel="stylesheet" href="class-tree-picker.css?v=20260911-r11"><script defer src="class-tree-picker.js?v=20260911-r12"></script><link rel="stylesheet" href="calendar-events.css?v=20260912-r17"><link rel="stylesheet" href="shared-notes.css?v=20260916-r54-ready"><script defer src="shared-notes.js?v=20260916-r54-ready"></script><script defer src="lesson-placement.js?v=20260912-r21"></script><link rel="stylesheet" href="student-contacts.css?v=20260912-r24"><script defer src="student-contacts.js?v=20260912-r24"></script><link rel="stylesheet" href="presence.css?v=20260915-r45"><script defer src="presence.js?v=20260915-r45"></script><script defer src="staff-contacts.js?v=20260917-r55-ready"></script><script defer src="group-schedule-actions.js?v=20260920-linked-create"></script><link rel="stylesheet" href="whole-day-info.css?v=20260920-generator-layout"><script defer src="whole-day-info.js?v=20260920-generator-layout"></script><link rel="stylesheet" href="lesson-repeat.css?v=20260921-repeat"><script defer src="lesson-repeat.js?v=20260921-repeat"></script><link rel="stylesheet" href="whole-time-header.css?v=20260921-scroll"><script defer src="whole-time-header.js?v=20260921-scroll"></script></head>
<body>
<header>
  <div>
    <strong>進学教室 志学館</strong>
    <h1>コマ生成・授業管理</h1>
  </div>
  <div class="header-actions">
    <a href="payroll.html" style="display:inline-flex;align-items:center;padding:8px 12px;border-radius:8px;background:#0f766e;color:white;text-decoration:none;font-weight:700">給与計算</a>
    <a href="teacher_ng.html" style="display:inline-flex;align-items:center;padding:8px 12px;border-radius:8px;background:#b45309;color:white;text-decoration:none;font-weight:700">講師NG管理</a>
    <label><input type="checkbox" id="showPast"> 過ぎた日も表示</label>
    <label class="excel-upload-label">
      <span>Excelを選択</span>
      <input id="excelUpload" type="file" accept=".xlsx,.xls">
    </label>
    <button id="loadExcel" type="button">Excelを読み込む</button>
    <button id="exportExcel" type="button">更新Excelをダウンロード</button>
  </div>
<a href="lesson_records.html" style="margin-left:8px;font-weight:800">授業カルテ一覧</a></header>

<main>
<div class="confirmed-date-bar"><label>確定日 <input id="scheduleConfirmedDate" type="date"></label><span id="scheduleConfirmedStatus" class="confirmed-date-status"></span><label>生徒への非公開開始日 <input id="schedulePrivateFrom" type="date"></label><span id="schedulePrivateStatus" class="confirmed-date-status"></span></div>
  <div id="excelIoStatus" class="excel-io-status">サーバーの時間割Excelを使用中</div>

  <section class="panel master-panel">
    <div class="master-panel-head">
      <strong>クラス・参加生徒管理</strong>
      <button id="toggleMasterPanel" type="button">開く</button>
    </div>
    <div id="masterPanelBody" class="master-panel-body hidden">
      <div class="master-entry-grid">
        <label>クラス名<input id="masterClass" type="text" placeholder="例：中3総合"></label>
        <div class="master-entry-action"><button id="addMasterClass" type="button">クラスを追加</button></div>
        <label>参加生徒<input id="masterStudent" type="text" placeholder="生徒名"></label>
        <label>優先度<input id="masterPriority" type="number" value="0" step="1"></label>
        <div class="master-entry-action"><button id="addMasterStudent" type="button" class="primary">参加生徒を登録</button></div>
      </div>
      <div id="masterMsg" class="master-msg"></div>
      <div class="master-tools" aria-label="クラス参加生徒の絞り込みと並べ替え">
        <label>検索
          <input id="masterSearch" type="search" placeholder="クラス名・生徒名で検索">
        </label>
        <label>クラス絞り込み
          <select id="masterClassFilter"><option value="">すべて</option></select>
        </label>
        <label>並べ替え
          <select id="masterSortField">
            <option value="class">クラス</option>
            <option value="student">生徒名</option>
            <option value="priority">優先度</option>
          </select>
        </label>
        <label>順序
          <select id="masterSortDir">
            <option value="asc">昇順</option>
            <option value="desc">降順</option>
          </select>
        </label>
        <button id="masterClearFilters" type="button">絞り込み解除</button>
      </div>
      <div id="masterResultCount" class="master-result-count"></div>
      <div id="masterList" class="master-list"></div>
    </div>
  </section>


  <section class="panel lesson-visibility-panel">
    <div class="master-panel-head">
      <strong>授業（クラス名）の選択表示</strong>
      <button id="toggleLessonVisibilityPanel" type="button">開く</button>
    </div>
    <div id="lessonVisibilityPanelBody" class="lesson-visibility-body hidden">
      <div class="lesson-visibility-help">普段使わない授業のチェックを外すと、授業追加時の「クラス」選択肢から隠れます。既に配置済みの授業は消えません。</div>
      <div class="lesson-visibility-actions">
        <button id="lessonVisibilityShowAll" type="button">すべて表示</button>
      </div>
      <div id="lessonVisibilityList" class="lesson-visibility-list"></div>
      <div id="lessonVisibilityStatus" class="master-msg"></div>
    </div>
  </section>

  <section class="panel controls">
    <label>担当講師
      <select id="teacherFilter"><option value="">すべて</option></select>
    </label>
    <label>クラス
      <select id="classFilter"><option value="">すべて</option></select>
    </label>
    <button id="clearFilters" type="button">絞り込み解除</button>
  </section>

  <section class="panel future-add-panel">
    <div class="future-add-panel-head">
      <strong>新しい日付に授業を追加</strong>
      <button id="toggleFutureAddPanel" type="button">開く</button>
    </div>
    <div id="futureAddPanelBody" class="hidden controls future-add-controls">
      <label>日付<input id="quickAddDate" type="date"></label>
      <label>時間番号
        <select id="quickAddSlot">
          <option value="①">① 13:30-14:10</option><option value="②">② 14:20-15:00</option>
          <option value="③">③ 15:10-15:50</option><option value="④">④ 16:00-16:40</option>
          <option value="⑤">⑤ 16:50-17:30</option><option value="⑥">⑥ 17:40-18:20</option>
          <option value="⑦">⑦ 18:30-19:10</option><option value="⑧">⑧ 19:20-20:00</option>
          <option value="⑨">⑨ 20:10-20:50</option><option value="⑩">⑩ 21:00-21:40</option>
          <option value="⑪">⑪ 21:50-22:30</option>
        </select>
      </label>
      <button id="quickAddLesson" type="button" class="primary">この日付に授業追加</button>
    </div>
  </section>

  <div id="status">データを読み込んでいます…</div>
  <div id="gridWrap"><div id="grid"></div></div>
</main>

<div id="modal" class="modal hidden" aria-hidden="true">
  <div class="modal-card">
    <div class="modal-head">
      <h2 id="modalTitle">授業追加</h2>
      <button id="modalClose" type="button">×</button>
    </div>

    <input type="hidden" id="fSourceKey"><input type="hidden" id="fMode" value="add">
    <div class="modal-content-scroll"><div class="form-grid">
      <label>日付<input id="fDate" type="date"></label>
      <label>時間番号<select id="fSlot"><option value="①">①</option><option value="②">②</option><option value="③">③</option><option value="④">④</option><option value="⑤">⑤</option><option value="⑥">⑥</option><option value="⑦">⑦</option><option value="⑧">⑧</option><option value="⑨">⑨</option><option value="⑩">⑩</option><option value="⑪">⑪</option></select></label>
      <div id="generatorCreateOptions" class="wide hidden" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc">
        <label>追加するコマ数<select id="fCreateCount"><option value="1">1コマ</option></select></label>
        <label id="generatorCreateMeal" hidden>途中の食事休憩<select id="fCreateMeal"><option value="0">なし</option><option value="1">あり（途中で食事休憩が入ります）</option></select></label>
        <p id="generatorCreatePreview" class="generator-ops-help" aria-live="polite"></p>
      </div>
      <label class="generator-key-field key-room"><span class="generator-key-label">教室</span>
        <select id="fRoomSelect">
          <option value="">未設定</option>
          <option value="青">青</option>
          <option value="黄">黄</option>
          <option value="白">白</option>
          <option value="ガラス">ガラス</option>
          <option value="PC">PC</option>
          <option value="自宅可">自宅可</option>
          <option value="__CUSTOM__">その他（自由入力）</option>
        </select>
        <input id="fRoomCustom" class="hidden" placeholder="教室名を自由入力">
      </label>
      <div class="generator-key-field key-class"><span id="classFieldLabel" class="generator-key-label">クラス</span>
        <select id="fClassSelect" aria-labelledby="classFieldLabel"></select>
        <input id="fClassCustom" class="hidden" aria-label="クラス名を自由入力" placeholder="クラス名を自由入力">
      </div>
      <label>種別
        <select id="fTypeSelect">
          <option value="授業">授業</option>
          <option value="演習">演習</option>
          <option value="補習">補習</option>
          <option value="テスト">テスト</option>
          <option value="休み・キャンプ・OFF">休み・キャンプ・OFF</option>
          <option value="__CUSTOM__">その他（自由入力）</option>
        </select>
        <input id="fTypeCustom" class="hidden" placeholder="種別を自由入力">
      </label>
      <label>給与区分
        <select id="fPayrollCategory">
          <option value="">自動判定</option>
          <option value="演習">演習</option>
          <option value="小学生">小学生</option>
          <option value="中学生">中学生</option>
          <option value="高校生">高校生</option>
          <option value="その他">その他</option>
        </select>
      </label>
      <label class="generator-key-field key-teacher"><span class="generator-key-label">担当講師</span>
        <select id="fTeacherSelect"></select>
        <input id="fTeacherCustom" class="hidden" placeholder="担当講師名を自由入力">
      </label>
      <label>科目
        <select id="fSubjectSelect"></select>
        <input id="fSubjectCustom" class="hidden" placeholder="科目を自由入力">
      </label>
      <label>開始<input id="fStart" type="time"></label>
      <label>終了<input id="fEnd" type="time"></label>
      <label class="wide">先生から生徒へのメッセージ <span class="public-warning">公開されます</span><textarea id="fNote" rows="4"></textarea></label>
    </div>

    <section id="generatorOps" class="generator-ops hidden">
      <div class="generator-ops-section generator-record-section">
        <h3><span class="ops-icon">🗂</span>この授業の記録・カルテ</h3>
        <div id="generatorLessonRecord" class="generator-lesson-record">読み込み中…</div>
        <a id="generatorRecordListLink" href="lesson_records.html" class="generator-record-link">この授業のカルテ一覧を見る</a>
      </div>
      <div class="generator-ops-section">
        <h3><span class="ops-icon">💬</span>先生共有メモ</h3>
        <p class="generator-ops-help">講師全体ページと同じ、クラス共通の先生用メモです。</p>
        <textarea id="fTeacherSharedMemo" rows="4" placeholder="先生同士で共有するメモ"></textarea>
        <button id="saveTeacherSharedMemo" type="button" class="ops-save-button">共有メモを投稿</button>
        <span id="teacherSharedMemoMsg" class="generator-inline-msg"></span>
      </div>

      <div class="generator-ops-section">
        <h3><span class="ops-icon">👥</span>参加生徒・出席ステータス</h3>
        <div class="attendance-bulk-actions"><button type="button" id="generatorAllPresent" data-all-present="#generatorAttendanceList .generator-att-select">全員出席にする</button><button type="button" class="ce-copy-previous" data-previous-mode="generator" data-copy-previous="#generatorAttendanceList .generator-att-select">前の授業と同じ出席</button><span data-attendance-bulk-message role="status"></span></div>
        <div id="scGeneratorContacts"></div><div id="generatorAttendanceList" class="generator-attendance-list"></div>
        <button id="saveGeneratorAttendance" type="button" class="ops-save-button">出席ステータスを保存</button>
        <span id="generatorAttendanceMsg" class="generator-inline-msg"></span>
      </div>
    </section>

    </div><div id="formMsg"></div>
    <div class="modal-actions">
      <button id="deleteLesson" type="button" class="danger hidden">この授業を削除</button>
      <button id="repeatLesson" type="button" class="duplicate-next hidden" data-admin>連続配置（日付を選択）</button>
      <button id="duplicateNextLesson" type="button" class="duplicate-next hidden">次のコマへ複製（複数可）</button>
      <span class="modal-actions-spacer"></span>
      <button id="cancelAdd" type="button">キャンセル</button>
      <button id="saveAdd" type="button" class="primary">授業を追加</button>
    </div>
  </div>
</div>

<script src="teacher-ng-guard.js?v=20260910-r1"></script>
<script src="school-holidays.js?v=20260912-r23"></script>
<script src="generator-tools.js?v=20260920-save-state"></script><script src="schedule-generator.js?v=20260921-scroll"></script>


<script id="generator-nowline-today-only-v2">
(function(){
  'use strict';
  const START=13*60+30, END=22*60+30, pad=n=>String(n).padStart(2,'0');
  function todayKey(){const d=new Date();return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}`}
  function clearLine(){document.querySelectorAll('.generator-today-nowline,.generator-today-nowline-label').forEach(el=>el.remove())}
  function draw(){
    clearLine();
    const now=new Date(), minutes=now.getHours()*60+now.getMinutes();
    if(minutes<START||minutes>END)return;
    const date=todayKey();
    const slots=[...document.querySelectorAll(`#grid .generator-slot[data-date="${date}"]`)];
    if(!slots.length)return;
    const grid=document.querySelector('#grid .generator-grid,#grid');
    if(!grid)return;
    if(getComputedStyle(grid).position==='static')grid.style.position='relative';
    const gridRect=grid.getBoundingClientRect();
    const headers=[...document.querySelectorAll('#grid .cell.head')].slice(1);
    const toMin=v=>{const m=String(v).match(/(\d{1,2}):(\d{2})/);return m?(+m[1])*60+(+m[2]):null};
    let x=null;
    for(const header of headers){
      const m=(header.textContent||'').match(/(\d{1,2}:\d{2})\s*[〜~\-–]\s*(\d{1,2}:\d{2})/);
      if(!m)continue;
      const a=toMin(m[1]),b=toMin(m[2]);
      if(a!=null&&b!=null&&minutes>=a&&minutes<=b){const r=header.getBoundingClientRect();x=(r.left-gridRect.left)+r.width*((minutes-a)/Math.max(1,b-a));break;}
    }
    if(x==null)return;
    const top=Math.min(...slots.map(el=>el.getBoundingClientRect().top-gridRect.top));
    const bottom=Math.max(...slots.map(el=>el.getBoundingClientRect().bottom-gridRect.top));
    const line=document.createElement('div');line.className='generator-today-nowline';line.style.left=x+'px';line.style.top=top+'px';line.style.height=Math.max(0,bottom-top)+'px';line.style.bottom='auto';
    const label=document.createElement('div');label.className='generator-today-nowline-label';label.style.left=x+'px';label.style.top=top+'px';label.textContent=`現在 ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    grid.append(line,label);
  }
  function start(){draw();setInterval(draw,15000);window.addEventListener('resize',draw);const root=document.getElementById('grid')||document.body;const obs=new MutationObserver(records=>{if(records.every(r=>[...r.addedNodes,...r.removedNodes].every(n=>n.nodeType===1&&n.matches('.generator-today-nowline,.generator-today-nowline-label'))))return;clearTimeout(window.__generatorTodayLineTimer);window.__generatorTodayLineTimer=setTimeout(draw,80)});obs.observe(root,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,300));else setTimeout(start,300);
})();
</script>

<script src="teacher-availability.js?v=20260912-r25"></script>
<script id="generator-attachment-icons-v45">
(function(){
  async function apply(){
    if(!window.StudentAttachments)return;
    try{await StudentAttachments.loadAll(); document.querySelectorAll('[data-key]').forEach(card=>{const items=StudentAttachments.get(card.dataset.key)||[];let b=card.querySelector('.attachment-indicator');const host=card.querySelector('.event-badges')||card;if(items.length&&!b){b=document.createElement('span');b.className='event-badge attachment-indicator';b.textContent='📎 '+items.length;b.title='生徒向け添付ファイルあり';host.appendChild(b)}else if(items.length&&b)b.textContent='📎 '+items.length;else if(!items.length&&b)b.remove()})}catch(e){console.warn(e)}}
  const run=()=>setTimeout(apply,200); if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  const o=new MutationObserver(run); const start=()=>{const s=document.getElementById('schedule');if(s)o.observe(s,{childList:true,subtree:true})}; if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
</script>

<script id="attachment-icons-v46">
(function(){
  let running=false, timer=null;
  async function paint(){
    if(running || !window.StudentAttachments) return;
    running=true;
    try{
      await StudentAttachments.loadAll();
      document.querySelectorAll('.event[data-key],.event-card[data-key],[data-key].list-item').forEach(card=>{
        const key=card.getAttribute('data-key')||'';
        const items=StudentAttachments.get(key)||[];
        let b=card.querySelector('.attachment-indicator-v46');
        if(items.length){
          if(!b){
            b=document.createElement('span');
            b.className='event-badge attachment-indicator attachment-indicator-v46';
            b.title='生徒向け添付ファイルあり';
            const host=card.querySelector('.event-badges,.tags')||card;
            host.appendChild(b);
          }
          b.textContent='📎 '+items.length;
        }else if(b){ b.remove(); }
      });
    }catch(e){ console.warn('添付アイコン表示エラー',e); }
    finally{ running=false; }
  }
  function schedule(){ clearTimeout(timer); timer=setTimeout(paint,80); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{paint();new MutationObserver(schedule).observe(document.getElementById('schedule')||document.body,{childList:true,subtree:true});});
  else {paint();new MutationObserver(schedule).observe(document.getElementById('schedule')||document.body,{childList:true,subtree:true});}
  window.addEventListener('focus',paint);
  window.addEventListener('student-attachments-changed',paint);
})();
</script>

<script src="schedule-confirmed.js?v=20260922-private"></script><script>(async()=>{const i=document.getElementById('scheduleConfirmedDate'),m=document.getElementById('scheduleConfirmedStatus'),p=document.getElementById('schedulePrivateFrom'),pm=document.getElementById('schedulePrivateStatus');if(!i||!p)return;try{const s=await ScheduleConfirmed.loadSettings();i.value=s.date;p.value=s.privateFrom;m.textContent=i.value?'ここまで確定':'未設定';pm.textContent=p.value?'この日以降は確定授業だけ公開':'すべて公開';}catch(e){m.textContent=pm.textContent='読込失敗';}i.addEventListener('change',async()=>{i.disabled=true;try{await ScheduleConfirmed.set(i.value);m.textContent=i.value?'✓ '+ScheduleConfirmed.label(i.value)+'まで確定':'✓ 確定日を解除';}catch(e){alert(e.message||e);}finally{i.disabled=false;}});p.addEventListener('change',async()=>{p.disabled=true;try{await ScheduleConfirmed.setPrivateFrom(p.value);pm.textContent=p.value?'✓ '+ScheduleConfirmed.label(p.value)+'以降は確定授業だけ公開':'✓ 全日程を公開';}catch(e){alert(e.message||e);}finally{p.disabled=false;}});})();</script>
<script src="linked-schedule.js?v=20260915-r50"></script><script src="day-compare.js?v=20260921-scroll"></script><link rel="stylesheet" href="day-compare.css?v=20260920-generator-layout"><script src="week-copy.js?v=20260920-class-day-copy"></script><script src="admin-page-cache.js?v=20260910-r5"></script><script defer src="calendar-view.js?v=20260922-events"></script></body>
</html>
<style id="school-holiday-layout-v63">
/* v63: 休講チェックを日付と重ねず、メモ行の上に独立表示 */
.sticky-date-box{height:auto!important;min-height:58px!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;gap:2px!important;overflow:visible!important}
.sticky-date-box>.sticky-date,.sticky-date-box>.sticky-date-line,.sticky-date-box>strong{position:static!important;display:block!important;flex:none!important;width:100%!important;height:auto!important;line-height:1.2!important;margin:0!important;white-space:nowrap!important;z-index:auto!important}
.school-holiday-toggle{position:static!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;width:100%!important;height:18px!important;line-height:18px!important;margin:0!important;padding:0!important;flex:none!important}
.school-holiday-toggle input{margin:0 3px 0 0!important}
.sticky-date-box .generator-day-note,.sticky-date-box .day-note-box{position:static!important;flex:none!important;width:100%!important;margin:0!important}
</style>
