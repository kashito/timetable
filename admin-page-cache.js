(()=>{
  window.addEventListener('pagehide',()=>{document.body.replaceChildren();});
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
})();
