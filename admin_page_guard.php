<?php
require_once __DIR__.'/staff_security.php';
function requireAdminPage($returnPage){
  header('Cache-Control: private, no-store, no-cache, must-revalidate, max-age=0');
  header('Pragma: no-cache');header('Expires: 0');header('Vary: Cookie');
  $viewer=staffCurrent();
  if(!$viewer){header('Location: staff_login.html?next='.rawurlencode($returnPage),true,303);exit;}
  if($viewer['role']!=='admin'){
    http_response_code(403);header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>アクセスできません</title><link rel="stylesheet" href="workspace-ui.css?v=20260912-r24"></head><body><main class="workspace-page"><h1>このページは管理者専用です</h1><p>管理者以外はアクセスできません。</p><a class="ws-button" href="teacher2026summer.html">全体時間割に戻る</a></main></body></html>';exit;
  }
  if($viewer['mustChange']){header('Location: staff_account.html',true,303);exit;}
  staffRequire(true);header('Content-Type: text/html; charset=utf-8');
}
