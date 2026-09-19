
(function(){
  'use strict';

  const params=new URLSearchParams(location.search);
  const presetTeacher=(params.get('teacher')||'').trim();
  if(!presetTeacher) return;

  function applyTeacherPreset(){
    const select=
      document.getElementById('teacherFilter') ||
      document.querySelector('select[name="teacher"]') ||
      document.querySelector('[data-filter="teacher"]');

    if(!select) return false;

    if(select.tagName==='SELECT'){
      const option=[...select.options].find(o=>{
        const value=String(o.value||'').trim();
        const text=String(o.textContent||'').trim();
        return value===presetTeacher || text===presetTeacher;
      });
      if(!option) return false;

      if(select.value!==option.value){
        select.value=option.value;
        select.dispatchEvent(new Event('change',{bubbles:true}));
      }
      return true;
    }

    if(select.tagName==='INPUT'){
      if(select.value!==presetTeacher){
        select.value=presetTeacher;
        select.dispatchEvent(new Event('input',{bubbles:true}));
        select.dispatchEvent(new Event('change',{bubbles:true}));
      }
      return true;
    }

    return false;
  }

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(applyTeacherPreset() || tries>=40){
      clearInterval(timer);
    }
  },200);

  window.addEventListener('load',()=>{
    setTimeout(applyTeacherPreset,500);
    setTimeout(applyTeacherPreset,1200);
  });
})();
