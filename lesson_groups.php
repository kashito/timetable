<?php
require_once __DIR__.'/lesson_policy.php';
function lessonGroups(){return readJsonStrict(__DIR__.'/data/lesson_groups.json');}
function lgCompatible($a,$b){foreach(['クラス','担当講師','種別','科目','教室'] as $f)if(trim((string)($a[$f]??''))!==trim((string)($b[$f]??'')))return false;return str_replace('/','-',$a['日付']??'')===str_replace('/','-',$b['日付']??'');}
function buildLessonGroup($rows,$records,$actor,$mealBreak=false){
 $id=bin2hex(random_bytes(12));$key='GROUP:'.$id;$g=['id'=>$id,'key'=>$key,'sources'=>array_column($rows,'_sourceKey'),'snapshot'=>$rows,'active'=>true,'mealBreak'=>$mealBreak,'createdAt'=>date('c'),'createdBy'=>$actor['name']];$summary=groupSummary($g,$rows);$memo=[];$homework=[];$dueHomework=[];
 foreach($rows as $r){$record=$records[canonicalLessonKey(policyKey($r))]??[];if(trim((string)($record['memo']??''))!=='')$memo[]='【'.$r['時間番号'].'】'."\n".$record['memo'];if(trim((string)($record['homework']??''))!=='')$homework[]=$record['homework'];foreach(preg_split('/\R/u',trim((string)($record['dueHomework']??''))) as $line)if(trim($line)!=='')$dueHomework[]=trim($line);}
 $record=['eventKey'=>$key,'date'=>$summary['date'],'slot'=>$summary['slots'],'className'=>$summary['className'],'teacher'=>$summary['teacher'],'room'=>$summary['room'],'subject'=>$rows[0]['科目']??'','memo'=>implode("\n\n",$memo),'homework'=>implode("\n",array_unique($homework)),'dueHomework'=>implode("\n",array_unique($dueHomework)),'author'=>$actor['name'],'createdAt'=>date('c'),'updatedAt'=>date('c'),'groupId'=>$id,'replies'=>[],'reads'=>[]];
 return [$g,$record];
}
function groupRows($group,$allRows=null){$allRows=$allRows??policyRows();$by=[];foreach($allRows as $r)$by[$r['_sourceKey']]=$r;$rows=[];foreach($group['sources']??[] as $s)if(isset($by[$s]))$rows[]=$by[$s];return $rows;}
function groupForSource($source){foreach(lessonGroups() as $g)if(!empty($g['active'])&&in_array($source,$g['sources']??[],true))return $g;return null;}
function guardGroupedSource($source){if(groupForSource($source))staffFail('このコマは連結中です。連結詳細で「連結を解除」してから日時変更・削除を行ってください。',409);}
function groupSummary($g,$rows=null){$rows=$rows??groupRows($g);if(empty($g['active']))$rows=$g['snapshot']??$rows;$first=$rows[0]??[];return ['id'=>$g['id'],'key'=>$g['key'],'active'=>!empty($g['active']),'mealBreak'=>!empty($g['mealBreak']),'sources'=>$g['sources'],'lessonKeys'=>array_map('policyKey',$rows),'date'=>str_replace('/','-',$first['日付']??''),'slots'=>implode('',array_column($rows,'時間番号')),'className'=>$first['クラス']??'','teacher'=>$first['担当講師']??'','room'=>$first['教室']??'','start'=>$first['開始']??'','end'=>$rows[count($rows)-1]['終了']??''];}
function groupSeriesId($row){
 $manual=trim((string)($row['授業ID']??''));if($manual!=='')return 'ID:'.$manual;
 $subjects=array_values(array_filter(array_map('trim',preg_split('/[,、，]/u',(string)($row['科目']??'')))));
 return 'AUTO:'.implode('|',array_values(array_filter([trim((string)($row['クラス']??'')),trim((string)($row['種別']??'')),trim((string)($row['担当講師']??'')),implode('+',$subjects)],fn($v)=>$v!=='')));
}
function groupRowTime($row,$field){
 $value=trim((string)($row[$field]??''));if($value!=='')return $value;
 $times=['①'=>['13:30','14:10'],'②'=>['14:20','15:00'],'③'=>['15:10','15:50'],'④'=>['16:00','16:40'],'⑤'=>['16:50','17:30'],'⑥'=>['17:40','18:20'],'⑦'=>['18:30','19:10'],'⑧'=>['19:20','20:00'],'⑨'=>['20:10','20:50'],'⑩'=>['21:00','21:40'],'⑪'=>['21:50','22:30']];
 $pair=$times[trim((string)($row['時間番号']??''))]??['',''];return $pair[$field==='終了'?1:0];
}
function groupNextLesson($group,$rows,$allRows){
 if(!$rows)return null;$series=groupSeriesId($rows[0]);$summary=groupSummary($group,$rows);$cutoff=strtotime($summary['date'].' '.($summary['end']?:groupRowTime($rows[count($rows)-1],'終了')));if($cutoff===false)return null;$sources=array_fill_keys($group['sources']??[],true);$next=null;$nextAt=null;
 foreach($allRows as $row){
  if(!empty($row['日区分'])||isset($sources[$row['_sourceKey']??''])||groupSeriesId($row)!==$series)continue;
  $date=str_replace('/','-',trim((string)($row['日付']??'')));$start=groupRowTime($row,'開始');if(!preg_match('/^\d{4}-\d{1,2}-\d{1,2}$/',$date)||!preg_match('/^\d{1,2}:\d{2}$/',$start))continue;
  $at=strtotime($date.' '.$start);if($at===false||$at<=$cutoff||($nextAt!==null&&$at>=$nextAt))continue;
  $nextAt=$at;$next=['date'=>date('Y-m-d',$at),'slot'=>trim((string)($row['時間番号']??'')),'start'=>$start,'end'=>groupRowTime($row,'終了')];
 }
 return $next;
}
function groupRecordList($records,$homework=false){
 $out=$records;$rows=policyRows();
 foreach(lessonGroups() as $g){if(empty($g['active']))continue;$common=$records[$g['key']]??null;if(!$common)continue;
  foreach(groupRows($g,$rows) as $r){$key=canonicalLessonKey(policyKey($r));if($homework)$out[$key]=['homework'=>$common['homework']??'','dueHomework'=>$common['dueHomework']??''];else unset($out[$key]);}
 }
 return $out;
}
