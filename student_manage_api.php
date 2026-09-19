<?php
require_once __DIR__.'/lesson_policy.php';require_once __DIR__.'/lesson_links.php';
$actor=staffRequire(true);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
$dir=__DIR__.'/data';$base=readJsonStrict($dir.'/schedule_data.json');$students=readJsonStrict($dir.'/student_master.json',$base['students']??[]);
$in=$_SERVER['REQUEST_METHOD']==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式が不正です',400);
$name=trim((string)($in['name']??''));$own=array_values(array_filter($students,fn($r)=>($r['生徒名']??'')===$name));if(!$own)staffFail('生徒が見つかりません',404);
function smDate($v){$v=(string)$v;if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$v)||!checkdate((int)substr($v,5,2),(int)substr($v,8,2),(int)substr($v,0,4)))staffFail('日付を確認してください',400);return $v;}
function smWithin($periods,$date){foreach($periods as $p)if((empty($p['from'])||$p['from']<=$date)&&(empty($p['until'])||$date<$p['until']))return true;return false;}
function smReplaceFuture($periods,$date,$enabled){$out=[];foreach($periods as $p){if(!empty($p['from'])&&$p['from']>=$date)continue;if(empty($p['until'])||$p['until']>$date)$p['until']=$date;$out[]=$p;}if($enabled)$out[]=['from'=>$date,'until'=>''];return $out;}
function smVersion($value){return hash('sha256',json_encode($value,JSON_UNESCAPED_UNICODE));}
function smEffectiveExempt($own,$class,$date,$state,$name){$value=$state['attendance'][$name]??'';if($value!==''&&$value!=='---')return $value==='免除';if(isset($state['exemptionOverrides'][$name]))return (bool)$state['exemptionOverrides'][$name];foreach($own as $r)if(($r['クラス']??'')===$class&&smWithin($r['免除期間']??[],$date))return true;return false;}
$action=$in['action']??'memberships';
if($_SERVER['REQUEST_METHOD']==='GET'&&$action==='memberships'){
 $classes=[];foreach(array_merge(policyRows(),$students) as $r)if(!empty($r['クラス']))$classes[$r['クラス']]=true;
 echo json_encode(['ok'=>true,'rows'=>$own,'classes'=>array_keys($classes),'version'=>smVersion($own)],JSON_UNESCAPED_UNICODE);exit;
}
if($_SERVER['REQUEST_METHOD']==='GET'&&$action==='lessons'){
 $from=smDate($in['from']??date('Y-m-d'));$to=smDate($in['to']??$from);if($to<$from||strtotime($to)-strtotime($from)>62*86400)staffFail('表示期間は63日以内にしてください',400);
 $all=readJsonStrict($dir.'/class_state.json');$list=[];
 foreach(policyRows() as $r){$date=str_replace('/','-',$r['日付']??'');if(!empty($r['日区分'])||$date<$from||$date>$to)continue;$member=false;foreach($own as $m)if(($m['クラス']??'')===($r['クラス']??'')&&smWithin($m['在籍期間']??[['from'=>'','until'=>'']],$date)){$member=true;break;}if(!$member)continue;
  $key=canonicalLessonKey(policyKey($r));$state=$all[$key]??[];$isExempt=smEffectiveExempt($own,$r['クラス'],$date,$state,$name);
  $list[]=['sourceKey'=>$r['_sourceKey'],'key'=>$key,'date'=>$date,'slot'=>$r['時間番号']??'','className'=>$r['クラス'],'teacher'=>$r['担当講師']??'','start'=>$r['開始']??'','end'=>$r['終了']??'','exempt'=>$isExempt,'attendance'=>$state['attendance'][$name]??($isExempt?'免除（クラス設定）':'未入力'),'version'=>smVersion([$r,$own,$state['attendance'][$name]??null,$state['exemptionOverrides'][$name]??null,$state['exemptionUndo'][$name]??null])];
 }
 usort($list,fn($a,$b)=>strcmp($a['date'].$a['start'].$a['className'],$b['date'].$b['start'].$b['className']));echo json_encode(['ok'=>true,'lessons'=>$list],JSON_UNESCAPED_UNICODE);exit;
}
if($_SERVER['REQUEST_METHOD']!=='POST')staffFail('Method not allowed',405);
if($action==='priorities'){
 if(!hash_equals(smVersion($own),(string)($in['version']??'')))staffFail('参加クラスまたは優先度が更新されました。開き直して確認してください。',409);
 $changesIn=$in['changes']??null;if(!is_array($changesIn)||!count($changesIn)||count($changesIn)>300||array_keys($changesIn)!==range(0,count($changesIn)-1))staffFail('変更する優先度を確認してください',400);
 $visibility=readJsonStrict($dir.'/lesson_visibility.json');$hidden=$visibility['hidden']??$visibility;$updates=[];
 foreach($changesIn as $change){
  if(!is_array($change)||!is_string($change['className']??null))staffFail('クラス名を確認してください',400);
  $class=$change['className'];$value=$change['priority']??null;
  if(isset($updates[$class])||!array_filter($own,fn($r)=>($r['クラス']??'')===$class))staffFail('参加クラスが更新されました。開き直してください。',409);
  if(in_array($class,$hidden,true))staffFail('非表示のクラスです。開き直してください。',409);
  if(!(is_int($value)||is_string($value))||!preg_match('/^[+-]?\d+$/D',(string)$value)||abs((float)$value)>9007199254740991)staffFail('優先度は整数で入力してください',400);
  $updates[$class]=(string)(int)$value;
 }
 foreach($students as &$r)if(($r['生徒名']??'')===$name&&array_key_exists($r['クラス']??'',$updates))$r['優先度']=$updates[$r['クラス']];unset($r);
 $changes=[$dir.'/student_master.json'=>$students];if(is_file($dir.'/schedule_data.json')){$base['students']=$students;$changes[$dir.'/schedule_data.json']=$base;}
 if(!safeDataTransaction($changes))staffFail('優先度を保存できません',500);
 echo json_encode(['ok'=>true],JSON_UNESCAPED_UNICODE);exit;
}
if($action==='class_exemption'){
 if(!hash_equals(smVersion($own),(string)($in['version']??'')))staffFail('参加クラスが更新されました。再読み込みして確認してください。',409);
 $date=smDate($in['date']??'');if($date!==date('Y-m-d'))staffFail('日付が変わりました。再読み込みしてください。',409);
 $class=(string)($in['className']??'');$exempt=$in['exempt']??null;if(!is_bool($exempt))staffFail('免除の設定を確認してください',400);
 $records=array_values(array_filter($own,fn($r)=>($r['クラス']??'')===$class));
 $enrolled=false;foreach($records as $r)if(smWithin($r['在籍期間']??[['from'=>'','until'=>'']],$date))$enrolled=true;
 if(!$enrolled)staffFail('現在参加中のクラスではありません。「参加クラスの設定」で確認してください。',409);
 $current=smEffectiveExempt($records,$class,$date,[],$name);if($current===$exempt)staffFail('参加状態が更新されました。再読み込みして確認してください。',409);
 // Keep enrollment dates and already planned future exemption periods intact.
 $next='';foreach($records as $r)foreach($r['免除期間']??[] as $p)if(($p['from']??'')>$date&&($next===''||$p['from']<$next))$next=$p['from'];
 foreach($students as &$r){
  if(($r['生徒名']??'')!==$name||($r['クラス']??'')!==$class)continue;
  $periods=$r['免除期間']??[];
  if($exempt){if(smWithin($r['在籍期間']??[['from'=>'','until'=>'']],$date))$periods[]=['from'=>$date,'until'=>$next];}
  else{$kept=[];foreach($periods as $p){if(smWithin([$p],$date)){if(($p['from']??'')===$date)continue;$p['until']=$date;}$kept[]=$p;}$periods=$kept;}
  $r['免除期間']=$periods;
 }unset($r);
 $changes=[$dir.'/student_master.json'=>$students];if(is_file($dir.'/schedule_data.json')){$base['students']=$students;$changes[$dir.'/schedule_data.json']=$base;}
 if(!safeDataTransaction($changes))staffFail('免除の設定を保存できません',500);
 echo json_encode(['ok'=>true,'exempt'=>$exempt],JSON_UNESCAPED_UNICODE);exit;
}
if($action==='memberships'){
 if(!hash_equals(smVersion($own),(string)($in['version']??'')))staffFail('参加クラスが更新されました。開き直して確認してください。',409);
 $date=smDate($in['date']??'');$changesIn=$in['changes']??null;if(!is_array($changesIn)||count($changesIn)>300)staffFail('参加クラスを確認してください',400);
 $known=[];foreach(array_merge(policyRows(),$students) as $r)if(!empty($r['クラス']))$known[$r['クラス']]=true;
 $directory=readJsonStrict($dir.'/directory_state.json');$seen=[];
 foreach($changesIn as $c){$class=trim((string)($c['className']??''));$status=$c['status']??'';
  if($class===''||strlen($class)>300||preg_match('/[|\x00-\x1f\x7f]/u',$class)||isset($seen[$class])||!in_array($status,['active','optional','exempt','ended'],true))staffFail('クラス名・参加状態を確認してください',400);$seen[$class]=true;
  if(!empty($c['create'])){if(isset($known[$class])||isset($directory['classNameAliases'][$class]))staffFail('作成するクラスと同じ名前、または旧名が使われています。',409);$known[$class]=true;}
  elseif(!isset($known[$class]))staffFail('クラスが見つかりません。開き直してください。',409);
  $found=false;foreach($students as &$r){if(($r['生徒名']??'')!==$name||($r['クラス']??'')!==$class)continue;$found=true;
   $r['在籍期間']=smReplaceFuture($r['在籍期間']??[['from'=>'','until'=>'']],$date,$status!=='ended');
   $r['免除期間']=smReplaceFuture($r['免除期間']??[],$date,$status==='exempt');
   $r['自由参加期間']=smReplaceFuture($r['自由参加期間']??[],$date,$status==='optional');
  }unset($r);
  if(!$found&&$status!=='ended')$students[]=['生徒名'=>$name,'クラス'=>$class,'優先度'=>'0','在籍期間'=>[['from'=>$date,'until'=>'']],'免除期間'=>$status==='exempt'?[['from'=>$date,'until'=>'']]:[],'自由参加期間'=>$status==='optional'?[['from'=>$date,'until'=>'']]:[]];
  if(!$found&&$status==='ended'&&!empty($c['create']))$students[]=['生徒名'=>'','クラス'=>$class,'優先度'=>'0'];
 }
 $changes=[$dir.'/student_master.json'=>$students];if(is_file($dir.'/schedule_data.json')){$base['students']=$students;$changes[$dir.'/schedule_data.json']=$base;}
 if(!safeDataTransaction($changes))staffFail('参加クラスを保存できません',500);
 echo json_encode(['ok'=>true],JSON_UNESCAPED_UNICODE);exit;
}
if($action==='exempt_lesson'){
 $source=(string)($in['sourceKey']??'');$r=null;foreach(policyRows() as $row)if(($row['_sourceKey']??'')===$source){$r=$row;break;}if(!$r)staffFail('授業が見つかりません。予定を再読み込みしてください。',409);
 $date=str_replace('/','-',$r['日付']);$member=false;foreach($own as $m)if(($m['クラス']??'')===$r['クラス']&&smWithin($m['在籍期間']??[['from'=>'','until'=>'']],$date))$member=true;if(!$member)staffFail('この日の参加クラスではありません',409);
 $file=$dir.'/class_state.json';$all=readJsonStrict($file);$key=canonicalLessonKey(policyKey($r));$state=$all[$key]??[];
 $version=smVersion([$r,$own,$state['attendance'][$name]??null,$state['exemptionOverrides'][$name]??null,$state['exemptionUndo'][$name]??null]);if(!hash_equals($version,(string)($in['version']??'')))staffFail('出席または授業が更新されました。予定を再読み込みしてください。',409);
 $exempt=!empty($in['exempt']);$isExempt=smEffectiveExempt($own,$r['クラス'],$date,$state,$name);
 if($exempt&&!$isExempt){$state['exemptionUndo'][$name]=['had'=>array_key_exists($name,$state['attendance']??[]),'value'=>$state['attendance'][$name]??null];$state['attendance'][$name]='免除';}
 if(!$exempt&&$isExempt){$undo=$state['exemptionUndo'][$name]??null;if(($state['attendance'][$name]??'')==='免除'){if($undo&&!empty($undo['had'])&&($undo['value']??'')!=='免除')$state['attendance'][$name]=$undo['value'];else unset($state['attendance'][$name]);}unset($state['exemptionUndo'][$name]);}
 $state['exemptionOverrides'][$name]=$exempt;$state['attendanceTouched']=true;$state['updatedAt']=date('c');$state['updatedBy']=$actor['name'];$all[$key]=$state;
 if(!safeJsonWriteAtomic($file,$all))staffFail('免除を保存できません',500);echo json_encode(['ok'=>true],JSON_UNESCAPED_UNICODE);exit;
}
staffFail('不明な操作です',400);
