(()=>{
  const nativeFetch=window.fetch.bind(window),required=document.currentScript?.dataset.staff==='required';
  const page=location.pathname.split('/').pop().replace(/^(payroll|schedule_generator|class_manage|student_manage)\.php$/,'$1.html');
  let session={user:null,csrf:''};
  if(required)document.documentElement.classList.add('staff-pending');
  const ready=nativeFetch('staff_auth_api.php',{cache:'no-store',credentials:'same-origin'}).then(async r=>{
    const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'ログイン状態を確認できません');session=j;
    if(required&&!j.user){location.replace('staff_login.html?next='+encodeURIComponent(location.pathname.split('/').pop()+location.search));return j;}
    if(j.user?.mustChange&&!location.pathname.endsWith('staff_account.html')){location.replace('staff_account.html');return j;}
    document.documentElement.classList.remove('staff-pending');document.documentElement.classList.toggle('staff-teacher',j.user?.role==='teacher');return j;
  }).catch(e=>{document.documentElement.classList.remove('staff-pending');document.addEventListener('DOMContentLoaded',()=>{const p=document.createElement('p');p.className='workspace-error';p.textContent=e.message+'。再読み込みしてください。';document.body.prepend(p);});throw e;});
  window.StaffAuth={ready,page,get user(){return session.user;},async api(payload){const r=await fetch('staff_auth_api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'操作に失敗しました');if(j.csrf)session.csrf=j.csrf;if(j.user)session.user=j.user;return j;}};
  ready.then(j=>{if(j.user?.role==='admin'&&!j.user.mustChange){const s=document.createElement('script');s.src='codex-memos.js?v=20260916-r54-ready';document.head.append(s);}}).catch(()=>{});
  ready.then(j=>{if(j.user&&!j.user.mustChange){const style=document.createElement('link');style.rel='stylesheet';style.href='recording-tools.css?v=20260916-r53';document.head.append(style);const script=document.createElement('script');script.src='recording-tools.js?v=20260917-r56-ready';document.head.append(script);const links=document.createElement('script');links.src='test-result-links.js?v=20260916-r53';document.head.append(links);}}).catch(()=>{});
  window.fetch=async(input,init={})=>{
    const url=new URL(typeof input==='string'?input:input.url,location.href);
    if(url.origin!==location.origin||!url.pathname.endsWith('.php'))return nativeFetch(input,init);
    await ready;
    const method=String(init.method||(typeof input==='object'?input.method:'GET')||'GET').toUpperCase();
    const headers=new Headers(init.headers||(typeof input==='object'?input.headers:undefined));
    if(method!=='GET'&&method!=='HEAD')headers.set('X-CSRF-Token',session.csrf);
    let options={...init,headers,credentials:'same-origin'};
    let response=await nativeFetch(input,options);
    for(let retry=0;retry<4&&response.status===409&&typeof options.body==='string';retry++){
      const issue=await response.clone().json().catch(()=>({}));
      const field=issue.fixedConflict?'overrideFixed':issue.roomConflict?'overrideRoom':issue.ngConflict?'overrideNg':issue.recordConflict?'archiveDestination':'';
      if(!field||!confirm(issue.error))break;
      let payload;try{payload=JSON.parse(options.body);}catch(e){break;}
      payload[field]=true;options={...options,body:JSON.stringify(payload)};
      response=await nativeFetch(input,options);
    }
    if(response.status===401&&required)location.assign('staff_login.html?next='+encodeURIComponent(location.pathname.split('/').pop()+location.search));
    if(method==='POST'&&response.ok&&/\/(state_api|lesson_record_api|lesson_group_api|student_contact_api)\.php$/.test(url.pathname))response.clone().json().then(j=>{if(j.ok)document.dispatchEvent(new Event('lesson-recording-saved'));}).catch(()=>{});
    return response;
  };
})();
