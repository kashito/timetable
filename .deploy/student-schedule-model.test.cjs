'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../student-schedule-model.js');

test('day status distinguishes lessons, OFF, pending, and partially confirmed days',()=>{
  assert.equal(model.dayState({eventCount:1}).label,'授業あり');
  assert.equal(model.dayState({todayFinalizedAsOff:true}).label,'OFF（授業なし）');
  assert.equal(model.dayState({todayFinalizedAsOff:true,privatePending:false,eventCount:0}).label,'OFF（授業なし）');
  assert.equal(model.dayState({schoolHoliday:true,privatePending:true,eventCount:0}).label,'OFF（授業なし）');
  assert.equal(model.dayState({confirmedDay:true,privatePending:true,eventCount:0}).label,'OFF（授業なし）');
  assert.equal(model.dayState({confirmedDay:true,privatePending:true,eventCount:1}).label,'授業あり');
  assert.equal(model.dayState({confirmedDay:true,specialLabel:'サマーキャンプ',eventCount:0}).label,'サマーキャンプ');
  assert.equal(model.dayState({privatePending:true,eventCount:0}).label,'現在調整中');
  assert.deepEqual(model.dayState({privatePending:true,eventCount:1}),{
    label:'授業あり・現在調整中（確定した授業のみ表示）',tone:'pending',partial:true
  });
  assert.equal(model.dayState({emptyLabel:'未定'}).label,'未定');
  assert.equal(model.dayState({}).label,'予定を確認できません');
});

test('one lesson has no artificial gap',()=>{
  assert.deepEqual(model.gaps([{start:'18:20',end:'19:10'}]),[]);
});

test('multiple lessons expose exact gap time and duration',()=>{
  assert.deepEqual(model.gaps([
    {start:'18:20',end:'19:10'},
    {start:'19:20',end:'20:10'}
  ]),[{start:'19:10',end:'19:20',minutes:10}]);
});

test('overlapping and linked ranges do not create a false gap',()=>{
  assert.deepEqual(model.gaps([
    {start:'18:00',end:'19:30'},
    {start:'18:50',end:'20:10'},
    {start:'20:20',end:'21:10'}
  ]),[{start:'20:10',end:'20:20',minutes:10}]);
  assert.deepEqual(model.gaps([{start:'18:00',end:'21:10',_linked:{members:[1,2,3]}}]),[]);
});

test('homework empty is unrecorded and long text retains its full content',()=>{
  assert.deepEqual(model.homework(''),{
    state:'unrecorded',full:'',preview:'宿題の記録はまだありません',long:false
  });
  const long='次回までに確認する内容'.repeat(20);
  const item=model.homework(long,30);
  assert.equal(item.long,true);
  assert.equal(item.full,long);
  assert.match(item.preview,/…$/);
  assert.doesNotMatch(item.preview,/宿題なし/);
});
