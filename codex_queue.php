<?php
require_once __DIR__.'/staff_security.php';header('Cache-Control: private, no-store');header('Vary: Cookie');
$viewer=staffCurrent();if(!$viewer){header('Location: staff_login.html?next=codex_queue.php',true,303);exit;}if($viewer['mustChange']){header('Location: staff_account.html',true,303);exit;}staffRequire(true);
header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Codex修正キュー</title>
<link rel="stylesheet" href="workspace-ui.css?v=20260912-r24"><link rel="stylesheet" href="codex-queue.css?v=20260920-q1">
<script src="staff-auth.js?v=20260917-r56-ready" data-staff="required"></script><script defer src="workspace-ui.js?v=20260920-q1"></script><script defer src="codex-queue.js?v=20260920-q1"></script></head>
<body><main class="workspace-page cq-page">
<header class="cq-head"><div><p class="cq-eyebrow">CODEX MEMOS / 第1段階</p><h1>Codex修正キュー</h1><p>Codexへ送った修正メモの処理待ち一覧と、候補・テスト結果を確認できます。</p></div><a class="ws-button" href="codex_memos.php">メモ一覧へ</a></header>
<section class="cq-phase"><strong>修正・テストで停止します。本番には反映しません。</strong><p>「Codexへ送信」を押したメモだけを処理します。LEVEL 1限定運用では、色・文言などの軽微な変更だけ候補を作成します。LEVEL 2・3、複合依頼、不明点のある依頼は候補作成前に「要確認」にします。</p><small>このPCの処理プログラムが起動している間に、1件ずつ処理します。メモの内容と添付画像をCodexへ渡します。</small></section>
<form id="cqFilters" class="cq-filters"><label>検索<input id="cqSearch" type="search" placeholder="相談コード・ページ・依頼内容"></label><label>状態<select id="cqStatus"><option value="active">未確認すべて</option><option value="all">すべて</option></select></label><label>レベル<select id="cqLevel"><option value="">すべて</option><option value="1">LEVEL 1</option><option value="2">LEVEL 2</option><option value="3">LEVEL 3</option></select></label><label>並び順<select id="cqSort"><option value="desc">新しい順</option><option value="asc">古い順</option></select></label><button class="ws-button" type="button" id="cqReload">再読み込み</button></form>
<p class="cq-meta"><span id="cqCount"></span><span id="cqRefresh">表示中は5秒ごとに確認します。</span></p><p id="cqMessage" role="status"></p><div id="cqList" aria-live="polite"></div>
<dialog id="cqDetail" class="cq-dialog"><header><h2>処理の詳細</h2><button class="ws-button" type="button" data-close>閉じる</button></header><div id="cqDetailBody"></div></dialog>
</main></body></html>
