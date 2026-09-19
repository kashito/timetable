<?php
require_once __DIR__.'/lesson_policy.php';
function lessonGroups(){return readJsonStrict(__DIR__.'/data/lesson_groups.json');}
function lgCompatible($a,$b){foreach(['クラス','担当講師','種別','科目','教室'] as $f)if(trim((string)($a[$f]??''))!==trim((string)($b[$f]??'')))return false;return str_replace('/','-',$a['日付']??'')===str_replace('/','-',$b['日付']??'');}
function buildLessonGroup($rows,$records,$actor,$mealBreak=false){
 $id=bin2hex(random_bytes(12));$key='GROUP:'.$id;$g=['id'=>$id,'key'=>$key,'sources'=>array_column($rows,'_sourceKey'),'snapshot'=>$rows,'active'=>true,'mealBreak'=>$mealBreak,'createdAt'=>date('c'),'createdBy'=>$actor['name']];$summary=groupSummary($g,$rows);$memo=[];$homework=[];
 foreach($rows as $r){$record=$records[canonicalLessonKey(policyKey($r))]??[];if(trim((string)($record['memo']??''))!=='')$memo[]='【'.$r['時間番号'].'】'."\n".$record['memo'];if(trim((string)($record['homework']??''))!=='')$homework[]=$record['homework'];}
 $record=['eventKey'=>$key,'date'=>$summary['date'],'slot'=>$summary['slots'],'className'=>$summary['className'],'teacher'=>$summary['teacher'],'room'=>$summary['room'],'subject'=>$rows[0]['科目']??'','memo'=>implode("\n\n",$memo),'homework'=>implode("\n",array_unique($homework)),'author'=>$actor['name'],'createdAt'=>date('c'),'updatedAt'=>date('c'),'groupId'=>$id,'replies'=>[],'reads'=>[]];
 return [$g,$record];
}
function groupRows($group,$allRows=null){$allRows=$allRows??policyRows();$by=[];foreach($allRows as $r)$by[$r['_sourceKey']]=$r;$rows=[];foreach($group['sources']??[] as $s)if(isset($by[$s]))$rows[]=$by[$s];return $rows;}
function groupForSource($source){foreach(lessonGroups() as $g)if(!empty($g['active'])&&in_array($source,$g['sources']??[],true))return $g;return null;}
function guardGroupedSource($source){if(groupForSource($source))staffFail('このコマは連結中です。連結詳細で「連結を解除」してから日時変更・削除を行ってください。',409);}
function groupSummary($g,$rows=null){$rows=$rows??groupRows($g);if(empty($g['active']))$rows=$g['snapshot']??$rows;$first=$rows[0]??[];return ['id'=>$g['id'],'key'=>$g['key'],'active'=>!empty($g['active']),'mealBreak'=>!empty($g['mealBreak']),'sources'=>$g['sources'],'lessonKeys'=>array_map('policyKey',$rows),'date'=>str_replace('/','-',$first['日付']??''),'slots'=>implode('',array_column($rows,'時間番号')),'className'=>$first['クラス']??'','teacher'=>$first['担当講師']??'','room'=>$first['教室']??'','start'=>$first['開始']??'','end'=>$rows[count($rows)-1]['終了']??''];}
function groupRecordList($records,$homework=false){
 $out=$records;$rows=policyRows();
 foreach(lessonGroups() as $g){if(empty($g['active']))continue;$common=$records[$g['key']]??null;if(!$common)continue;
  foreach(groupRows($g,$rows) as $r){$key=canonicalLessonKey(policyKey($r));if($homework)$out[$key]=['homework'=>$common['homework']??''];else unset($out[$key]);}
 }
 return $out;
}
