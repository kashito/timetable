(function(){
  'use strict';
  const STORAGE='student-schedule-theme-v1';
  const themes=[
    ['standard','標準','2463a8','17466f','eaf3fb'],['sky','空','1677a8','075985','e0f2fe'],
    ['ocean','海','087d8f','155e75','cffafe'],['aqua','水色','0e7490','164e63','ecfeff'],
    ['mint','ミント','087f5b','065f46','dff8ee'],['forest','森','287a3d','166534','e8f5e9'],
    ['leaf','若葉','4d7c0f','3f6212','f1f8df'],['olive','オリーブ','66751b','4d5b16','f3f4df'],
    ['amber','琥珀','a85d08','854d0e','fff4db'],['orange','みかん','b45309','92400e','fff0df'],
    ['coral','珊瑚','b44b45','913b36','fff0ed'],['rose','ローズ','b23a62','8b2b4d','fdebf1'],
    ['sakura','桜','a83f72','831843','fcebf4'],['plum','梅','8f3f68','6f294f','f8eaf1'],
    ['violet','すみれ','6d4bc3','553c9a','f1ecff'],['lavender','藤','7251a6','593c82','f3edfb'],
    ['indigo','藍','3e5ca8','30457f','e9eefb'],['navy','紺','344b6b','24364f','e9eef3'],
    ['slate','すずり','526273','334155','eef2f6'],['cocoa','ココア','76523f','5b3d2e','f5eee9']
  ].map(([id,name,accent,strong,soft])=>({id,name,accent:'#'+accent,strong:'#'+strong,soft:'#'+soft}));
  const byId=id=>themes.find(theme=>theme.id===id)||themes[0];

  function apply(id,persist=true){
    const theme=byId(id),style=document.documentElement.style;
    document.documentElement.dataset.studentTheme=theme.id;
    style.setProperty('--student-accent',theme.accent);
    style.setProperty('--student-accent-strong',theme.strong);
    style.setProperty('--student-accent-soft',theme.soft);
    if(persist)try{localStorage.setItem(STORAGE,theme.id);}catch(e){}
    document.querySelectorAll('[data-student-theme]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.studentTheme===theme.id)));
    const current=document.getElementById('studentThemeCurrent');if(current)current.textContent='現在：'+theme.name;
    return theme;
  }

  function open(){
    const dialog=document.getElementById('studentThemeDialog');if(!dialog)return;
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  }
  function close(){const dialog=document.getElementById('studentThemeDialog');if(dialog?.open)dialog.close();else dialog?.removeAttribute('open');}

  function init(){
    const grid=document.getElementById('studentThemeGrid');
    if(grid)grid.innerHTML=themes.map(theme=>`<button type="button" data-student-theme="${theme.id}" style="--swatch:${theme.accent};--swatch-soft:${theme.soft}"><span aria-hidden="true"></span>${theme.name}</button>`).join('');
    document.getElementById('studentDisplaySettings')?.addEventListener('click',open);
    document.getElementById('studentThemeClose')?.addEventListener('click',close);
    document.getElementById('studentThemeReset')?.addEventListener('click',()=>apply('standard'));
    grid?.addEventListener('click',event=>{const button=event.target.closest('[data-student-theme]');if(button)apply(button.dataset.studentTheme);});
    document.getElementById('studentThemeDialog')?.addEventListener('click',event=>{if(event.target.id==='studentThemeDialog')close();});
    let saved='standard';try{saved=localStorage.getItem(STORAGE)||'standard';}catch(e){}
    apply(saved,false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.StudentDisplaySettings={themes,apply,storageKey:STORAGE};
})();
