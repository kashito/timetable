(()=>{
 const explanation='参加は自由ですが、講師は参加を勧めています。';
 const freeAt=(row,date)=>Workspace.enrolled(row,date,true)&&(row['自由参加期間']||[]).some(p=>(!p.from||p.from<=date)&&(!p.until||date<p.until));
 window.StudentParticipation={freeAt,explanation};
})();
