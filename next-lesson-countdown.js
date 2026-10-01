(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.NextLessonCountdown=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const weekdays=['日','月','火','水','木','金','土'];
 function parse(item){
  if(!item||!/^(\d{4})-(\d{2})-(\d{2})$/.test(String(item.date||''))||!/^\d{1,2}:\d{2}$/.test(String(item.start||'')))return null;
  const at=new Date(item.date+'T'+String(item.start).padStart(5,'0')+':00');return Number.isFinite(at.getTime())?at:null;
 }
 function format(item,now){
  const at=parse(item);if(!at)return {when:'次回の授業は未定です',remaining:'予定が決まると、ここに宿題までの時間を表示します。'};
  const current=now instanceof Date?now:new Date();const when=`次回：${at.getMonth()+1}月${at.getDate()}日（${weekdays[at.getDay()]}） ${String(item.start).padStart(5,'0')}${item.slot?' '+item.slot:''}`;
  const minutes=Math.floor((at-current)/60000);if(minutes<=0)return {when,remaining:'開始時刻を過ぎています'};
  const days=Math.floor(minutes/1440),hours=Math.floor((minutes%1440)/60);return {when,remaining:days||hours?`あと${days}日${hours}時間`:`あと${minutes}分`};
 }
 return {format};
});
