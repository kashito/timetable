(function(g){'use strict';let date='',privateFrom='',loaded=false;const api='schedule_confirmed_api.php';
async function loadSettings(force){if(loaded&&!force)return{date,privateFrom};const r=await fetch(api+'?t='+Date.now(),{cache:'no-store'});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'公開設定を取得できません');date=j.date||'';privateFrom=j.privateFrom||'';loaded=true;return{date,privateFrom};}
async function load(force){return(await loadSettings(force)).date;}
async function save(patch){const r=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'公開設定を保存できません');date=j.date||'';privateFrom=j.privateFrom||'';loaded=true;document.dispatchEvent(new CustomEvent('schedule-confirmed-changed',{detail:{date,privateFrom}}));return{date,privateFrom};}
async function set(v){return(await save({date:v||''})).date;}
async function setPrivateFrom(v){return(await save({privateFrom:v||''})).privateFrom;}
function get(){return date;}function getPrivateFrom(){return privateFrom;}function label(v){if(!v)return '';const [y,m,d]=v.split('-').map(Number);const w=['日','月','火','水','木','金','土'][new Date(y,m-1,d).getDay()];return `${m}/${d}${w}`;}
g.ScheduleConfirmed={load,loadSettings,set,setPrivateFrom,get,getPrivateFrom,label};})(window);
