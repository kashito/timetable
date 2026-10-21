<?php
require_once __DIR__.'/api_response.php';
require_once __DIR__.'/payroll_adjustments.php';
$actor=staffRequire(true);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');
$method=$_SERVER['REQUEST_METHOD']??'GET';$input=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($input))staffFail('入力形式を確認してください',400);$scope=paScope($input);$file=__DIR__.'/data/payroll_adjustments.php';$store=readJsonStrict($file);$model=paModel($scope,$store);
if($method==='GET'){echo json_encode(['ok'=>true]+$model,JSON_UNESCAPED_UNICODE);exit;}
if($method!=='POST')staffFail('Method not allowed',405);
if(!isset($input['expectedRevision'])||!is_string($input['expectedRevision'])||!hash_equals($model['revision'],$input['expectedRevision']))staffFail('この講師・期間の調整が別の画面で更新されました。入力を残しています。再読み込みして確認してください',409);
if(!isset($input['basisRevision'])||!is_string($input['basisRevision'])||!hash_equals($model['basisRevision'],$input['basisRevision']))staffFail('予定または単価が変わりました。入力を残しています。再読み込みして確認してください',409);
$id=paScopeId($scope);$action=$input['action']??'save';
if($action==='reset'){unset($store[$id]);}
elseif($action==='save'){
 if($model['unmatchedCount'])staffFail('単価や授業の変更により適用できない保存値があります。予定に戻して再調整してください',409);
 $given=$input['overrides']??null;if(!is_array($given))staffFail('最終コマ数を確認してください',400);$groups=array_column($model['groups'],null,'id');$clean=[];
 foreach($given as $key=>$count){if(!isset($groups[$key])||!$groups[$key]['adjustable']||!is_int($count)||$count<0||$count>9007199254740991)staffFail('コマ数は0以上の整数で入力してください。小数は丸めず保存を止めます',400);$amount=$groups[$key]['rate']*$count;if(!is_finite((float)$amount)||$amount>9007199254740991)staffFail('計算結果が大きすぎます',400);$clean[$key]=$count;}
 if(!$clean)unset($store[$id]);else $store[$id]=$scope+['overrides'=>$clean,'basis'=>array_intersect_key($groups,$clean),'updatedAt'=>date('c'),'updatedBy'=>$actor['id']];
}else staffFail('操作を確認してください',400);
$updated=paModel($scope,$store);if(($updated['finalPay']!==null&&(!is_finite((float)$updated['finalPay'])||$updated['finalPay']>9007199254740991))||$updated['finalCount']>9007199254740991)staffFail('計算結果が大きすぎます',400);
if(!safeJsonWriteAtomic($file,$store))staffFail('調整値を保存できませんでした。入力は画面に残っています',500);
echo json_encode(['ok'=>true]+$updated,JSON_UNESCAPED_UNICODE);
