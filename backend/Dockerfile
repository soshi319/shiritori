# ★重要: このDockerfileは「リポジトリのルート」をビルドコンテキストとして
#   ビルドされる前提（render.yamlの dockerContext: . と対応）。
#   backend/ が shared/ を相対パスでimportしているため、
#   backend/ 単体ではなく shared/ も一緒にコピーする必要がある。

FROM denoland/deno:latest

WORKDIR /app

# shared/ と backend/ を、リポジトリ内と同じ兄弟関係を保ったままコピーする
COPY shared ./shared
COPY backend ./backend

WORKDIR /app/backend

# 型・依存関係を事前にキャッシュしておくと起動が速くなる
RUN deno cache main.ts

# Render側はPORT環境変数でリッスンポートを指定してくる（main.ts側で対応済み）
EXPOSE 8000

# --allow-net: WebSocket・辞書ダウンロード・APIレスポンス用
# --allow-read: ローカルの辞書JSONファイルの読み込み用
# --allow-env: PORT環境変数の読み取り用
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "main.ts"]