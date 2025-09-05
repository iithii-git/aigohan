import type { NextConfig } from "next";

const nextConfig: NextConfig & { allowedDevOrigins?: string[] } = {
  /* config options here */
  // 開発環境で、同一LAN内やローカルネットワーク上の他の端末から
  // Next.js の静的ファイル（/_next/*）へアクセスできるように許可するオリジンのリストです。
  // 例: スマートフォンや他PCからの動作確認などで利用
  allowedDevOrigins: [
    "http://localhost:3000",         // 自分自身（ローカルホスト）
    "http://127.0.0.1:3000",         // ループバックアドレス
    "http://172.19.128.1:3000",      // Dockerや仮想環境などのネットワークアドレス
    "http://192.168.0.38:3000",      // 実際の端末のローカルIPアドレス
    "https://localhost:3000",
    "https://127.0.0.1:3000",
    "https://172.19.128.1:3000",
    "https://192.168.0.38:3000",
  ],

};

export default nextConfig;
