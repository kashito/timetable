const test=require('node:test');
const assert=require('node:assert/strict');
const countdown=require('../next-lesson-countdown.js');

test('shows the next date, period and whole-day/hour distance',()=>{
 const view=countdown.format({date:'2026-10-08',start:'18:30',slot:'⑦'},new Date('2026-10-02T15:30:00+09:00'));
 assert.deepEqual(view,{when:'次回：10月8日（木） 18:30 ⑦',remaining:'あと6日3時間'});
});

test('unknown next lesson stays undecided rather than saying no lesson',()=>{
 const view=countdown.format(null,new Date('2026-10-02T15:30:00+09:00'));
 assert.equal(view.when,'次回の授業は未定です');
 assert.doesNotMatch(view.when+view.remaining,/授業なし/);
});

test('uses minutes under one hour and states when the start has passed',()=>{
 assert.equal(countdown.format({date:'2026-10-02',start:'16:00'},new Date('2026-10-02T15:31:00+09:00')).remaining,'あと29分');
 assert.equal(countdown.format({date:'2026-10-02',start:'15:00'},new Date('2026-10-02T15:31:00+09:00')).remaining,'開始時刻を過ぎています');
});
