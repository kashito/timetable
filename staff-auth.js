(()=>{
  const nativeFetch=window.fetch.bind(window),required=document.currentScript?.dataset.staff==='required';
  const page=location.pathname.split('/').pop().replace(/^(payroll|schedule_generator|class_manage|student_manage)\.php$/,'$1.html');
  let session={user:null,csrf:''},reauthNeeded=false;
  function showReauth(){
    reauthNeeded=true;
    const show=()=>{if(document.getElementById('staffReauthNotice'))return;const box=document.createElement('div');box.id='staffReauthNotice';box.className='workspace-error';box.setAttribute('role','alert');
      box.style.cssText='position:fixed;top:8px;left:8px;right:8px;z-index:2147483646;max-height:45vh;overflow:auto;padding:12px;background:#fff7ed;border:1px solid #f59e0b;color:#7c2d12';
      box.append(document.createTextNode('ログインを確認できません。入力はこの画面に残しています。別の画面で同じ先生としてログインし直し、戻って保存してください。 '));
      const link=document.createElement('a');link.href='staff_login.html?next='+encodeURIComponent(location.pathname.split('/').pop()+location.search);link.target='_blank';link.rel='noopener';link.textContent='別の画面でログイン';box.append(link);
      const button=document.createElement('button');button.type='button';button.textContent='ログイン状態を再確認';button.onclick=async()=>{button.disabled=true;try{await refreshSession();}catch(e){status.textContent=e.message;}finally{button.disabled=false;}};box.append(document.createTextNode(' '),button);const status=document.createElement('span');status.setAttribute('role','status');box.append(status);document.body.prepend(box);};
    if(document.body)show();else document.addEventListener('DOMContentLoaded',show,{once:true});
  }
  async function refreshSession(){
    const r=await nativeFetch('staff_auth_api.php',{cache:'no-store',credentials:'same-origin'}),j=await r.json();
    if(!r.ok||!j.ok)throw Error(j.error||'ログイン状態を確認できません');
    if(!j.user||j.user.mustChange)throw Error('同じ先生のアカウントでログインし直してから、もう一度保存してください。');
    if(session.user?.id&&j.user.id!==session.user.id)throw Error('ログイン中の先生が変わっています。入力を控え、元の先生のアカウントでログインし直してください。');
    session=j;reauthNeeded=false;document.getElementById('staffReauthNotice')?.remove();return j;
  }
  if(required)document.documentElement.classList.add('staff-pending');
  const ready=nativeFetch('staff_auth_api.php',{cache:'no-store',credentials:'same-origin'}).then(async r=>{
    const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'ログイン状態を確認できません');session=j;
    if(required&&!j.user){location.replace('staff_login.html?next='+encodeURIComponent(location.pathname.split('/').pop()+location.search));return j;}
    if(j.user?.mustChange&&!location.pathname.endsWith('staff_account.html')){location.replace('staff_account.html');return j;}
    document.documentElement.classList.remove('staff-pending');document.documentElement.classList.toggle('staff-teacher',j.user?.role==='teacher');return j;
  }).catch(e=>{document.documentElement.classList.remove('staff-pending');document.addEventListener('DOMContentLoaded',()=>{const p=document.createElement('p');p.className='workspace-error';p.textContent=e.message+'。再読み込みしてください。';document.body.prepend(p);});throw e;});
  window.StaffAuth={ready,page,refresh:refreshSession,get user(){return session.user;},async api(payload){const r=await fetch('staff_auth_api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'操作に失敗しました');if(j.csrf)session.csrf=j.csrf;if(j.user)session.user=j.user;return j;}};
  ready.then(j=>{if(j.user?.role==='admin'&&!j.user.mustChange){const s=document.createElement('script');s.src='codex-memos.js?v=20260916-r54-ready';document.head.append(s);}}).catch(()=>{});
  ready.then(j=>{if(j.user&&!j.user.mustChange){const style=document.createElement('link');style.rel='stylesheet';style.href='recording-tools.css?v=20261008-checkbox-events';document.head.append(style);const script=document.createElement('script');script.src='recording-tools.js?v=20261008-checkbox-events';document.head.append(script);const links=document.createElement('script');links.src='test-result-links.js?v=20260916-r53';document.head.append(links);}}).catch(()=>{});
  window.fetch=async(input,init={})=>{
    const url=new URL(typeof input==='string'?input:input.url,location.href);
    if(url.origin!==location.origin||!url.pathname.endsWith('.php'))return nativeFetch(input,init);
    await ready;
    const method=String(init.method||(typeof input==='object'?input.method:'GET')||'GET').toUpperCase();
    if(reauthNeeded&&method!=='GET'&&method!=='HEAD')await refreshSession();
    const headers=new Headers(init.headers||(typeof input==='object'?input.headers:undefined));
    if(method!=='GET'&&method!=='HEAD')headers.set('X-CSRF-Token',session.csrf);
    let options={...init,headers,credentials:'same-origin'};
    const write=method!=='GET'&&method!=='HEAD'&&/_api\.php$/.test(url.pathname);
    const unknown=()=>Object.assign(new Error(url.pathname.split('/').pop()+'：保存結果を確認できません。入力は残っています。保存状況を確認してから操作してください。'),{unconfirmedWrite:true});
    const send=async()=>{let r;try{r=await nativeFetch(input,options);}catch(e){if(write)throw unknown();throw e;}if(write){let j;try{j=await r.clone().json();}catch(e){throw unknown();}if(!j||typeof j!=='object'||typeof j.ok!=='boolean')throw unknown();if(j.outcomeUnknown)throw unknown();}return r;};
    let response=await send();
    for(let retry=0;retry<4&&response.status===409&&typeof options.body==='string';retry++){
      const issue=await response.clone().json().catch(()=>({}));
      const field=issue.fixedConflict?'overrideFixed':issue.roomConflict?'overrideRoom':issue.ngConflict?'overrideNg':issue.recordConflict?'archiveDestination':'';
      if(!field||!confirm(issue.error))break;
      let payload;try{payload=JSON.parse(options.body);}catch(e){break;}
      payload[field]=true;options={...options,body:JSON.stringify(payload)};
      response=await send();
    }
    if(required&&(response.status===401||(response.status===403&&(await response.clone().json().catch(()=>({}))).error==='画面を再読み込みして、もう一度操作してください。')))showReauth();
    if(method==='POST'&&response.ok&&/\/(teacher_ng_api|lesson_add_api|lesson_resize_api|lesson_group_api|lesson_group_move_api|lesson_group_extend_api|lesson_group_shorten_api|lesson_group_lengthen_api|lesson_create_group_api|lesson_repeat_api|class_day_copy_api|data_api)\.php$/.test(url.pathname))response.clone().json().then(j=>{if(j.ok){document.dispatchEvent(new Event('teacher-open-slots-saved'));try{localStorage.setItem('teacher-open-slots-saved',String(Date.now()));}catch(_){}}}).catch(()=>{});
    if(method==='POST'&&response.ok&&/\/(state_api|lesson_record_api|lesson_group_api|student_contact_api|student_homework_api)\.php$/.test(url.pathname))response.clone().json().then(j=>{if(j.ok){document.dispatchEvent(new Event('lesson-recording-saved'));try{localStorage.setItem('lesson-homework-saved',String(Date.now()));if(window.BroadcastChannel){const channel=new BroadcastChannel('lesson-homework');channel.postMessage('saved');channel.close();}}catch(_){}}}).catch(()=>{});
    return response;
  };
})();
