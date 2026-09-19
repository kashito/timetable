(function(){
'use strict';
if(window.__teacherNgFetchGuardInstalled) return;
window.__teacherNgFetchGuardInstalled=true;
const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input&&input.url)||'';
  const method=String((init&&init.method)||'GET').toUpperCase();
  const isLessonPost=url.includes('lesson_add_api.php') && method==='POST' && init && typeof init.body==='string';
  if(!isLessonPost) return nativeFetch(input,init);
  const response=await nativeFetch(input,init);
  if(response.status!==409) return response;
  let info=null;
  try{info=await response.clone().json()}catch(e){}
  if(!info||!info.ngConflict) return response;
  const message=(info.error||'この講師はこの日時がNG登録されています。')+'\n\nそれでも登録・移動しますか？';
  if(!window.confirm(message)) return response;
  let body;
  try{body=JSON.parse(init.body)}catch(e){return response;}
  body.overrideNg=true;
  const retryInit=Object.assign({},init,{body:JSON.stringify(body)});
  return nativeFetch(input,retryInit);
};
})();
