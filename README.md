# 志学館 時間割アプリ

## Codex修正キュー（第1段階）

管理者のCODEXメモから「Codexへ送信」し、このPCで修正候補・テスト・元メモへの結果表示までを実行する機能を追加しています。
**この処理は自動commit・push・本番反映を行いません。** LEVEL 3は改修せず停止し、LEVEL 1・2も確認用候補で止まります。
設定と起動、保存先、停止方法、確認範囲は [.deploy/codex_queue/README.md](.deploy/codex_queue/README.md) を参照してください。
本番へのこの機能の設置には、下記の既存デプロイ手順を別途使います。

公開先: https://224236.com/2026summer/  

GPT向けの現在仕様は `ai-guide.json` で公開します。画面、ボタン、URL、権限または操作方法を変更するときは、同ファイルの更新と `.deploy/test_ai_guide.py` の成功を完了条件に含めます。
リポジトリ: `kashito/timetable` / 運用ブランチ: `main`

## 本番反映方法

`main` へpushすると、GitHub Actionsの **Timetable - Lolipop SSH deployment** がプログラムを更新します。
`LOLIPOP_DEPLOY_ENABLED=true` と必要なSecretsの設定が前提です。

1. 変更を確認・テストして `main` へpushする。
2. GitHubのActionsで対象コミットの実行を開く。
3. dry-runの差分、保護対象の転送0件・削除0件を確認する。
4. 成功した実行のSummaryで、更新件数・HTTP検査結果・取引IDを確認する。

手動の差分確認は **Run workflow → mode: preview** を選びます。本番には反映しません。
手動反映は `mode: deploy` と、対象コミットの40桁SHAを `confirm_commit` に指定します。
main以外・古いコミット・無効化中の実デプロイは拒否します。

「テスト → Git管理ファイルだけ梱包 → rsync dry-run → 非公開領域へ転送 →
本番PHPの構文検査・プログラム退避 → ファイル単位の置換 → HTTP検査・ハッシュ照合」の順に実行します。
反映中の通常エラーやHTTP検査失敗時は、今回のプログラム変更だけを戻します。

## 更新しないもの

`data/` 全体、`data/site_private_settings.php`、アップロード、実名入りExcel、認証設定、秘密鍵、
ユーザー入力、DB、ログ、既存バックアップ・復旧退避物は転送も削除もしません。
Gitからプログラムを削除しても、本番からは自動削除しません。
**dry-runに削除予定が1件でも現れたら停止**します。500ファイルを超える更新も停止します。

除外対象は [.deploy/lolipop-excludes.txt](.deploy/lolipop-excludes.txt) にまとめています。
ソースを一括でFTP上書きしたり、`rsync --delete` を追加したりしないでください。

## GitHub Secrets一覧

Repository Settings → Secrets and variables → Actions に登録します。
値はソース・README・ログに貼り付けません。パスワードの登録は不要です。

| Secret | 用途 |
| --- | --- |
| `LOLIPOP_SSH_HOST` | ロリポップのSSHホスト |
| `LOLIPOP_SSH_USER` | SSHログインユーザー |
| `LOLIPOP_SSH_PRIVATE_KEY` | 認証用秘密鍵の全文 |
| `LOLIPOP_KNOWN_HOSTS` | 確認済みホスト鍵。2222番ポートのエントリーを含む |

Repository Variable `LOLIPOP_DEPLOY_ENABLED` が `true` のときだけ本番反映します。
SSHポート2222、公開先と本番パスは既存設定に固定しています。
本番の非公開設定は別管理で設置済みです。自動デプロイでは更新しません。

## 緊急時の停止方法

まずRepository Variable **`LOLIPOP_DEPLOY_ENABLED=false`** に変更します。
さらにActionsの当ワークフローで「Disable workflow」を選ぶと、新しい実行そのものを止められます。

```bash
gh variable set LOLIPOP_DEPLOY_ENABLED --repo kashito/timetable --body false
gh workflow disable deploy-lolipop.yml --repo kashito/timetable
gh run list --repo kashito/timetable --workflow deploy-lolipop.yml
```

すでに動いている実行は変数変更だけでは止まりません。該当実行の「Cancel workflow」を使います。
取消時には反映済みの場合もあるため、Summaryの取引IDと本番の状態を確認してください。

復旧は [DEPLOYMENT.md](DEPLOYMENT.md) の取引状態確認・プログラム復旧手順を使います。
**運用データや以前のバックアップを上書きして戻す操作は行いません。**
停止したまま修正コミットをpushし、ワークフローを再有効化して `preview` を通してから、変数を `true` に戻します。

## 確認範囲

HTTP検査は講師ログイン・全体時間割・生徒予定表・カルテ・今日の動き・主要JS・認証APIを確認します。
給与・コマ生成は未ログイン時のログイン誘導を、非公開設定は本文が空であることを確認します。
ログイン後の画面操作や授業・給与の業務内容すべてを自動確認するものではありません。

詳しい仕様、失敗時の扱い、非公開バックアップの場所は [DEPLOYMENT.md](DEPLOYMENT.md) を参照してください。

## 導入時の検証記録

2026年9月20日、[GitHub Actionsのpreview](https://github.com/kashito/timetable/actions/runs/35483000620)で、
保護・復旧テスト26件、PHP構文、主要ページHTTP、SSH/rsync dry-runが成功しました。
[mainへのpushによる初回本番反映](https://github.com/kashito/timetable/actions/runs/35483093515)も成功し、
非公開設定を参照するためのプログラム7件を更新しました。運用データへの転送・削除は0件、転送後HTTP検査は11件成功しました。
自動反映は有効です。停止する場合は上記「緊急時の停止方法」を使ってください。
各pushの反映結果は[Actionsの実行一覧](https://github.com/kashito/timetable/actions/workflows/deploy-lolipop.yml)で確認できます。

## CODEX修正キューの日常利用

管理者が修正メモを保存し「Codexへ送信」を押すと、このPCのワーカーが1件ずつ取得します。
LEVEL 1の候補だけを別フォルダで作成・検査し、結果を元メモへ返します。LEVEL 2・3や曖昧な依頼は「要確認」で止まります。
候補を元ソースへ自動適用したり、commit・push・本番反映したりする機能はありません。

このPCでは `C:/Users/idwor/Documents/Codex/timetable-queue/ワーカー開始.cmd` で開始し、同フォルダの「ワーカー停止.cmd」「ワーカー状態.cmd」で停止・確認できます。
PC再起動後は再度開始してください。停止は処理中の1件を完了してから行い、次のメモは取得しません。
詳しくは [.deploy/codex_queue/README.md](.deploy/codex_queue/README.md) を参照してください。
