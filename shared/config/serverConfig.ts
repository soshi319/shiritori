/**
 * サーバーの接続先を一箇所にまとめる設定ファイル。
 *
 * 使い方:
 *  1. 一番手っ取り早いのは下の DEFAULT_SERVER_HOST を書き換えること。
 *     ローカルサーバーなら "localhost:8000"、
 *     本番（Render等）なら "shiritori-backend-xxxx.onrender.com" のように、
 *     "ホスト:ポート" の形だけ書けばOK（http/ws か https/wss かは自動で判定する）。
 *
 *  2. コードを書き換えずに切り替えたい場合は、Viteの環境変数で上書きできる。
 *     フロントエンドのプロジェクト直下に .env.local を作り、
 *       VITE_SERVER_HOST=shiritori.soshi319.deno.net
 *     のように書けば、DEFAULT_SERVER_HOST より優先される。
 *     .env.local は基本的にgit管理しないファイルなので、
 *     人によって/環境によって接続先を変えたい場合に向いている。
 *
 * GameView.tsx や checkWordExists.ts など、サーバーと通信する箇所は
 * すべてここからURLを import して使うようにする（URLの直書きをしない）。
 */

// ★ここだけ書き換えれば、アプリ全体の接続先を切り替えられる
const DEFAULT_SERVER_HOST = "shiritori-backend.onrender.com";
// const DEFAULT_SERVER_HOST = "localhost:8000";

const SERVER_HOST = (import.meta.env.VITE_SERVER_HOST as string | undefined) ??
    DEFAULT_SERVER_HOST;

// localhost / 127.0.0.1 なら暗号化なし(ws/http)、それ以外は暗号化あり(wss/https)とみなす
const IS_LOCAL = SERVER_HOST.startsWith("localhost") ||
    SERVER_HOST.startsWith("127.0.0.1");

export const WS_URL = `${IS_LOCAL ? "ws" : "wss"}://${SERVER_HOST}/`;
export const HTTP_BASE_URL = `${IS_LOCAL ? "http" : "https"}://${SERVER_HOST}`;
export const CHECK_WORD_API_URL = `${HTTP_BASE_URL}/api/check-word`;
export const LEADERBOARD_API_URL = `${HTTP_BASE_URL}/api/leaderboard`;
export const RATING_API_URL = `${HTTP_BASE_URL}/api/rating`;
