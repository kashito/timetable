<?php
require_once __DIR__.'/api_response.php';
require_once __DIR__.'/staff_security.php';
require_once __DIR__.'/homework_materials.php';
$method=$_SERVER['REQUEST_METHOD']??'GET';
if($method==='GET'){
 $key=homeworkMaterialKey($_GET['taskId']??'');header('Cache-Control: no-store');header('Content-Type: application/json; charset=utf-8');echo json_encode(['ok'=>true,'attachments'=>homeworkMaterialItems([substr($key,9)],homeworkMaterialMap())],JSON_UNESCAPED_UNICODE);exit;
}
if($method!=='POST')staffFail('Method not allowed',405);
staffRequire();$_GET['action']='upload';$_POST['key']=homeworkMaterialKey($_POST['taskId']??'');
require __DIR__.'/student_attachment_api.php';
