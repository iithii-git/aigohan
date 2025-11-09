import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import recipesRouter from './routes/recipes.js';

const app = new Hono();

// 環境変数の取得
const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// ロガーミドルウェア
app.use('*', logger());

// CORS設定
app.use(
  '*',
  cors({
    origin: CORS_ORIGIN,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-Request-ID'],
    exposeHeaders: ['X-Request-ID'],
  })
);

// リクエストIDミドルウェア
app.use('*', async (c, next) => {
  const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();
  c.header('X-Request-ID', requestId);
  await next();
});

// ルーティング
app.route('/api/recipes', recipesRouter);

// ルートパス
app.get('/', (c) => {
  return c.json({
    message: 'Recipe API Server',
    version: '0.1.0',
    endpoints: {
      health: '/api/recipes/health',
      healthDetailed: '/api/recipes/health/detailed',
      generate: 'POST /api/recipes/generate',
    },
  });
});

// 404ハンドラー
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'エンドポイントが見つかりません',
      },
    },
    404
  );
});

// エラーハンドラー
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    },
    500
  );
});

// サーバー起動
console.log(`🚀 Server starting on port ${PORT}...`);
console.log(`📡 CORS origin: ${CORS_ORIGIN}`);

serve({
  fetch: app.fetch,
  port: PORT,
});

