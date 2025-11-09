import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { recipeGenerationRequestSchema } from '../schemas/recipe.js';
import { OpenAIProvider } from '../services/ai/openai.js';
import {
  validateImage,
  validateImageCount,
  imagesToBase64,
} from '../utils/images.js';
import {
  createSuccessResponse,
  createErrorResponse,
  type ErrorCode,
} from '../utils/response.js';
import type { Recipe } from '../schemas/recipe.js';

const app = new Hono();

// レシピ品質改善処理（簡易版）
function enhanceRecipeQuality(recipe: Recipe): {
  recipe: Recipe;
  qualityInfo: {
    hasIssues: boolean;
    issues: string[];
    enhanced: {
      titleChanged: boolean;
      ingredientsReorganized: boolean;
      instructionsReformatted: boolean;
    };
  };
} {
  const issues: string[] = [];
  const enhanced = {
    titleChanged: false,
    ingredientsReorganized: false,
    instructionsReformatted: false,
  };

  // 材料の重複除去
  const uniqueIngredients = Array.from(new Set(recipe.ingredients));
  if (uniqueIngredients.length !== recipe.ingredients.length) {
    enhanced.ingredientsReorganized = true;
    issues.push('重複した材料を除去しました');
  }

  // 手順の空文字・短すぎる文字列をフィルタ
  const filteredInstructions = recipe.instructions.filter(
    (inst) => inst.trim().length > 3
  );
  if (filteredInstructions.length !== recipe.instructions.length) {
    enhanced.instructionsReformatted = true;
    issues.push('無効な手順を除去しました');
  }

  const enhancedRecipe: Recipe = {
    ...recipe,
    ingredients: uniqueIngredients,
    instructions: filteredInstructions,
  };

  return {
    recipe: enhancedRecipe,
    qualityInfo: {
      hasIssues: issues.length > 0,
      issues,
      enhanced,
    },
  };
}

// POST /api/recipes/generate
app.post(
  '/generate',
  async (c) => {
    const startTime = Date.now();
    const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();

    try {
      // multipart/form-dataの解析
      const formData = await c.req.formData();

      // ingredientsの取得とパース
      const ingredientsField = formData.get('ingredients');
      if (!ingredientsField || typeof ingredientsField !== 'string') {
        return createErrorResponse(
          'INVALID_REQUEST',
          'ingredientsフィールドが必要です',
          400,
          requestId,
          Date.now() - startTime
        );
      }

      let ingredients: string[];
      try {
        ingredients = JSON.parse(ingredientsField);
      } catch (parseError) {
        return createErrorResponse(
          'INVALID_REQUEST',
          'ingredientsは有効なJSON配列である必要があります',
          400,
          requestId,
          Date.now() - startTime
        );
      }

      // preferencesの取得（任意）
      const preferencesField = formData.get('preferences');
      const preferences =
        preferencesField && typeof preferencesField === 'string'
          ? preferencesField
          : undefined;

      // 画像の取得と検証
      const imageFiles: File[] = [];
      const imageFields = formData.getAll('images');
      for (const field of imageFields) {
        if (field instanceof File) {
          const validation = validateImage(field);
          if (!validation.valid) {
            return createErrorResponse(
              'INVALID_REQUEST',
              validation.error || '画像の検証に失敗しました',
              400,
              requestId,
              Date.now() - startTime
            );
          }
          imageFiles.push(field);
        }
      }

      // 画像数の検証
      const countValidation = validateImageCount(imageFiles.length);
      if (!countValidation.valid) {
        return createErrorResponse(
          'INVALID_REQUEST',
          countValidation.error || '画像数が上限を超えています',
          400,
          requestId,
          Date.now() - startTime
        );
      }

      // Zodで入力検証
      const validationResult = recipeGenerationRequestSchema.safeParse({
        ingredients,
        preferences,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        return createErrorResponse(
          'INVALID_REQUEST',
          firstError?.message || '入力検証に失敗しました',
          400,
          requestId,
          Date.now() - startTime
        );
      }

      // OpenAI APIキーの取得
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return createErrorResponse(
          'INTERNAL_SERVER_ERROR',
          'OpenAI APIキーが設定されていません',
          500,
          requestId,
          Date.now() - startTime
        );
      }

      // 画像をbase64に変換（最大3枚）
      const base64Images = await imagesToBase64(imageFiles);

      // AIプロバイダの初期化とレシピ生成
      const aiProvider = new OpenAIProvider(apiKey);
      let recipe: Recipe;
      try {
        recipe = await aiProvider.generateRecipe(
          validationResult.data.ingredients,
          validationResult.data.preferences,
          base64Images
        );
      } catch (aiError) {
        const errorMessage =
          aiError instanceof Error ? aiError.message : 'AI処理エラー';
        let errorCode: ErrorCode = 'AI_RESPONSE_ERROR';
        let statusCode = 500;

        if (errorMessage === 'RATE_LIMIT_EXCEEDED') {
          errorCode = 'RATE_LIMIT_EXCEEDED';
          statusCode = 429;
        } else if (errorMessage === 'REQUEST_TIMEOUT') {
          errorCode = 'REQUEST_TIMEOUT';
          statusCode = 504;
        } else if (errorMessage === 'AI_SERVICE_UNAVAILABLE') {
          errorCode = 'AI_SERVICE_UNAVAILABLE';
          statusCode = 502;
        }

        return createErrorResponse(
          errorCode,
          errorMessage === 'AI_RESPONSE_ERROR'
            ? 'AIからのレスポンスが不正です'
            : errorMessage,
          statusCode,
          requestId,
          Date.now() - startTime
        );
      }

      // レシピ品質改善
      const { recipe: enhancedRecipe, qualityInfo } =
        enhanceRecipeQuality(recipe);

      const processingTime = Date.now() - startTime;
      return createSuccessResponse(
        enhancedRecipe,
        requestId,
        processingTime,
        qualityInfo
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '予期しないエラーが発生しました';
      return createErrorResponse(
        'INTERNAL_SERVER_ERROR',
        errorMessage,
        500,
        requestId,
        Date.now() - startTime
      );
    }
  }
);

// GET /api/recipes/health
app.get('/health', (c) => {
  const startTime = process.uptime();
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'recipe-api',
    version: '0.1.0',
    uptime: Math.floor(startTime),
  });
});

// GET /api/recipes/health/detailed
app.get('/health/detailed', (c) => {
  const memoryUsage = process.memoryUsage();
  const startTime = process.uptime();

  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: {
        status: 'ok',
        uptime: Math.floor(startTime),
      },
      ai: {
        status: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
        configured: !!process.env.OPENAI_API_KEY,
      },
      enhancer: {
        status: 'ok',
      },
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
      },
    },
  });
});

export default app;

