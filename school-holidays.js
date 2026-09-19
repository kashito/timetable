(function(){
'use strict';
const API='school_holiday_api.php';
let holidays={};
let loadPromise=null;
function normDate(v){
  const m=String(v||'').trim().match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  return m?`${m[1]}-${String(+m[2]).padStart(2,'0')}-${String(+m[3]).padStart(2,'0')}`:'';
}
async function load(force){
  if(loadPromise&&!force)return loadPromise;
  loadPromise=(async()=>{
    try{const r=await fetch(API+'?v='+Date.now(),{cache:'no-store'});const j=await r.json();holidays=(r.ok&&j&&j.ok&&j.holidays&&typeof j.holidays==='object')?j.holidays:{};}catch(e){holidays={};}
    return holidays;
  })();
  return loadPromise;
}
function isHoliday(date){return !!holidays[normDate(date)];}
// Calendar-day comparison in Japan; midnight and month boundaries do not change the 14-day window.
function emptyDayLabel(date){
  const d=normDate(date),today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'});
  if(isHoliday(d)||d<today)return 'OFF';
  const days=(Date.parse(d+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000;
  return days>=0&&days<=14?'現在調整中':'未定';
}
async function set(date,enabled){
  const d=normDate(date); if(!d)throw new Error('日付が不正です');
  const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:d,enabled:!!enabled})});
  const j=await r.json().catch(()=>({})); if(!r.ok||!j.ok)throw new Error(j.error||'休講日の保存に失敗しました');
  if(enabled)holidays[d]=true; else delete holidays[d];
  return true;
}
window.SchoolHolidays={load,isHoliday,emptyDayLabel,set,all:()=>Object.assign({},holidays),normDate};
})();
