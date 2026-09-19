<?php
require_once __DIR__.'/data_safety.php';
function staffFail($message,$code=403){http_response_code($code);header('Content-Type: application/json; charset=utf-8');echo json_encode(['ok'=>false,'error'=>$message],JSON_UNESCAPED_UNICODE);exit;}
function staffSession(){
  if(session_status()===PHP_SESSION_ACTIVE)return;
  ini_set('session.use_strict_mode','1');ini_set('session.use_only_cookies','1');session_name('timetable_staff');
  session_set_cookie_params(['lifetime'=>0,'path'=>rtrim(str_replace('\\','/',dirname($_SERVER['SCRIPT_NAME']??'/')),'/').'/','secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off','httponly'=>true,'samesite'=>'Lax']);
  session_start();
  if(empty($_SESSION['csrf']))$_SESSION['csrf']=bin2hex(random_bytes(32));
  if(empty($_SESSION['uploadOwner']))$_SESSION['uploadOwner']=bin2hex(random_bytes(32));
}
function staffAccounts(){return readJsonStrict(__DIR__.'/data/staff_accounts.php');}
function staffCurrent(){
  staffSession();$accounts=staffAccounts();$id=(string)($_SESSION['staffId']??'');$u=$accounts[$id]??null;
  if(!$u || empty($u['active']) || (int)($u['version']??1)!==(int)($_SESSION['staffVersion']??0) || time()-(int)($_SESSION['loginAt']??0)>43200)return null;
  return ['id'=>$id,'name'=>$u['name'],'role'=>$u['role'],'mustChange'=>!empty($u['mustChange'])];
}
function staffCsrf(){staffSession();$given=(string)($_SERVER['HTTP_X_CSRF_TOKEN']??'');if($given===''||!hash_equals($_SESSION['csrf'],$given))staffFail('画面を再読み込みして、もう一度操作してください。');}
function staffRequire($admin=false){
  $u=staffCurrent();if(!$u)staffFail('先生のログインが必要です。',401);
  if($u['mustChange'] && basename($_SERVER['SCRIPT_NAME']??'')!=='staff_auth_api.php')staffFail('先に自分のパスワードを設定してください。');
  if($admin && $u['role']!=='admin')staffFail('管理者のみ操作できます。');
  if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET')staffCsrf();return $u;
}
function staffPublicState($state){
  if(staffCurrent())return $state;$out=[];
  foreach($state as $key=>$row)if(strpos((string)$key,'__CLASS_MEMO__|')!==0&&is_array($row)){
    $out[$key]=array_intersect_key($row,array_flip(['publicNote','ready','updatedAt']));$flags=$row['exemptionOverrides']??[];
    foreach($row['attendance']??[] as $name=>$value)if($value!==''&&$value!=='---')$flags[$name]=$value==='免除';
    if($flags)$out[$key]['exemptionOverrides']=$flags;
  }
  return $out;
}

// Installation-specific names and payroll rules stay in ignored server data.
function staffSiteSettings($required=false){
  $file=__DIR__.'/data/site_private_settings.php';
  if(!is_file($file)){
    if($required)staffFail('管理設定が未設置です。data/site_private_settings.php を確認してください。',503);
    return ['schema'=>1,'initialAdminName'=>'','payrollExcludedNames'=>[],'teacherToneRules'=>[]];
  }
  $settings=readJsonStrict($file);
  if(($settings['schema']??null)!==1||!is_string($settings['initialAdminName']??null)||trim($settings['initialAdminName'])===''||!is_array($settings['payrollExcludedNames']??null)||!is_array($settings['teacherToneRules']??null))staffFail('管理設定の形式を確認してください。',503);
  $names=[];$rules=[];$tones=['tone-pink','tone-blue','tone-orange','tone-yellow','tone-lime','tone-purple','tone-gray'];
  foreach($settings['payrollExcludedNames'] as $name){
    if(!is_string($name)||trim($name)==='')staffFail('給与の対象外設定を確認してください。',503);
    $names[]=trim($name);
  }
  foreach($settings['teacherToneRules'] as $rule){
    if(!is_array($rule)||!in_array($rule['match']??null,['exact','prefix'],true)||!is_string($rule['name']??null)||trim($rule['name'])===''||!in_array($rule['tone']??null,$tones,true))staffFail('講師の表示設定を確認してください。',503);
    $rules[]=['match'=>$rule['match'],'name'=>trim($rule['name']),'tone'=>$rule['tone']];
  }
  return ['schema'=>1,'initialAdminName'=>trim($settings['initialAdminName']),'payrollExcludedNames'=>array_values(array_unique($names)),'teacherToneRules'=>$rules];
}
