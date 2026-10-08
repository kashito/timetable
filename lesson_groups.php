<?php
require_once __DIR__.'/lesson_policy.php';
function lessonGroups(){return readJsonStrict(__DIR__.'/data/lesson_groups.json');}
// All active member keys resolve to the same logical record, independently of UI.
function logicalRecordKey($key){
 $key=canonicalLessonKey($key);$rows=policyRows();foreach(lessonGroups() as $g){if(empty($g['active']))continue;if($key===$g['key'])return $key;foreach(groupRows($g,$rows) as $r)if(canonicalLessonKey(policyKey($r))===$key)return $g['key'];}return $key;
}
function recordRevision($record){return hash('sha256',json_encode($record,JSON_UNESCAPED_UNICODE));}
function commonGroupRecord($g,$records,$rows=null){
 $record=$records[$g['key']]??[];$rows=$rows??groupRows($g);$archive=$record['sourceRecords']??[];$history=$record['recordHistory']??[];
 foreach($rows as $r){$key=canonicalLessonKey(policyKey($r));$old=$records[$key]??[];if(!$old)continue;
  if(!empty($old['sourceRecords'])){foreach($old['sourceRecords'] as $sourceKey=>$source)if(!isset($archive[$sourceKey]))$archive[$sourceKey]=$source;foreach($old['recordHistory']??[] as $identity=>$snapshot)$history[$identity]=$snapshot;$snapshot=$old;unset($snapshot['sourceRecords'],$snapshot['recordHistory']);$history[recordRevision($snapshot)]=$snapshot;}
  elseif(!isset($archive[$key]))$archive[$key]=$old;
 }
 $record['sourceRecords']=$archive;
 if($history)$record['recordHistory']=$history;$sources=array_merge(array_values($archive),array_values($history));
 // Preserve conversations from the original records, without restoring superseded homework.
 $replies=[];foreach(array_merge([$record],$sources) as $source)foreach($source['replies']??[] as $reply){$identity=hash('sha256',json_encode([$reply['id']??'', $reply['author']??'', $reply['text']??'', $reply['createdAt']??''],JSON_UNESCAPED_UNICODE));if(!isset($replies[$identity]))$replies[$identity]=$reply;}
 $record['replies']=array_values($replies);$reads=$record['reads']??[];
 foreach($sources as $source)foreach($source['reads']??[] as $name=>$read)if(!isset($reads[$name])||strcmp($read['at']??'',$reads[$name]['at']??'')>0)$reads[$name]=$read;
 $record['reads']=$reads;
 foreach(['homeworkChecks','reactions'] as $field){$values=$record[$field]??[];foreach($sources as $source)foreach($source[$field]??[] as $id=>$value)if(!array_key_exists($id,$values))$values[$id]=$value;if($values)$record[$field]=$values;}
 return $record;
}
function detachGroupRecords($g,$rows,$records){
 $common=commonGroupRecord($g,$records,$rows);foreach($rows as $r){$key=canonicalLessonKey(policyKey($r));$copy=$common;$copy['sourceRecords']=$common['sourceRecords']??[];$copy['eventKey']=$key;$copy['slot']=$r['時間番号'];$copy['detachedFrom']=$g['key'];unset($copy['groupId']);$records[$key]=$copy;}return $records;
}
function lgCompatible($a,$b){foreach(['クラス','担当講師','種別','科目','教室'] as $f)if(trim((string)($a[$f]??''))!==trim((string)($b[$f]??'')))return false;return str_replace('/','-',$a['日付']??'')===str_replace('/','-',$b['日付']??'');}
function buildLessonGroup($rows,$records,$actor,$mealBreak=false){
 $id=bin2hex(random_bytes(12));$key='GROUP:'.$id;$g=['id'=>$id,'key'=>$key,'sources'=>array_column($rows,'_sourceKey'),'snapshot'=>$rows,'active'=>true,'mealBreak'=>$mealBreak,'createdAt'=>date('c'),'createdBy'=>$actor['name']];$summary=groupSummary($g,$rows);$memo=[];$memoSeen=[];$homework=[];$dueHomework=[];
 foreach($rows as $r){$record=$records[canonicalLessonKey(policyKey($r))]??[];if(trim((string)($record['memo']??''))!==''&&!isset($memoSeen[$record['memo']])){$memo[]='【'.$r['時間番号'].'】'."\n".$record['memo'];$memoSeen[$record['memo']]=true;}if(trim((string)($record['homework']??''))!=='')$homework[]=$record['homework'];foreach(preg_split('/\R/u',trim((string)($record['dueHomework']??''))) as $line)if(trim($line)!=='')$dueHomework[]=trim($line);}
 $record=['eventKey'=>$key,'date'=>$summary['date'],'slot'=>$summary['slots'],'className'=>$summary['className'],'teacher'=>$summary['teacher'],'room'=>$summary['room'],'subject'=>$rows[0]['科目']??'','memo'=>implode("\n\n",$memo),'homework'=>implode("\n",array_unique($homework)),'dueHomework'=>implode("\n",array_unique($dueHomework)),'author'=>$actor['name'],'createdAt'=>date('c'),'updatedAt'=>date('c'),'groupId'=>$id,'replies'=>[],'reads'=>[]];
 // Full original records remain available as history, including conflicting values.
 $records[$key]=$record;$record=commonGroupRecord($g,$records,$rows);
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
 foreach(lessonGroups() as $g){if(empty($g['active']))continue;$common=$records[$g['key']]??null;if(!$common)continue;$common=commonGroupRecord($g,$records,groupRows($g,$rows));$out[$g['key']]=$common;
  foreach(groupRows($g,$rows) as $r){$rawKey=policyKey($r);$key=canonicalLessonKey($rawKey);if($homework){$value=['homework'=>$common['homework']??'','dueHomework'=>$common['dueHomework']??''];$out[$key]=$value;$out[$rawKey]=$value;}else unset($out[$key]);}
 }
 return $out;
}
