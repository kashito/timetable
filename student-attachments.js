window.StudentAttachments=(()=>{
  const API='student_attachment_api.php'; let cache={};
  async function loadAll(){
    const r=await fetch(API+'?action=all&v='+Date.now(),{cache:'no-store'}); const j=await r.json();
    if(!r.ok||!j.ok) throw new Error(j.error||'添付ファイルを読み込めませんでした');
    cache=j.attachments||{}; return cache;
  }
  async function list(key,force=false){
    if(!force && Object.prototype.hasOwnProperty.call(cache,key)) return cache[key]||[];
    const r=await fetch(API+'?key='+encodeURIComponent(key)+'&v='+Date.now(),{cache:'no-store'}); const j=await r.json();
    if(!r.ok||!j.ok) throw new Error(j.error||'添付ファイルを読み込めませんでした');
    cache[key]=j.attachments||[]; return cache[key];
  }
  async function upload(key,file,options={}){
    const fd=new FormData(); fd.append('action','upload'); fd.append('key',key); fd.append('file',file);
    fd.append('sender',options.sender==='student'?'student':'teacher');
    if(options.senderName) fd.append('senderName',options.senderName);
    const r=await fetch(API+'?action=upload',{method:'POST',body:fd}); const j=await r.json();
    if(!r.ok||!j.ok) throw new Error(j.error||'アップロードに失敗しました');
    await list(key,true); return j.attachment;
  }
  async function remove(key,id){
    const item=Object.values(cache).flat().find(f=>f.id===id);key=item?.key||key;
    const r=await fetch(API+'?action=delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,id})}); const j=await r.json();
    if(!r.ok||!j.ok) throw new Error(j.error||'削除に失敗しました');
    await loadAll(); return true;
  }
  function get(key){
    const group=window.LessonGroups?.forKey(key);if(group){const keys=[group.key,...group.lessonKeys],items=keys.flatMap(k=>cache[k]||[]);return [...new Map(items.map(f=>[f.id,f])).values()];}
    if(Object.prototype.hasOwnProperty.call(cache,key)) return cache[key]||[];
    // v45: type/subject notation changed across old/new schedule renderers; match the occurrence core too.
    const core=String(key||'').split('|').slice(0,4).join('|');
    if(!core) return [];
    const out=[];
    for(const [k,items] of Object.entries(cache||{})){
      if(String(k).split('|').slice(0,4).join('|')===core && Array.isArray(items)) out.push(...items);
    }
    return out;
  }
  function downloadUrl(id){return API+'?action=download&id='+encodeURIComponent(id);}
  function rawUrl(item){
    // Files under /data may be blocked from direct web access. Always stream
    // them through the dedicated PHP endpoint, which resolves the real stored
    // path server-side and returns the original filename/extension.
    const id=item&&item.id?item.id:item;
    return 'student_file_download.php?id='+encodeURIComponent(String(id||''));
  }
  function all(){return cache;}
  return {loadAll,list,upload,remove,get,downloadUrl,rawUrl,all};
})();
