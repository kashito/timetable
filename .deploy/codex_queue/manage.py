"""Start/stop the local LEVEL 1 worker. Never applies candidates or runs Git writes."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time

import worker


def configure(path, enabled):
    config = worker.read_config(path)
    config['enabled'] = enabled
    config['max_level'] = 1
    # Preserve every other setting, including existing credential file paths.
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent,
                                     prefix='.queue-config-', delete=False) as output:
        temporary = Path(output.name)
        json.dump(config, output, ensure_ascii=False, indent=2)
        output.write('\n')
    try:
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)
    return config


def running(config):
    try:
        with worker.worker_lock(Path(config['workRoot'])):
            return False
    except (OSError, BlockingIOError):
        return True


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('start', 'stop', 'status'))
    parser.add_argument('--config', type=Path, required=True)
    args = parser.parse_args(argv)
    config = worker.read_config(args.config)
    if args.action == 'stop':
        configure(args.config, False)
        print('停止を予約しました。実行中の1件の結果を返して終了し、次のメモは取得しません。')
        return
    if args.action == 'status':
        print(json.dumps({'running': running(config), 'enabled': config['enabled'],
                          'max_level': config.get('max_level', 2)}, ensure_ascii=False))
        return
    if running(config):
        print('すでに起動中です。停止予約中の場合は終了を待ってから開始してください。')
        return
    worker.main(['--config', str(args.config), '--doctor'])
    config = configure(args.config, True)
    log = Path(config['workRoot']) / 'worker.log'
    log.parent.mkdir(parents=True, exist_ok=True)
    env = dict(os.environ, PYTHONIOENCODING='utf-8', PYTHONUNBUFFERED='1')
    try:
        with log.open('ab') as output:
            process = subprocess.Popen([sys.executable, '-B', str(worker.HERE / 'worker.py'),
                '--config', str(args.config.resolve()), '--watch', '--max-level', '1'],
                stdin=subprocess.DEVNULL, stdout=output, stderr=subprocess.STDOUT,
                env=env, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        time.sleep(1)
        if process.poll() is not None:
            raise RuntimeError('起動に失敗しました。worker.logを確認してください。')
    except BaseException:
        configure(args.config, False)
        raise
    print('LEVEL 1限定ワーカーを開始しました。1件ずつ処理します。PC終了後は再度「開始」を実行してください。')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('STOP: ' + str(error), file=sys.stderr)
        sys.exit(1)
