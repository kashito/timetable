(function(g){'use strict';let date='',loaded=false;const api='schedule_confirmed_api.php';
async function load(force){if(loaded&&!force)return date;const r=await fetch(api+'?t='+Date.now(),{cache:'no-store'});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'確定日を取得できません');date=j.date||'';loaded=true;return date;}
async function set(v){const r=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:v||''})});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'確定日を保存できません');date=j.date||'';loaded=true;document.dispatchEvent(new CustomEvent('schedule-confirmed-changed',{detail:{date}}));return date;}
function get(){return date;} function label(v){if(!v)return '';const [y,m,d]=v.split('-').map(Number);const w=['日','月','火','水','木','金','土'][new Date(y,m-1,d).getDay()];return `${m}/${d}${w}`;}
g.ScheduleConfirmed={load,set,get,label};})(window);
