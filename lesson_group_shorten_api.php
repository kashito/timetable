<?php
require_once __DIR__.'/lesson_groups.php';
require_once __DIR__.'/lesson_links.php';
$actor=staffRequire(true);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
$method=$_SERVER['REQUEST_METHOD'];if(!in_array($method,['GET','POST'],true))staffFail('操作を確認してください。',405);
$in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);
if(!is_array($in)||!is_string($in['id']??null))staffFail('連結した授業を選び直してください。',400);
$dir=__DIR__.'/data';$groups=lessonGroups();$g=$groups[$in['id']]??null;
if(!$g||empty($g['active']))staffFail('連結が変更・解除されました。再読み込みしてください。',409);
$source=$in['source']??null;$requestId=$in['requestId']??null;
if($method==='POST'){
 if(!is_string($source)||!is_string($in['version']??null)||!is_string($requestId)||!preg_match('/^[a-zA-Z0-9-]{16,80}$/D',$requestId))staffFail('外すコマを選び直してください。',400);
 $requestHash=hash('sha256',json_encode([$actor['id'],$g['id'],$in['version'],$source],JSON_UNESCAPED_UNICODE));
 if(($g['lastShorten']['requestId']??'')===$requestId){if(!hash_equals($g['lastShorten']['hash']??'',$requestHash))staffFail('保存済みの操作です。画面を開き直してください。',409);echo json_encode(['ok'=>true,'group'=>groupSummary($g),'replayed'=>true],JSON_UNESCAPED_UNICODE);exit;}
}
$slots=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];$rows=groupRows($g,policyRows());
if(count($rows)!==count($g['sources'])||count($rows)<3)staffFail('2コマの連結は短縮できません。「連結を解除」を使用してください。',409);
usort($rows,fn($a,$b)=>array_search($a['時間番号']??'',$slots,true)<=>array_search($b['時間番号']??'',$slots,true));
foreach($rows as $i=>$row){$slot=array_search($row['時間番号']??'',$slots,true);if($slot===false||($i&&$slot!==array_search($rows[$i-1]['時間番号'],$slots,true)+1)||!lgCompatible($rows[0],$row))staffFail('連結したコマの内容が変更されています。再読み込みしてください。',409);}
$records=readJsonStrict($dir.'/lesson_records.json');$record=$records[$g['key']]??null;if(!is_array($record))staffFail('共通カルテを確認できないため短縮を中止しました。',409);
$choices=[];foreach([$rows[0],$rows[count($rows)-1]] as $row)$choices[]=['source'=>$row['_sourceKey'],'slot'=>$row['時間番号'],'start'=>$row['開始']??'','end'=>$row['終了']??''];
$version=hash('sha256',json_encode([$g,$rows,$record],JSON_UNESCAPED_UNICODE));
if($method==='GET'){echo json_encode(['ok'=>true,'group'=>groupSummary($g,$rows),'choices'=>$choices,'version'=>$version],JSON_UNESCAPED_UNICODE);exit;}
if(!hash_equals($version,$in['version']))staffFail('授業またはカルテが更新されました。開き直して確認してください。',409);
$allowed=array_column($choices,'source');if(!in_array($source,$allowed,true))staffFail('連結の途中のコマは外せません。先頭または末尾を選んでください。',400);
$remaining=array_values(array_filter($rows,fn($row)=>$row['_sourceKey']!==$source));
$g['sources']=array_column($remaining,'_sourceKey');$g['snapshot']=$remaining;$g['shortenHistory'][]=['at'=>date('c'),'by'=>$actor['name'],'source'=>$source];$g['lastShorten']=['requestId'=>$requestId,'hash'=>$requestHash];
$record['slot']=implode('',array_column($remaining,'時間番号'));$record['updatedAt']=date('c');$record['updatedBy']=$actor['name'];$records[$g['key']]=$record;$groups[$g['id']]=$g;
if(!safeDataTransaction([$dir.'/lesson_groups.json'=>$groups,$dir.'/lesson_records.json'=>$records]))staffFail('連結の短縮を保存できませんでした。',500);
echo json_encode(['ok'=>true,'group'=>groupSummary($g,$remaining)],JSON_UNESCAPED_UNICODE);
