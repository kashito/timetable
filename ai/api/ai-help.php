<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=60, stale-while-revalidate=300');

function respond(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$query = trim((string)($_GET['q'] ?? ''));
if ($query === '' || mb_strlen($query, 'UTF-8') > 300) {
    respond(400, ['ok' => false, 'error' => 'q must be 1-300 characters']);
}

$root = dirname(__DIR__);
$index = json_decode((string)file_get_contents($root . '/ai-systems.json'), true);
if (!is_array($index)) {
    respond(500, ['ok' => false, 'error' => 'index unavailable']);
}

function terms(string $value): array {
    $value = mb_strtolower($value, 'UTF-8');
    $parts = preg_split('/[\s　、。・\/／?？!！:：]+/u', $value, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $chars = preg_split('//u', $value, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    for ($i = 0; $i + 1 < count($chars); $i++) {
        if (!preg_match('/\s/u', $chars[$i] . $chars[$i + 1])) {
            $parts[] = $chars[$i] . $chars[$i + 1];
        }
    }
    return array_values(array_unique(array_filter($parts, static fn($x) => mb_strlen($x, 'UTF-8') >= 2)));
}

$needles = terms($query);
$results = [];
foreach ($index['systems'] as $system) {
    $path = $root . '/guides/' . basename((string)$system['name']) . '/ai-guide.json';
    if (!is_file($path)) continue;
    $guide = json_decode((string)file_get_contents($path), true);
    if (!is_array($guide)) continue;
    foreach ($guide['operations'] as $operation) {
        $haystack = mb_strtolower(json_encode([$guide['display_name'], $operation], JSON_UNESCAPED_UNICODE), 'UTF-8');
        $score = mb_strpos($haystack, mb_strtolower($query, 'UTF-8')) !== false ? 100 : 0;
        foreach ($needles as $needle) {
            if (mb_strpos($haystack, $needle) !== false) $score += mb_strlen($needle, 'UTF-8');
        }
        if ($score > 0) {
            $results[] = [
                'score' => $score, 'system' => $guide['system_name'], 'display_name' => $guide['display_name'],
                'system_status' => $guide['status'], 'operation' => $operation, 'guide_url' => $system['guide_url'],
            ];
        }
    }
}
usort($results, static fn($a, $b) => $b['score'] <=> $a['score']);
respond(200, [
    'ok' => true, 'query' => $query, 'updated_at' => $index['updated_at'],
    'count' => min(10, count($results)), 'results' => array_slice($results, 0, 10),
]);


