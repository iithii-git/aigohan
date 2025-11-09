# Recipe API Backend

Hono + TypeScript で実装されたレシピ生成APIサーバーです。

## 機能

- **レシピ生成**: 食材リストと画像からAIがレシピを生成
- **入力検証**: Zodによる厳格な入力検証
- **画像処理**: 最大10枚の画像をアップロード可能（LLMには最大3枚を送信）
- **エラーハンドリング**: 統一されたエラーレスポンス形式
- **ヘルスチェック**: 基本的なヘルスチェックと詳細なシステム情報

## 技術スタック

- **Hono**: 軽量で高速なWebフレームワーク
- **TypeScript**: 型安全な開発
- **Zod**: スキーマ検証
- **OpenAI API**: GPT-4o mini によるレシピ生成

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成し、以下の環境変数を設定してください：

```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

サーバーは `http://localhost:3001` で起動します。

## API エンドポイント

### POST /api/recipes/generate

レシピを生成します。

**リクエスト形式**: `multipart/form-data`

- `ingredients` (必須): JSON文字列配列。例: `["玉ねぎ", "鶏もも肉"]`
- `images` (任意): 画像ファイル配列（最大10枚、各5MB以下、JPEG/PNG/WebP）
- `preferences` (任意): 味の好みやスタイル指定（最大200文字）

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "title": "玉ねぎと鶏もも肉の炒め物",
    "description": "シンプルで美味しい炒め物レシピ",
    "ingredients": ["玉ねぎ", "鶏もも肉", "醤油", "みりん"],
    "instructions": ["玉ねぎを切る", "鶏肉を炒める", "調味料を加える"],
    "cookingTime": 15,
    "servings": 2
  },
  "meta": {
    "requestId": "xxx",
    "processingTime": 1234,
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "qualityInfo": {
    "hasIssues": false,
    "issues": [],
    "enhanced": {
      "titleChanged": false,
      "ingredientsReorganized": false,
      "instructionsReformatted": false
    }
  }
}
```

### GET /api/recipes/health

基本的なヘルスチェック。

**レスポンス例**:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "recipe-api",
  "version": "0.1.0",
  "uptime": 3600
}
```

### GET /api/recipes/health/detailed

詳細なシステム情報。

**レスポンス例**:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "api": { "status": "ok", "uptime": 3600 },
    "ai": { "status": "configured", "configured": true },
    "enhancer": { "status": "ok" }
  },
  "environment": {
    "nodeVersion": "v20.0.0",
    "platform": "linux",
    "memory": { ... }
  }
}
```

## エラーコード

- `INVALID_REQUEST` (400): リクエストが不正
- `RATE_LIMIT_EXCEEDED` (429): レート制限超過
- `AI_SERVICE_UNAVAILABLE` (502): AIサービスが利用不可
- `REQUEST_TIMEOUT` (504): リクエストタイムアウト
- `AI_RESPONSE_ERROR` (500): AIレスポンスの解析エラー
- `INTERNAL_SERVER_ERROR` (500): サーバー内部エラー

## 開発

### ビルド

```bash
npm run build
```

### 本番起動

```bash
npm start
```

### 型チェック

```bash
npm run type-check
```

## サンプルリクエスト

### curl でのリクエスト例

```bash
curl -X POST http://localhost:3001/api/recipes/generate \
  -F 'ingredients=["玉ねぎ","鶏もも肉"]' \
  -F 'preferences=和風でシンプルに'
```

### 画像付きリクエスト

```bash
curl -X POST http://localhost:3001/api/recipes/generate \
  -F 'ingredients=["玉ねぎ","鶏もも肉"]' \
  -F 'images=@/path/to/image1.jpg' \
  -F 'images=@/path/to/image2.jpg'
```

## ディレクトリ構成

```
backend/
├── src/
│   ├── index.ts              # サーバー起動・ミドルウェア設定
│   ├── routes/
│   │   └── recipes.ts        # レシピ関連ルーティング
│   ├── schemas/
│   │   └── recipe.ts         # Zodスキーマ定義
│   ├── services/
│   │   └── ai/
│   │       ├── index.ts      # AIプロバイダ抽象
│   │       └── openai.ts     # OpenAI実装
│   ├── types/
│   │   └── api.ts            # 型定義
│   └── utils/
│       ├── images.ts          # 画像処理ユーティリティ
│       └── response.ts        # レスポンス整形ユーティリティ
├── package.json
├── tsconfig.json
└── README.md
```

## 注意事項

- 画像は最大10枚までアップロード可能ですが、LLMには最大3枚のみ送信されます
- 画像サイズは各5MB以下に制限されています
- OpenAI APIキーが必要です
- 開発環境では `http://localhost:3000` からのCORSリクエストが許可されています

