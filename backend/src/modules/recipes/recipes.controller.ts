import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  Logger,
  HttpStatus,
  HttpCode,
  UsePipes,
  ValidationPipe,
  Get,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RecipesService } from './recipes.service';
import { GenerateRecipeDto, GenerateRecipeResponse } from './dto/generate-recipe.dto';
import { createMulterOptions } from '../../common/config/multer.config';
import { ParseIngredientsPipe } from '../../common/pipes/parse-ingredients.pipe';

@Controller('api/recipes')
export class RecipesController {
  private readonly logger = new Logger(RecipesController.name);

  constructor(private readonly recipesService: RecipesService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('images', 10, createMulterOptions()))
  @UsePipes(new ParseIngredientsPipe(), new ValidationPipe({ transform: true, whitelist: true }))
  async generateRecipe(
    @Body() generateRecipeDto: GenerateRecipeDto,
    @UploadedFiles() images?: Express.Multer.File[]
  ): Promise<GenerateRecipeResponse> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    // リクエストの詳細ログ
    this.logger.log('Received recipe generation request', {
      requestId,
      ingredientCount: generateRecipeDto.ingredients?.length || 0,
      ingredients: generateRecipeDto.ingredients?.slice(0, 10), // 最初の10個を表示
      imageCount: images?.length || 0,
      imageDetails: images?.map(img => ({
        name: img.originalname,
        mimeType: img.mimetype,
        size: `${(img.size / 1024).toFixed(1)}KB`,
      })) || [],
      userAgent: this.extractUserAgent(),
    });

    try {
      // 画像の詳細バリデーション
      this.validateUploadedImages(images);

      // レシピ生成実行
      const result = await this.recipesService.generateRecipe(generateRecipeDto, images);
      
      const duration = Date.now() - startTime;
      
      this.logger.log('Recipe generation completed successfully', {
        requestId,
        duration: `${duration}ms`,
        recipeTitle: result.data?.title,
        finalIngredientCount: result.data?.ingredients?.length,
        instructionCount: result.data?.instructions?.length,
        cookingTime: result.data?.cookingTime,
        servings: result.data?.servings,
      });

      // 成功レスポンスにメタデータを追加
      return {
        ...result,
        meta: {
          requestId,
          processingTime: duration,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('Recipe generation failed', {
        requestId,
        duration: `${duration}ms`,
        error: error.message,
        errorType: error.constructor.name,
      });
      
      // エラーはAiExceptionFilterで処理される
      throw error;
    }
  }

  private validateUploadedImages(images?: Express.Multer.File[]): void {
    if (!images || images.length === 0) {
      return;
    }

    const totalSize = images.reduce((sum, img) => sum + img.size, 0);
    const maxTotalSize = 20 * 1024 * 1024; // 20MB total

    if (totalSize > maxTotalSize) {
      throw new Error(`Total image size too large: ${(totalSize / 1024 / 1024).toFixed(1)}MB (max 20MB)`);
    }

    // 各画像のメタデータチェック
    for (const image of images) {
      if (!image.buffer || image.buffer.length === 0) {
        throw new Error(`Invalid image file: ${image.originalname}`);
      }

      // ファイル名の妥当性チェック
      if (image.originalname && image.originalname.length > 255) {
        throw new Error(`Image filename too long: ${image.originalname.substring(0, 50)}...`);
      }
    }
  }

  private extractUserAgent(): string {
    // 実際のリクエストオブジェクトにアクセスする場合は @Req() を使用
    return 'N/A'; // 簡単のため固定値
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  getHealth(): {
    status: string;
    timestamp: string;
    service: string;
    version: string;
    uptime: number;
  } {
    this.logger.log('Health check requested');
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'AI Recipe Generation API',
      version: '1.0.0',
      uptime: process.uptime(),
    };
  }

  @Get('health/detailed')
  @HttpCode(HttpStatus.OK)
  async getDetailedHealth(): Promise<{
    status: string;
    timestamp: string;
    services: {
      api: { status: string; uptime: number };
      ai: { status: string; configured: boolean };
      enhancer: { status: string };
    };
    environment: {
      nodeVersion: string;
      platform: string;
      memory: NodeJS.MemoryUsage;
    };
  }> {
    this.logger.log('Detailed health check requested');
    
    try {
      // AI サービスの健全性テスト（簡単な環境変数チェック）
      const aiConfigured = !!process.env.GOOGLE_AI_API_KEY;
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          api: {
            status: 'healthy',
            uptime: process.uptime(),
          },
          ai: {
            status: aiConfigured ? 'healthy' : 'configuration_missing',
            configured: aiConfigured,
          },
          enhancer: {
            status: 'healthy',
          },
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          memory: process.memoryUsage(),
        },
      };
    } catch (error) {
      this.logger.error('Detailed health check failed', { error: error.message });
      
      throw error;
    }
  }

  private generateRequestId(): string {
    return `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }
}