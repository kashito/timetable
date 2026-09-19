<?php
// Notifications are calculated from current lessons and saved records. Reading never completes a task.
require_once __DIR__.'/lesson_groups.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');header('Vary: Cookie');
$actor=staffRequire();
// r45: assignment follows the signed-in teacher; unassigned lessons belong to admins.
$assignedName=trim((string)$actor['name']);
$method=$_SERVER['REQUEST_METHOD']??'GET';if(!in_array($method,['GET','POST'],true))staffFail('操作を確認してください。',405);
$in=$method==='POST'?json_decode(file_get_contents('php://input'),true):$_GET;
if(!is_array($in))staffFail('入力内容を確認してください。',400);
if($method==='POST'&&$actor['role']!=='admin')staffFail('通知の除外は管理者のみ操作できます。',403);
$includeExcluded=($in['includeExcluded']??'')==='1'||$method==='POST';
if($includeExcluded&&$actor['role']!=='admin')staffFail('除外済みの確認は管理者のみ行えます。',403);
$scope=$method==='POST'?'all':(string)($_GET['scope']??'mine');
if(!in_array($scope,['mine','all'],true))staffFail('表示対象を確認してください。',400);
if($scope==='all'&&$actor['role']!=='admin')staffFail('全講師の未記入は管理者のみ確認できます。',403);
try {
 $dir=__DIR__.'/data';$exFile=$dir.'/lesson_task_exclusions.php';$exData=readJsonStrict($exFile,['schema'=>1,'items'=>[]]);
 if(($exData['schema']??null)!==1||!is_array($exData['items']??null))staffFail('通知の除外設定を読み込めません。',500);
 $exVersion=hash('sha256',json_encode($exData,JSON_UNESCAPED_UNICODE));$rows=policyRows();$groups=lessonGroups();
 $records=readJsonStrict($dir.'/lesson_records.json');$states=readJsonStrict($dir.'/class_state.json');
 $directory=readJsonStrict($dir.'/directory_state.json');
 $students=readJsonStrict($dir.'/student_master.json',readJsonStrict($dir.'/schedule_data.json')['students']??[]);
 $aliases=readJsonStrict($dir.'/lesson_key_aliases.json');
 $resolve=function($name,$map){$seen=[];while(isset($map[$name])&&!isset($seen[$name])){$seen[$name]=true;$name=(string)$map[$name];}return $name;};
 $className=function($name)use($resolve,$directory){return $resolve($name,$directory['classNameAliases']??[]);};
 $key=function($r)use($resolve,$aliases){return $resolve(policyKey($r),$aliases);};
 $within=function($periods,$date){foreach($periods as $p)if((empty($p['from'])||$p['from']<=$date)&&(empty($p['until'])||$date<$p['until']))return true;return false;};
 $exByKey=[];foreach($exData['items'] as $entry)$exByKey[$resolve($entry['key'],$aliases)]=$entry;
 $rosters=[];foreach($students as $s)if(!empty($s['生徒名'])&&empty($directory['hiddenStudents'][$s['生徒名']]))$rosters[$className($s['クラス']??'')][]=$s;
 $bySource=[];foreach($groups as $g)if(!empty($g['active']))foreach($g['sources']??[] as $s)$bySource[$s]=$g;
 $units=[];
 foreach($rows as $r){
  if(!empty($r['日区分']))continue;
  $teacher=trim((string)($r['担当講師']??''));
  if($scope==='mine'&&$teacher!==$assignedName&&!($actor['role']==='admin'&&$teacher===''))continue;
  $g=$bySource[$r['_sourceKey']]??null;$unitKey=$g?$g['key']:$key($r);
  if(!isset($units[$unitKey]))$units[$unitKey]=['group'=>$g,'rows'=>[]];
  $units[$unitKey]['rows'][$key($r)]=$r;
 }
 $slots=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];
 $ends=['14:10','15:00','15:50','16:40','17:30','18:20','19:10','20:00','20:50','21:40','22:30'];
 $now=time();$items=[];$allMissing=[];$totals=['attendance'=>0,'memo'=>0,'homework'=>0];
 foreach($units as $unitKey=>$unit){
  $members=$unit['rows'];$g=$unit['group'];$lastEnd=0;$valid=true;
  // An active linked lesson becomes due only after all of its current slots end.
  if($g&&count($members)!==count($g['sources']??[]))continue;
  foreach($members as $r){
   $date=str_replace('/','-',trim((string)($r['日付']??'')));$si=array_search($r['時間番号']??'',$slots,true);
   $end=trim((string)($r['終了']??''));if($end===''&&$si!==false)$end=$ends[$si];
   $dt=DateTimeImmutable::createFromFormat('!Y-m-d H:i',$date.' '.$end);
   if(!$dt||$dt->format('Y-m-d H:i')!==$date.' '.$end){$valid=false;break;}
   $lastEnd=max($lastEnd,$dt->getTimestamp());
  }
  if(!$valid||$lastEnd>$now)continue;
  uasort($members,function($a,$b)use($slots){return array_search($a['時間番号']??'',$slots,true)<=>array_search($b['時間番号']??'',$slots,true);});
  $first=reset($members);$date=str_replace('/','-',$first['日付']);$missingNames=[];$missingSlots=[];$namesByKey=[];
  foreach($members as $memberKey=>$r){
   $st=$states[$memberKey]??[];$names=[];
   foreach($rosters[$className($r['クラス']??'')]??[] as $s){
    if(!$within($s['在籍期間']??[['from'=>'','until'=>'']],$date))continue;
    $name=$s['生徒名'];$value=$st['attendance'][$name]??'';
    if(in_array($value,['出席','遅刻','欠席','早退','免除','その他','不明','未定'],true))continue;
    $exempt=$st['exemptionOverrides'][$name]??$within($s['免除期間']??[],$date);
    if(!$exempt)$names[$name]=true;
   }
   if($names){$namesByKey[$memberKey]=array_keys($names);$missingSlots[]=$r['時間番号'];$missingNames+=$names;}
  }
  $record=$records[$unitKey]??[];$missing=[];
  if($missingNames)$missing[]='attendance';
  if(trim((string)($record['memo']??''))==='')$missing[]='memo';
  if(trim((string)($record['homework']??''))==='')$missing[]='homework';
  if(!$missing)continue;
  $sources=array_column($members,'_sourceKey');sort($sources);$signature=hash('sha256',json_encode($sources));
  $ex=$exByKey[$unitKey]??null;$excluded=!empty($ex['excluded'])&&($ex['signature']??'')===$signature;
  $token=hash('sha256',json_encode([$unitKey,$members,$record,array_intersect_key($states,$members),$missing],JSON_UNESCAPED_UNICODE));
  $item=['key'=>$unitKey,'groupId'=>$g['id']??'','date'=>$date,'slots'=>implode('',array_column($members,'時間番号')),
   'className'=>$first['クラス']??'','teacher'=>$first['担当講師']??'','room'=>$first['教室']??'',
   'start'=>$first['開始']??'','end'=>date('H:i',$lastEnd),'missing'=>$missing,
   'attendanceStudents'=>count($missingNames),'attendanceSlots'=>implode('',$missingSlots),
   'url'=>$g?'lesson_group.html?v=20260916-r53&id='.rawurlencode($g['id']):'teacher2026summer_vertical.html?'.http_build_query(['teacher'=>$first['担当講師']??'','date'=>$date,'openKey'=>$key($first)],'','&',PHP_QUERY_RFC3986)];
  $allMissing[$unitKey]=$item+['token'=>$token,'signature'=>$signature,'excluded'=>$excluded,'members'=>$members,'record'=>$record,'namesByKey'=>$namesByKey];
  if($actor['role']==='admin')$item+=['token'=>$token,'excluded'=>$excluded,'excludedBy'=>$excluded?$ex['by']:'','excludedAt'=>$excluded?$ex['at']:''];
  if(!$excluded)foreach($missing as $m)$totals[$m]++;
  if(!$excluded||$includeExcluded)$items[]=$item;
 }
 if($method==='POST'){
  if(!in_array($in['action']??'',['set_excluded','set_tbd'],true)||(($in['action']??'')==='set_excluded'&&!is_bool($in['excluded']??null))||!is_array($in['items']??null)||!$in['items']||count($in['items'])>300)staffFail('対象を1〜300件選択してください。',400);
  if(!is_string($in['version']??null)||!hash_equals($exVersion,$in['version']))staffFail('別の画面で除外設定が更新されました。再読み込みしてください。',409);
  $selected=[];foreach($in['items'] as $request){if(!is_array($request))staffFail('対象を確認してください。',400);$k=$request['key']??null;if(!is_string($k)||isset($selected[$k]))staffFail('対象が重複しています。選び直してください。',400);$item=$allMissing[$k]??null;
   if(!$item||!is_string($request['token']??null)||!hash_equals($item['token'],$request['token']))staffFail('授業の記録や予定が更新されました。再読み込みして対象を確認してください。',409);$selected[$k]=$item;
  }
  if($in['action']==='set_tbd'){
   $fields=$in['fields']??[];if(!is_array($fields)||!$fields||count(array_unique($fields))!==count($fields)||array_diff($fields,['attendance','memo','homework']))staffFail('未定にする項目を選んでください。',400);
   require_once __DIR__.'/lesson_links.php';$changed=0;
   foreach($selected as $k=>$item){$r=reset($item['members']);$record=$records[$k]??['eventKey'=>$k,'date'=>$item['date'],'slot'=>$item['slots'],'className'=>$item['className'],'teacher'=>$item['teacher'],'room'=>$item['room'],'subject'=>$r['科目']??'','author'=>$actor['name'],'createdAt'=>date('c'),'replies'=>[],'reads'=>[]];$recordChanged=false;
    foreach(array_intersect($fields,$item['missing']) as $field){if($field==='attendance'){foreach($item['namesByKey'] as $memberKey=>$names){$st=$states[$memberKey]??[];foreach($names as $name)$st['attendance'][$name]='未定';$st['attendanceTouched']=true;$st['updatedAt']=date('c');$st['updatedBy']=$actor['name'];$st['deferredAt']=date('c');$st['deferredBy']=$actor['name'];$states[$memberKey]=$st;}}else{$record[$field]='未定';$recordChanged=true;}$changed++;}
    if($recordChanged){$record['updatedAt']=date('c');$record['editedBy']=$actor['name'];$record['deferredAt']=date('c');$record['deferredBy']=$actor['name'];$records[$k]=$record;}
   }
   if(!safeDataTransaction([$dir.'/lesson_records.json'=>$records,$dir.'/class_state.json'=>$states]))staffFail('未定の記録を保存できませんでした。',500);
   echo json_encode(['ok'=>true,'changed'=>count($selected),'fieldsChanged'=>$changed],JSON_UNESCAPED_UNICODE);exit;
  }
  foreach($selected as $k=>$item){$entry=$exByKey[$k]??['history'=>[]];$entry['key']=$k;$entry['signature']=$item['signature'];$entry['excluded']=$in['excluded'];$entry['at']=date('c');$entry['by']=$actor['name'];$entry['byId']=$actor['id'];$entry['history'][]=['excluded'=>$in['excluded'],'at'=>$entry['at'],'by'=>$actor['name'],'byId'=>$actor['id']];$exData['items'][$k]=$entry;}
  if(!safeJsonWriteAtomic($exFile,$exData))staffFail('通知の設定を保存できませんでした。',500);
  echo json_encode(['ok'=>true,'changed'=>count($selected)],JSON_UNESCAPED_UNICODE);exit;
 }
 usort($items,function($a,$b){return strcmp($b['date'].' '.$b['end'],$a['date'].' '.$a['end'])?:strcmp($a['className'],$b['className'])?:strcmp($a['key'],$b['key']);});
 $out=['ok'=>true,'scope'=>$scope,'count'=>count(array_filter($allMissing,fn($r)=>!$r['excluded'])),'totals'=>$totals,'asOf'=>date('c')];
 if($actor['role']==='admin')$out['exclusionVersion']=$exVersion;
 if(empty($_GET['countOnly']))$out['items']=$items;
 $json=json_encode($out,JSON_UNESCAPED_UNICODE);if($json===false)throw new RuntimeException('JSON encoding');echo $json;
} catch(Throwable $e){error_log('Lesson tasks: '.get_class($e).' '.basename($e->getFile()).':'.$e->getLine());staffFail('未記入の通知を読み込めませんでした。再読み込みしてください。',500);}
