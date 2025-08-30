import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { GenerateRecipeDto, GenerateRecipeResponse } from './dto/generate-recipe.dto';
import { Recipe } from '../ai/types/recipe.types';
import { RecipeEnhancerService } from './services/recipe-enhancer.service';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly recipeEnhancer: RecipeEnhancerService,
  ) {}

  async generateRecipe(
    generateRecipeDto: GenerateRecipeDto,
    images?: Express.Multer.File[]
  ): Promise<GenerateRecipeResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.log('Starting recipe generation', {
        ingredientCount: generateRecipeDto.ingredients.length,
        imageCount: images?.length || 0,
        ingredients: generateRecipeDto.ingredients.slice(0, 5), // 最初の5つをログに
      });

      // 画像データを準備
      const imageBuffers = images?.map(image => image.buffer) || [];

      // AI サービスでレシピ生成
      const rawRecipe = await this.aiService.generateRecipe({
        ingredients: generateRecipeDto.ingredients,
        images: imageBuffers,
      });

      this.logger.log('AI recipe generation completed', {
        rawTitle: rawRecipe.title,
        rawIngredientCount: rawRecipe.ingredients.length,
        rawInstructionCount: rawRecipe.instructions.length,
      });

      // レシピの品質チェック
      const qualityCheck = this.recipeEnhancer.validateRecipeQuality(rawRecipe);
      if (!qualityCheck.isValid) {
        this.logger.warn('Recipe quality issues detected', {
          issues: qualityCheck.issues,
        });
      }

      // レシピの構造化と品質向上
      const enhancedRecipe = this.recipeEnhancer.enhanceRecipe(rawRecipe);

      const duration = Date.now() - startTime;
      
      this.logger.log('Recipe processing completed', {
        duration: `${duration}ms`,
        finalTitle: enhancedRecipe.title,
        finalIngredientCount: enhancedRecipe.ingredients.length,
        finalInstructionCount: enhancedRecipe.instructions.length,
        qualityIssues: qualityCheck.issues.length,
      });

      return {
        success: true,
        data: {
          title: enhancedRecipe.title,
          description: enhancedRecipe.description,
          ingredients: enhancedRecipe.ingredients,
          instructions: enhancedRecipe.instructions,
          cookingTime: enhancedRecipe.cookingTime,
          servings: enhancedRecipe.servings,
        },
        qualityInfo: {
          hasIssues: !qualityCheck.isValid,
          issues: qualityCheck.issues,
          enhanced: {
            titleChanged: rawRecipe.title !== enhancedRecipe.title,
            ingredientsReorganized: rawRecipe.ingredients.length !== enhancedRecipe.ingredients.length,
            instructionsReformatted: rawRecipe.instructions.length !== enhancedRecipe.instructions.length,
          },
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('Recipe generation failed', {
        duration: `${duration}ms`,
        error: error.message,
      });

      // エラーはAiExceptionFilterで処理されるため、そのまま再throw
      throw error;
    }
  }

  private validateImages(images?: Express.Multer.File[]): void {
    if (!images || images.length === 0) {
      return; // 画像は必須ではない
    }

    for (const image of images) {
      if (!image.buffer || image.buffer.length === 0) {
        throw new Error('Invalid image file');
      }

      if (image.size > 5 * 1024 * 1024) {
        throw new Error('Image file too large (maximum 5MB)');
      }
    }
  }
}