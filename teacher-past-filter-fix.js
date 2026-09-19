// v14: past days are filtered before grid rendering in app.js.
(function(){
  'use strict';
  function rerender(){ if(typeof window.render==='function') window.render(); else if(typeof render==='function') render(); }
  document.addEventListener('change',function(e){ if(e.target&&e.target.id==='pastDayToggle') rerender(); });
})();
