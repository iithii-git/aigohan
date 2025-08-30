import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { Recipe, RecipeGenerationRequest, AIGenerationError } from './types/recipe.types';
import { RecipeValidator } from './validators/recipe.validator';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateRecipe(request: RecipeGenerationRequest): Promise<Recipe> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      // リクエストバリデーション
      RecipeValidator.validateIngredients(request.ingredients);
      RecipeValidator.validateImages(request.images);

      this.logger.log('Starting recipe generation with AI', {
        requestId,
        ingredientCount: request.ingredients.length,
        hasImages: request.images && request.images.length > 0,
        ingredients: request.ingredients.slice(0, 5), // 最初の5つだけログ出力
      });

      return await this.generateRecipeWithRetry(request, requestId, 3);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Failed to generate recipe', {
        requestId,
        duration: `${duration}ms`,
        error: error.message,
        errorCode: (error as AIGenerationError).code || 'UNKNOWN',
      });
      throw this.handleAIError(error);
    }
  }

  private async generateRecipeWithRetry(
    request: RecipeGenerationRequest,
    requestId: string,
    maxRetries: number
  ): Promise<Recipe> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`Attempt ${attempt}/${maxRetries}`, { requestId });

        const model = this.genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 1024,
          },
        });

        const prompt = this.buildPrompt(request.ingredients);
        const parts = await this.buildPromptParts(prompt, request.images);

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        this.logger.log('Received AI response', { 
          requestId,
          attempt,
          responseLength: text.length 
        });

        const recipe = this.parseAIResponse(text);
        
        this.logger.log('Successfully generated recipe', {
          requestId,
          attempt,
          title: recipe.title,
          ingredientCount: recipe.ingredients.length,
          instructionCount: recipe.instructions.length,
        });

        return recipe;
      } catch (error) {
        this.logger.warn(`Attempt ${attempt} failed`, {
          requestId,
          error: error.message,
          willRetry: attempt < maxRetries,
        });

        if (attempt === maxRetries) {
          throw error;
        }

        // 指数バックオフでリトライ
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
    
    throw new Error('All retry attempts failed');
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private buildPrompt(ingredients: string[]): string {
    return `
あなたは経験豊富な料理シェフです。以下の食材を使って美味しいレシピを1つ提案してください。

使用可能な食材:
${ingredients.map(ingredient => `- ${ingredient}`).join('\n')}

以下のJSON形式で回答してください：
{
  "title": "レシピ名",
  "description": "レシピの簡潔な説明",
  "ingredients": ["材料1", "材料2", ...],
  "instructions": ["手順1", "手順2", ...],
  "cookingTime": 調理時間（分）,
  "servings": 何人分
}

注意事項:
- 提供された食材を中心に使用してください
- 一般的に入手しやすい調味料や基本的な食材は追加してもOKです
- 手順は分かりやすく番号順で記載してください
- JSON形式以外の文字は含めないでください
`.trim();
  }

  private async buildPromptParts(prompt: string, images?: Buffer[]): Promise<Part[]> {
    const parts: Part[] = [{ text: prompt }];

    if (images && images.length > 0) {
      for (const imageBuffer of images) {
        parts.push({
          inline_data: {
            mime_type: 'image/jpeg',
            data: imageBuffer.toString('base64'),
          },
        } as any);
      }
      
      // 画像がある場合の追加指示
      parts.push({
        text: '\n\n上記の画像に写っている食材も考慮して、より具体的なレシピを提案してください。',
      });
    }

    return parts;
  }

  private parseAIResponse(response: string): Recipe {
    try {
      // JSONの開始と終了を見つけて抽出
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const jsonString = jsonMatch[0];
      const parsed = JSON.parse(jsonString);

      // RecipeValidatorを使用してバリデーション実行
      const recipe = RecipeValidator.validate(parsed);

      this.logger.log('Successfully parsed and validated recipe', { title: recipe.title });
      return recipe;
    } catch (error) {
      this.logger.error('Failed to parse AI response', { error: error.message, response });
      const parseError = new Error(`Failed to parse AI response: ${error.message}`) as AIGenerationError;
      parseError.code = 'PARSING_ERROR';
      throw parseError;
    }
  }

  private handleAIError(error: any): AIGenerationError {
    if (error.code === 'PARSING_ERROR' || error.code === 'VALIDATION_ERROR') {
      return error;
    }

    // バリデーションエラーの検出
    if (error.message && (
      error.message.includes('validation failed') ||
      error.message.includes('must be') ||
      error.message.includes('required')
    )) {
      const validationError = new Error(error.message) as AIGenerationError;
      validationError.code = 'VALIDATION_ERROR';
      return validationError;
    }

    const aiError = new Error(`AI API Error: ${error.message}`) as AIGenerationError;
    aiError.code = 'AI_API_ERROR';
    return aiError;
  }
}