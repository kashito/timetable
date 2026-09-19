<?php
// Keep PHP failures in the API response; detailed errors belong in the server log.
$spBufferLevel=ob_get_level();ob_start();ini_set('display_errors','0');
function spUnexpected($detail){
 global $spBufferLevel;
 error_log('[student_profile_api] '.$detail);
 while(ob_get_level()>$spBufferLevel)ob_end_clean();
 $saving=($_SERVER['REQUEST_METHOD']??'GET')==='POST';
 http_response_code(500);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store, private');
 echo json_encode(['ok'=>false,'error'=>$saving?'生徒情報の保存結果を確認できませんでした。入力内容は残っています。もう一度保存してください。（PROFILE_SAVE）':'生徒情報を読み込めませんでした。時間をおいて開き直してください。（PROFILE_LOAD）','uncertain'=>$saving],JSON_UNESCAPED_UNICODE);
}
set_exception_handler(function($e){spUnexpected(get_class($e).': '.$e->getMessage().' at '.$e->getFile().':'.$e->getLine());});
register_shutdown_function(function(){
 $e=error_get_last();
 if($e&&in_array($e['type'],[E_ERROR,E_PARSE,E_CORE_ERROR,E_COMPILE_ERROR],true))spUnexpected($e['message'].' at '.$e['file'].':'.$e['line']);
});
require_once __DIR__.'/staff_security.php';
$actor=staffRequire(true);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store, private');
$dir=__DIR__.'/data';$file=$dir.'/student_profiles.php';
$base=readJsonStrict($dir.'/schedule_data.json');$students=readJsonStrict($dir.'/student_master.json',$base['students']??[]);
$names=[];foreach($students as $r)if(!empty($r['生徒名']))$names[$r['生徒名']]=true;
$profiles=readJsonStrict($file);
function spVersion($profile){return hash('sha256',json_encode($profile,JSON_UNESCAPED_UNICODE));}
function spText($value,$label,$limit,$multiline=false){
 if(!is_string($value)||strlen($value)>$limit||preg_match($multiline?'/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u':'/[\x00-\x1f\x7f]/u',$value))staffFail($label.'の入力内容・長さを確認してください。',400);
 return trim($value);
}
function spSummary($p){return ['registrationNumber'=>$p['registrationNumber']??'','school'=>$p['school']??'','addressShort'=>$p['addressShort']??''];}
$method=$_SERVER['REQUEST_METHOD'];
if($method==='GET'&&($_GET['action']??'list')==='list'){
 require_once __DIR__.'/presence_data.php';$numbers=prRegistrationNumbers();
 $out=[];foreach($names as $name=>$unused){$out[$name]=spSummary($profiles[$name]??[]);if(isset($numbers['numbers'][$name])){$out[$name]['registrationNumber']=$numbers['numbers'][$name];$out[$name]['numberSource']='attendance';}}
 echo json_encode(['ok'=>true,'profiles'=>$out,'numberStatus'=>$numbers['status']],JSON_UNESCAPED_UNICODE);exit;
}
if(!in_array($method,['GET','POST'],true))staffFail('Method not allowed',405);
$in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式が不正です。',400);
$name=spText($in['name']??'','生徒名',300);if(!isset($names[$name]))staffFail('生徒が見つかりません。一覧を再読み込みしてください。',404);
$profile=$profiles[$name]??[];$version=spVersion($profile);
if($method==='GET'){
 if(($in['action']??'')!=='detail')staffFail('不明な操作です。',400);
 require_once __DIR__.'/presence_data.php';$numbers=prRegistrationNumbers();
 echo json_encode(['ok'=>true,'profile'=>$profile,'version'=>$version,'linkedRegistrationNumber'=>$numbers['numbers'][$name]??'','numberStatus'=>$numbers['status']],JSON_UNESCAPED_UNICODE);exit;
}
if(($in['action']??'')!=='save')staffFail('不明な操作です。',400);
if(!is_string($in['version']??null)||!hash_equals($version,$in['version']))staffFail('生徒情報が更新されました。開き直して確認してください。',409);
$patch=$in['profile']??null;if(!is_array($patch))staffFail('生徒情報を確認してください。',400);
foreach(['registrationNumber'=>['塾籍番号',120],'school'=>['所属学校',600],'address'=>['住所',1500],'addressShort'=>['一覧用の住所',300]] as $field=>$rule){
 if(array_key_exists($field,$patch))$profile[$field]=spText($patch[$field],$rule[0],$rule[1]);
}
$number=$profile['registrationNumber']??'';
if($number!=='')foreach($profiles as $otherName=>$other)if($otherName!==$name&&strtoupper(trim((string)($other['registrationNumber']??'')))===strtoupper($number))staffFail('その塾籍番号は別の生徒に登録されています。番号を確認してください。',409);
if(array_key_exists('extras',$patch)){
 if(!is_array($patch['extras'])||$patch['extras']!==array_values($patch['extras'])||count($patch['extras'])>30)staffFail('追加情報は30項目以内で入力してください。',400);
 $old=[];foreach($profile['extras']??[] as $extra)if(!empty($extra['id']))$old[$extra['id']]=$extra;
 $labels=[];$ids=[];$extras=[];
 foreach($patch['extras'] as $extra){
  if(!is_array($extra))staffFail('追加情報の形式を確認してください。',400);
  $label=spText($extra['label']??'','追加情報の項目名',150);$value=spText($extra['value']??'','追加情報の内容',12000,true);
  if($label===''&&$value==='')continue;
  if($label===''||isset($labels[$label]))staffFail('追加情報には、重複しない項目名を入力してください。',400);$labels[$label]=true;
  $id=$extra['id']??bin2hex(random_bytes(12));if(!is_string($id)||!preg_match('/^[a-zA-Z0-9_-]{1,64}$/',$id)||isset($ids[$id]))staffFail('追加情報を開き直して確認してください。',400);$ids[$id]=true;
  $extras[]=array_replace($old[$id]??[],['id'=>$id,'label'=>$label,'value'=>$value]);
 }
 $profile['extras']=$extras;
}
$profile['id']=$profile['id']??bin2hex(random_bytes(16));$profile['schemaVersion']=$profile['schemaVersion']??1;
$profile['createdAt']=$profile['createdAt']??date('c');$profile['updatedAt']=date('c');$profile['updatedBy']=$actor['name'];$profile['name']=$name;
$profiles[$name]=$profile;
if(!safeJsonWriteAtomic($file,$profiles))staffFail('生徒情報を保存できませんでした。入力内容を残して再度お試しください。',500);
echo json_encode(['ok'=>true,'profile'=>$profile,'summary'=>spSummary($profile),'version'=>spVersion($profile)],JSON_UNESCAPED_UNICODE);
