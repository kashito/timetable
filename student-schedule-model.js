(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.StudentScheduleModel=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  function minutes(value){
    const match=String(value||'').match(/^(\d{1,2}):(\d{2})/);
    return match?Number(match[1])*60+Number(match[2]):0;
  }

  function clock(value){
    const total=Math.max(0,Number(value)||0);
    return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
  }

  // Merge occupied ranges before finding gaps. Linked lessons are already one range;
  // overlapping single lessons extend the occupied range and never create a false gap.
  function gaps(events){
    const sorted=(Array.isArray(events)?events:[])
      .map(item=>({start:minutes(item.start),end:minutes(item.end)}))
      .filter(item=>item.start>=0&&item.end>item.start)
      .sort((a,b)=>a.start-b.start||a.end-b.end);
    const result=[];
    let occupiedEnd=0;
    for(const item of sorted){
      if(occupiedEnd&&item.start>occupiedEnd){
        result.push({start:clock(occupiedEnd),end:clock(item.start),minutes:item.start-occupiedEnd});
      }
      occupiedEnd=Math.max(occupiedEnd,item.end);
    }
    return result;
  }

  function dayState(input){
    const value=input||{};
    const count=Number(value.eventCount)||0;
    if(value.todayFinalizedAsOff)return{label:'OFF（授業なし）',tone:'off',partial:false};
    if(value.schoolHoliday)return{label:'OFF（授業なし）',tone:'off',partial:false};
    if(value.confirmedDay&&count>0)return{label:'授業あり',tone:'lessons',partial:false};
    if(value.confirmedDay&&value.specialLabel)return{label:String(value.specialLabel),tone:'notice',partial:false};
    if(value.confirmedDay)return{label:'OFF（授業なし）',tone:'off',partial:false};
    if(value.privatePending&&count>0)return{label:'授業あり・現在調整中（確定した授業のみ表示）',tone:'pending',partial:true};
    if(value.privatePending)return{label:'現在調整中',tone:'pending',partial:true};
    if(count>0)return{label:'授業あり',tone:'lessons',partial:false};
    if(value.specialLabel)return{label:String(value.specialLabel),tone:'notice',partial:false};
    const empty=String(value.emptyLabel||'').trim();
    if(empty==='OFF')return{label:'OFF（授業なし）',tone:'off',partial:false};
    return{label:empty||'予定を確認できません',tone:empty==='現在調整中'||empty==='未定'?'pending':'unknown',partial:true};
  }

  function homework(text,limit=88){
    const full=String(text||'').trim();
    if(!full)return{state:'unrecorded',full:'',preview:'宿題の記録はまだありません',long:false};
    const long=full.length>limit||full.split(/\r?\n/).length>2;
    return{state:'recorded',full,preview:long?full.slice(0,limit).trimEnd()+'…':full,long};
  }

  return{minutes,clock,gaps,dayState,homework};
});
