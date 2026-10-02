const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('linked lesson actions are visible near the group summary',()=>{
 const html=read('lesson_group.html');
 const controls=html.indexOf('class="group-link-controls"');
 const attendance=html.indexOf('id="groupAttendanceSection"');
 assert.ok(controls>0&&controls<attendance);
 for(const id of ['groupExtend','groupLengthen','groupShorten','groupUnlink'])assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
 assert.match(html,/前後のコマを追加・連結/);
 assert.match(html,/連結をすべて解除/);
});

test('shorten action owns its busy state and blocks duplicate dialogs',()=>{
 const js=read('group-schedule-actions.js');
 const start=js.indexOf('async function shorten(id)');
 const end=js.indexOf('window.GroupScheduleActions',start);
 const source=js.slice(start,end);
 assert.match(source,/if\(active\|\|StaffAuth\.user\?\.role!==['"]admin['"]\)return;active=true;/);
 assert.match(source,/let busy=false/);
 assert.match(source,/if\(busy\)return/);
});

test('full unlink returns to the originating timetable',()=>{
 const js=read('lesson-group.js');
 assert.match(js,/action:'unlink'[\s\S]*GroupScheduleActions\.returnToSchedule\(group\)/);
});

test('linked lesson edit and back return to the exact originating timetable view',()=>{
 const group=read('lesson-group.js');
 const actions=read('group-schedule-actions.js');
 const groups=read('lesson-groups.js');
 assert.match(groups,/rememberView\(from\)/);
 assert.match(group,/back\.onclick=.*returnToSchedule\(g,dest\)/);
 assert.match(group,/GroupScheduleActions\.edit\(group\)[\s\S]*returnToSchedule\(group,returnTarget\)/);
 assert.match(actions,/returnStateKey='timetable\.scheduleReturnView\.v1'/);
 assert.match(actions,/pageY:window\.scrollY,left:root\.scrollLeft/);
 assert.match(actions,/if\(!u\.searchParams\.has\('date'\)&&!u\.searchParams\.has\('linkedDate'\)\)u\.searchParams\.set/);
 assert.match(actions,/window\.scrollTo\(\{top:Number\(state\.pageY\)/);
 assert.match(actions,/root\.scrollLeft=Number\(state\.left\)/);
});
