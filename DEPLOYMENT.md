# timetable ロリポップ SSH/rsync デプロイ

brain の `app/templates/lolipop-ssh-deploy` を継承し、運用データ保護と復旧処理を追加しています。
通常の反映・Secrets一覧・緊急停止は [README.md](README.md) を参照してください。

## 保護と実行条件

- `main` の最新コミットだけが本番反映の対象です。`LOLIPOP_DEPLOY_ENABLED=true` が必要です。
- 手動実行の既定値は `preview`。実反映は `deploy` とコミットSHAの一致が必要です。
- Gitに記録された通常ファイルだけを梱包します。未管理・運用ファイルは混入しません。
- Windowsの改行変換をコマンド単位で無効化し、梱包結果とGit blobを一致させます。
- 必須の除外ルールが欠けた場合、保護対象、シンボリックリンク、不明な差分は拒否します。
- `.deploy/lolipop-excludes.txt` は梱包とrsyncの共通設定です。
- `data/`（`.htaccess` と非公開設定も含む）、アップロード、認証・ユーザー入力・ログ・DB・既存バックアップは対象外です。
- `--delete` / `--delete-excluded` / `--inplace` は使いません。削除予定は1件でも停止、更新は500件超で停止します。
- 設定・README・開発用ファイル自体も本番には送りません。

## 非公開設定

`data/site_private_settings.php` は別管理で本番に設置済みです。GitHubには含まれていません。
存在・JSON形式・必須項目を反映直前にも検査します。不正ならプログラムを一つも反映しません。
その内容や個人名はデプロイログへ出力しません。このファイルをデプロイに同梱しません。

## 転送と失敗への対応

1. 現在の主要ページをHTTP検査し、既存障害があれば停止。
2. 本番ファイルを読み取り、実rsync `--dry-run` とSHA256による差分を照合。
3. 更新分だけを公開領域外の `.timetable-deploy/<取引ID>/incoming/` へ転送。
4. 転送完了・SHA256・本番PHP 7.4の構文を確認。転送途中の失敗では公開中コードに触れない。
5. 対象プログラムの旧内容・権限・時刻を同取引の `previous/` に保存。既存バックアップは変更しない。
6. プログラムを1ファイルずつatomic replaceで反映。PHP/運用データの移行処理は実行しない。
7. サーバー側とActions側の両方でHTTPを確認し、公開ソースのハッシュと運用ファイルの不変を照合。
8. 反映中の例外・通常の終了シグナル・HTTP失敗では、当該取引のプログラムだけを復旧する。

非公開の作業・退避領域はSSHアカウントホーム直下の **`.timetable-deploy/`**（権限700）です。
`web/2026summer` の外にあり、HTTP公開もGit管理もされません。取引ごとに別フォルダを作成し、旧プログラムは自動削除しません。
`previous/` は退避後に上書きせず、復旧時もコピー元として保持します。

GitHubの同時実行制御とサーバー側の排他ロックを使います。未完了の復旧があれば次の反映を止めます。
プログラムに他の編集が入った場合は、復旧時もその編集を無条件に上書きせず停止します。
授業入力などで運用ファイルが検査中に変わった場合も安全側で停止します。入力内容を元に戻すことはありません。

### 限界

サイト全体を一瞬で切り替える仕組みではなく、プログラムを順に置換します。反映中の短時間は新旧コードが混在します。
停電、ディスク故障、OSの強制終了（SIGKILL）では自動復旧を完了できない場合があります。
この場合は後続反映を止め、残してある退避ファイルで復旧します。運用データの自動復元は行いません。

## HTTPの確認範囲

5画面（ログイン、全体、生徒、カルテ、今日の動き）の200応答・title・HTML終端を検査します。
反映後は静的画面と主要JSをGitのハッシュと照合し、古いキャッシュやエラーページを成功扱いにしません。
認証APIのJSONと既存初期設定済み状態、給与・コマ生成の303ログイン誘導、非公開設定の200・本文0バイトも検査します。
ログイン用パスワードや実運用のアカウントを自動テストに使いません。業務上の操作確認は別途必要です。
公開先のディレクトリ直下にはトップページがないため、HTTP検査には実在する主要ページを使います。

## ローカルの確認・復旧コマンド

Python 3、Git、rsync、OpenSSHが必要です。値は環境変数で指定し、秘密鍵はリポジトリの外に置いてください。
本番で使うPythonは `/usr/local/bin/python3` に固定し、SSH接続時のPATHに依存しません。

```bash
export SSH_HOST=ssh.lolipop.jp
export SSH_USER=lolipop.jp-dp30304343
export SSH_KEY_FILE=/secure/path/private-key
export SSH_KNOWN_HOSTS_FILE=/secure/path/known_hosts
python3 -B -m unittest discover -s .deploy -p 'test_*.py' -v
python3 -B .deploy/deploy.py build --output /tmp/timetable-preview-unique
python3 -B .deploy/deploy.py preview --output /tmp/timetable-preview-unique
```

WindowsでcwRsyncを使う場合は、同梱SSHを `SSH_BIN`、rsyncを `RSYNC_BIN` に指定します。
出力先はリポジトリ外の新しいフォルダにします。秘密鍵・SSHパスワードはコマンドへ直書きしません。

緊急停止後、ActionsのSummaryにある **取引ID** を使い、状態を確認します。

```bash
python3 -B .deploy/deploy.py status --output /tmp/timetable-recovery --transaction TRANSACTION_ID
```

状態が `applied` / `applying` / `rolling_back` / `recovery_required` で復旧が必要な場合だけ次を実行します。
停止変数が `false` でも緊急復旧は可能です。

```bash
python3 -B .deploy/deploy.py rollback --output /tmp/timetable-recovery --transaction TRANSACTION_ID
```

成功時は `rolled_back` と表示します。既存プログラムを退避内容へ戻し、その取引で新規作成したプログラムだけを取り除きます。
運用データや既存バックアップには触れません。後から別の変更が入っていたら上書きせず停止するので、取引内容を確認してください。

## Secretsと権限

必要なのは `LOLIPOP_SSH_HOST` / `LOLIPOP_SSH_USER` / `LOLIPOP_SSH_PRIVATE_KEY` / `LOLIPOP_KNOWN_HOSTS` の4つです。
値はGitHubの暗号化Secretsに登録し、ジョブ内だけで一時ファイル化して削除します。パスワードは不要です。
ホスト鍵は確認済みのものを固定し、実行時の自動信頼をしません。
ワークフローのGitHub権限は `contents: read`。checkoutはコミットSHAで固定し、Git認証情報を作業ツリーに残しません。
`production` Environmentの許可ブランチはmainだけにします。
