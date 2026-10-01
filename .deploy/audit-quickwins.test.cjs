const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('student daily board opens in a separate tab',()=>{
 const html=read('student.html');
 assert.match(html,/<a id="studentDailyLink"[^>]*target="_blank"[^>]*rel="noopener"/);
});

test('duplicate student menu is removed while student management remains',()=>{
 const js=read('workspace-ui.js');
 assert.doesNotMatch(js,/\['student\.html','生徒別'\]/);
 assert.match(js,/\['student_manage\.html','生徒管理'\]/);
});

test('ordinary shared notes do not render a TODO checkbox',()=>{
 const js=read('shared-notes.js');
 assert.match(js,/const state=n\.todo\?/);
 assert.doesNotMatch(js,/data-note-todo="\$\{esc\(n\.id\)\}" \$\{n\.todo/);
});

test('karte URLs become safe links without rendering injected markup',()=>{
 const context={window:{},Workspace:{esc:s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))},StaffAuth:{user:null},document:{querySelectorAll:()=>[],addEventListener:()=>{}},setInterval:()=>{}};
 vm.runInNewContext(read('karte-tools.js'),context);
 const html=context.window.KarteUI.linkedText('資料 https://example.com/a?q=1&x=2。 <script>');
 assert.equal(html,'資料 <a href="https://example.com/a?q=1&amp;x=2" target="_blank" rel="noopener noreferrer">リンク</a>。 &lt;script&gt;');
});

test('karte list has a today shortcut wired to the date filter',()=>{
 const html=read('lesson_records.html');
 assert.match(html,/id="todayRecords"[^>]*>本日のカルテ<\/button>/);
 assert.match(html,/todayRecords'\)\.onclick=.*Workspace\.today\(\)/);
 assert.match(html,/KarteUI\.linkedText\(r\.memo\)/);
});
