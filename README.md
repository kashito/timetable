# 志学館 時間割アプリ

公開先: https://224236.com/2026summer/  
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
