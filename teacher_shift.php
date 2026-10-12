<?php
function normalizeNgDate($v){
 $s=str_replace('/','-',trim((string)$v));
 if(preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})/',$s,$m))return sprintf('%04d-%02d-%02d',(int)$m[1],(int)$m[2],(int)$m[3]);
 return $s;
}
function teacherShiftNgEntry($list,$row){
 $teacher=trim((string)($row['担当講師']??''));$date=normalizeNgDate($row['日付']??'');$slot=trim((string)($row['時間番号']??''));
 if($teacher===''||$date===''||$slot==='')return null;
 foreach($list as $e){if(!is_array($e)||trim((string)($e['teacher']??''))!==$teacher||normalizeNgDate($e['date']??'')!==$date)continue;
  $slots=is_array($e['slots']??null)?array_map('strval',$e['slots']):[];if(!empty($e['allDay'])||in_array($slot,$slots,true))return $e;
 }return null;
}
function teacherNgConflict($ngFile,$row){return teacherShiftNgEntry(readJsonStrict($ngFile,[]),$row);}
function teacherOpenSlots($date,$entries,$rows,$actor){
 $times=['①'=>['13:30','14:10'],'②'=>['14:20','15:00'],'③'=>['15:10','15:50'],'④'=>['16:00','16:40'],'⑤'=>['16:50','17:30'],'⑥'=>['17:40','18:20'],'⑦'=>['18:30','19:10'],'⑧'=>['19:20','20:00'],'⑨'=>['20:10','20:50'],'⑩'=>['21:00','21:40'],'⑪'=>['21:50','22:30']];$teachers=[];
 foreach($entries as $e){if(!is_array($e)||normalizeNgDate($e['date']??'')!==$date)continue;$name=trim((string)($e['teacher']??''));if($name===''||$name==='未設定'||$name==='未定'||preg_match('/^__.*__$/D',$name)||($actor['role']!=='admin'&&$name!==$actor['name']))continue;
  // Legacy NG submissions define the remaining slots as OK. No record is unknown;
  // an empty legacy record is not proof that an all-OK day was submitted.
  $selected=$e['slots']??[];if(!is_array($selected)||array_diff($selected,array_keys($times)))continue;
  if(!empty($e['allDay'])||$selected||($e['availabilitySubmitted']??false)===true)$teachers[$name]=true;
 }
 $entries=array_values(array_filter($entries,fn($entry)=>is_array($entry)&&normalizeNgDate($entry['date']??'')===$date));
 $rows=array_values(array_filter($rows,fn($row)=>is_array($row)&&normalizeNgDate($row['日付']??'')===$date&&!empty($row['担当講師'])&&empty($row['日区分'])&&empty($row['_deleted'])));
 $out=[];foreach(array_keys($teachers) as $teacher){$free=[];foreach($times as $slot=>[$start,$end]){
  if(teacherShiftNgEntry($entries,['担当講師'=>$teacher,'日付'=>$date,'時間番号'=>$slot]))continue;$busy=false;
  foreach($rows as $row){if(!empty($row['_deleted'])||!empty($row['日区分'])||normalizeNgDate($row['日付']??'')!==$date||trim((string)($row['担当講師']??''))!==$teacher)continue;
   $from=(string)($row['開始']??'');$until=(string)($row['終了']??'');$valid=preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/D',$from)&&preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/D',$until)&&$from<$until;
   if(trim((string)($row['時間番号']??''))===$slot||($valid&&$from<$end&&$start<$until)){$busy=true;break;}
  }if(!$busy)$free[]=$slot;
 }if($free)$out[]=['teacher'=>$teacher,'slots'=>$free];}usort($out,fn($a,$b)=>strcmp($a['teacher'],$b['teacher']));return $out;
}
