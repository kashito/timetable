<?php
require_once __DIR__.'/staff_security.php';
$dir=__DIR__.'/data';$file=$dir.'/student_master.json';$directoryFile=$dir.'/directory_state.json';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
$base=readJsonStrict($dir.'/schedule_data.json');$rows=readJsonStrict($file,$base['students']??[]);$directory=readJsonStrict($directoryFile);
if($_SERVER['REQUEST_METHOD']==='GET'){echo json_encode(['ok'=>true,'students'=>$rows,'directory'=>$directory],JSON_UNESCAPED_UNICODE);exit;}
staffRequire(true);if($_SERVER['REQUEST_METHOD']!=='POST')staffFail('Method not allowed',405);
$in=json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式が不正です',400);
if(($in['action']??'')==='withdrawal'){
  $name=trim((string)($in['name']??''));
  if($name===''||!array_filter($rows,fn($r)=>($r['生徒名']??'')===$name))staffFail('生徒が見つかりません。一覧を再読み込みしてください。',400);
  if(!is_bool($in['withdrawn']??null)||!is_bool($in['expectedWithdrawn']??null))staffFail('退会状態を確認してください。',400);
  $was=!empty($directory['withdrawnStudents'][$name]);$withdrawn=$in['withdrawn'];
  if($was!==$in['expectedWithdrawn'])staffFail('在籍状態が更新されました。再読み込みしてください。',409);
  if($was!==$withdrawn){
    if($withdrawn){
      $directory['beforeWithdrawal'][$name]=['hidden'=>!empty($directory['hiddenStudents'][$name]),'from'=>$directory['hiddenStudentFrom'][$name]??null];
      $directory['withdrawnStudents'][$name]=true;
      $directory['hiddenStudents'][$name]=true;
      $directory['hiddenStudentFrom'][$name]='0001-01-01';
    }else{
      $previous=$directory['beforeWithdrawal'][$name]??[];
      $directory['withdrawnStudents'][$name]=false;
      $directory['hiddenStudents'][$name]=!empty($previous['hidden']);
      if(isset($previous['from']))$directory['hiddenStudentFrom'][$name]=$previous['from'];else unset($directory['hiddenStudentFrom'][$name]);
      unset($directory['beforeWithdrawal'][$name]);
    }
    if(!safeJsonWriteAtomic($directoryFile,$directory))staffFail('保存できません',500);
  }
}elseif(($in['action']??'')==='visibility'){
  if(!empty($directory['withdrawnStudents'][trim((string)($in['name']??''))]))staffFail('退会中です。生徒管理で在籍に戻してください。',409);
  $name=trim((string)($in['name']??''));if($name==='')staffFail('生徒名がありません',400);
  if(!array_filter($rows,fn($r)=>($r['生徒名']??'')===$name))staffFail('生徒が見つかりません。一覧を再読み込みしてください。',400);
  $hidden=!empty($in['hidden']);
  if($hidden&&(empty($directory['hiddenStudents'][$name])||empty($directory['hiddenStudentFrom'][$name])))$directory['hiddenStudentFrom'][$name]=date('Y-m-d');
  $directory['hiddenStudents'][$name]=$hidden;
  if(!safeJsonWriteAtomic($directoryFile,$directory))staffFail('保存できません',500);
}elseif(($in['action']??'')==='members'){
  $class=trim((string)($in['className']??''));$names=$in['names']??null;$date=(string)($in['date']??date('Y-m-d'));
  if($class===''||!is_array($names)||!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date))staffFail('授業名・生徒・適用日を確認してください',400);
  $names=array_values(array_unique(array_filter(array_map('trim',$names))));$found=[];
  foreach($rows as &$r){
    if(($r['クラス']??'')!==$class||empty($r['生徒名']))continue;$name=$r['生徒名'];$found[]=$name;
    $periods=$r['在籍期間']??[['from'=>'','until'=>'']];$active=false;
    foreach($periods as $p)if(($p['from']===''||$p['from']<=$date)&&($p['until']===''||$date<$p['until']))$active=true;
    $selected=in_array($name,$names,true);
    if($active&&!$selected){foreach($periods as &$p)if(($p['from']===''||$p['from']<=$date)&&($p['until']===''||$date<$p['until']))$p['until']=$date;unset($p);}
    if(!$active&&$selected)$periods[]=['from'=>$date,'until'=>''];
    $r['在籍期間']=$periods;
  }unset($r);
  foreach($names as $name)if(!in_array($name,$found,true))$rows[]=['生徒名'=>$name,'クラス'=>$class,'優先度'=>'0','在籍期間'=>[['from'=>$date,'until'=>'']]];
  require_once __DIR__.'/lesson_links.php';$changes=[$file=>$rows];
  if(is_file($dir.'/schedule_data.json')){$base['students']=$rows;$changes[$dir.'/schedule_data.json']=$base;}
  if(!safeDataTransaction($changes))staffFail('保存できません',500);
}else staffFail('不明な操作です',400);
echo json_encode(['ok'=>true,'students'=>$rows,'directory'=>$directory],JSON_UNESCAPED_UNICODE);
