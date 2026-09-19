<?php
require_once __DIR__.'/staff_security.php';
staffRequire();
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$dataFile = $dataDir . DIRECTORY_SEPARATOR . 'memos.json';

if (!is_dir($dataDir)) {
    if (!mkdir($dataDir, 0775, true) && !is_dir($dataDir)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'data directory cannot be created'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

function read_memos(string $file): array {
    return readJsonStrict($file);
}

if ($method === 'GET') {
    $key = trim((string)($_GET['key'] ?? ''));
    if ($key === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'key is required'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $memos = read_memos($dataFile);
    echo json_encode(['ok' => true, 'memo' => (string)($memos[$key] ?? '')], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw ?: '{}', true);
    $key = trim((string)($body['key'] ?? ''));
    $memo = (string)($body['memo'] ?? '');
    if ($key === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'key is required'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ((function_exists('mb_strlen') ? mb_strlen($memo, 'UTF-8') : preg_match_all('/./us', $memo)) > 10000) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'memo is too long'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $memos=read_memos($dataFile);
    $memos[$key]=$memo;
    if(!safeJsonWriteAtomic($dataFile,$memos))staffFail('保存前バックアップまたは保存に失敗しました',500);

    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'method not allowed'], JSON_UNESCAPED_UNICODE);
