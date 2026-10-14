const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');

test('resize helpers snap to five minutes and format times',()=>{
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'lesson-resize.js'),'utf8'),context);
  const api=context.window.LessonResize;
  assert.equal(api.minutes('18:35'),1115);
  assert.equal(api.time(1115),'18:35');
  assert.equal(api.snap(1113,1110,1150),1115);
  assert.equal(api.snap(1100,1110,1150),1110);
});

test('both administrator calendars load and bind edge resizing',()=>{
  const generator=fs.readFileSync(path.join(root,'schedule_generator.php'),'utf8');
  const teacher=fs.readFileSync(path.join(root,'teacher2026summer.html'),'utf8');
  const generatorJs=fs.readFileSync(path.join(root,'schedule-generator.js'),'utf8');
  const teacherJs=fs.readFileSync(path.join(root,'timetable-app.js'),'utf8');
  for(const page of [generator,teacher]){assert.match(page,/lesson-resize\.css/);assert.match(page,/lesson-resize\.js/);}
  assert.match(generatorJs,/LessonResize\?\.bind\(\$\('grid'\)/);
  assert.match(teacherJs,/LessonResize\?\.bind\(\$\('schedule'\)/);
  assert.match(generatorJs,/data-start=/);assert.match(generatorJs,/data-end=/);
});

test('resize endpoint keeps policy checks and atomic writes',()=>{
  const php=fs.readFileSync(path.join(root,'lesson_resize_api.php'),'utf8');
  assert.match(php,/staffRequire\(true\)/);assert.match(php,/fixedConflict/);assert.match(php,/guardRoomSharing/);assert.match(php,/safeDataTransaction/);assert.match(php,/resizeHistory/);
});
