import apiClient, { createMultipartClient, ApiError } from './client';
import { 
  RecipeGenerationRequest, 
  RecipeGenerationResponse, 
  HealthResponse, 
  DetailedHealthResponse 
} from '@/types/api';

export class RecipeApi {
  /**
   * レシピ生成API
   * 食材リストと画像からレシピを生成
   */
  static async generateRecipe(request: RecipeGenerationRequest): Promise<RecipeGenerationResponse> {
    try {
      // FormDataを作成
      const formData = new FormData();
      
      // 食材リストをJSONとして追加
      formData.append('ingredients', JSON.stringify(request.ingredients));
      
      // 画像ファイルを追加
      if (request.images && request.images.length > 0) {
        request.images.forEach((image, index) => {
          formData.append('images', image, image.name || `image_${index}.jpg`);
        });
      }
      
      // マルチパートクライアントを使用
      const multipartClient = createMultipartClient();
      
      const response = await multipartClient.post<RecipeGenerationResponse>(
        '/api/recipes/generate',
        formData
      );
      
      return response.data;
    } catch (error) {
      console.error('Recipe generation failed:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        'レシピの生成に失敗しました',
        500,
        'RECIPE_GENERATION_ERROR'
      );
    }
  }
  
  /**
   * APIヘルスチェック
   */
  static async healthCheck(): Promise<HealthResponse> {
    try {
      const response = await apiClient.get<HealthResponse>('/api/recipes/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
  
  /**
   * 詳細ヘルスチェック
   */
  static async detailedHealthCheck(): Promise<DetailedHealthResponse> {
    try {
      const response = await apiClient.get<DetailedHealthResponse>('/api/recipes/health/detailed');
      return response.data;
    } catch (error) {
      console.error('Detailed health check failed:', error);
      throw error;
    }
  }
}

// 便利な関数をエクスポート
export const recipeApi = {
  generateRecipe: RecipeApi.generateRecipe,
  healthCheck: RecipeApi.healthCheck,
  detailedHealthCheck: RecipeApi.detailedHealthCheck,
};