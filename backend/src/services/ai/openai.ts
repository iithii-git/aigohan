import OpenAI from 'openai';
import { z } from 'zod';
import { recipeSchema, type Recipe } from '../../schemas/recipe.js';
import type { AIProvider } from './index.js';
import { createDataUrl } from '../../utils/images.js';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string = 'gpt-4o-mini';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
    this.client = new OpenAI({ apiKey });
  }

  async generateRecipe(
    ingredients: string[],
    preferences?: string,
    images?: Array<{ base64: string; mimeType: string }>
  ): Promise<Recipe> {
    const systemPrompt = `あなたは料理の専門家です。提供された食材と画像から、実用的で美味しいレシピを生成してください。
レスポンスは必ず以下のJSON形式で返してください。JSON以外のテキストは含めないでください。

{
  "title": "レシピのタイトル",
  "description": "レシピの簡単な説明（50-100文字程度）",
  "ingredients": ["材料1", "材料2", ...],
  "instructions": ["手順1", "手順2", ...],
  "cookingTime": 調理時間（分、任意）,
  "servings": 人数分（任意）
}`;

    const userMessages: Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    > = [];

    // テキスト部分
    let textContent = `以下の食材を使ってレシピを生成してください:\n\n`;
    textContent += `食材: ${ingredients.join(', ')}\n\n`;

    if (preferences) {
      textContent += `好み・スタイル: ${preferences}\n\n`;
    }

    textContent +=
      '上記の食材を使って、実用的で美味しいレシピを提案してください。';

    userMessages.push({ type: 'text', text: textContent });

    // 画像部分（最大3枚）
    if (images && images.length > 0) {
      const limitedImages = images.slice(0, 3);
      for (const image of limitedImages) {
        const dataUrl = createDataUrl(image.base64, image.mimeType);
        userMessages.push({
          type: 'image_url',
          image_url: { url: dataUrl },
        });
      }
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: userMessages,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AIからのレスポンスが空です');
      }

      // JSONパース
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        // JSONパース失敗時、JSON部分を抽出を試みる
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AIレスポンスのJSON解析に失敗しました');
        }
      }

      // Zodで検証
      const validated = recipeSchema.parse(parsed);
      return validated;
    } catch (error) {
      if (error instanceof Error) {
        // OpenAI APIエラーの処理
        if (error.message.includes('rate limit')) {
          throw new Error('RATE_LIMIT_EXCEEDED');
        }
        if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
          throw new Error('REQUEST_TIMEOUT');
        }
        if (
          error.message.includes('connection') ||
          error.message.includes('network') ||
          error.message.includes('unavailable')
        ) {
          throw new Error('AI_SERVICE_UNAVAILABLE');
        }
      }

      // Zod検証エラーの場合
      if (error instanceof z.ZodError) {
        throw new Error('AI_RESPONSE_ERROR');
      }

      throw error;
    }
  }
}

