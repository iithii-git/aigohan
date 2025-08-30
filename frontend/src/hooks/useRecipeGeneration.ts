import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recipeApi } from '@/lib/api/recipes';
import { RecipeGenerationRequest, Recipe } from '@/types/api';
import { ApiError } from '@/lib/api/client';

// Query Keys
export const RECIPE_QUERY_KEYS = {
  all: ['recipes'] as const,
  health: () => [...RECIPE_QUERY_KEYS.all, 'health'] as const,
  detailedHealth: () => [...RECIPE_QUERY_KEYS.all, 'health', 'detailed'] as const,
  generation: (request: RecipeGenerationRequest) => 
    [...RECIPE_QUERY_KEYS.all, 'generate', request] as const,
};

/**
 * レシピ生成用フック
 */
export function useRecipeGeneration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: RecipeGenerationRequest) => recipeApi.generateRecipe(request),
    onSuccess: (data) => {
      console.log('Recipe generation successful:', data);
      
      // 成功時に生成されたレシピをキャッシュ
      if (data.success && data.data) {
        queryClient.setQueryData(
          ['recipe', 'latest'],
          data.data
        );
      }
    },
    onError: (error: ApiError) => {
      console.error('Recipe generation failed:', error);
    },
    // レシピ生成は時間がかかるため、リトライは1回のみ
    retry: (failureCount, error) => {
      if (error instanceof ApiError) {
        // クライアントエラーはリトライしない
        if (error.isClientError) return false;
        // ネットワークエラーは1回だけリトライ
        if (error.isNetworkError) return failureCount < 1;
        // サーバーエラーは1回だけリトライ
        if (error.isServerError) return failureCount < 1;
      }
      return false;
    },
    retryDelay: 3000, // 3秒待機
  });
}

/**
 * API健全性チェック用フック
 */
export function useHealthCheck(enabled = true) {
  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.health(),
    queryFn: recipeApi.healthCheck,
    enabled,
    refetchInterval: 30000, // 30秒ごとに自動更新
    staleTime: 15000, // 15秒間は新しいデータとみなす
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * 詳細健全性チェック用フック
 */
export function useDetailedHealthCheck(enabled = false) {
  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.detailedHealth(),
    queryFn: recipeApi.detailedHealthCheck,
    enabled,
    refetchInterval: enabled ? 60000 : false, // 1分ごと（有効な場合のみ）
    staleTime: 30000, // 30秒間は新しいデータとみなす
    retry: 2,
  });
}

/**
 * レシピ生成状態管理用のカスタムフック
 */
export function useRecipeState() {
  const queryClient = useQueryClient();
  
  const getLatestRecipe = (): Recipe | undefined => {
    return queryClient.getQueryData(['recipe', 'latest']);
  };
  
  const clearLatestRecipe = () => {
    queryClient.removeQueries({ queryKey: ['recipe', 'latest'] });
  };
  
  const invalidateRecipeQueries = () => {
    queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
  };
  
  return {
    getLatestRecipe,
    clearLatestRecipe,
    invalidateRecipeQueries,
  };
}

/**
 * エラー状態の管理用フック
 */
export function useApiErrorHandling() {
  const formatErrorMessage = (error: unknown): string => {
    if (error instanceof ApiError) {
      switch (error.code) {
        case 'INVALID_REQUEST':
          return '入力データに問題があります。食材を確認してください。';
        case 'AI_RESPONSE_ERROR':
          return 'AIからの応答を処理できませんでした。再試行してください。';
        case 'AI_SERVICE_UNAVAILABLE':
          return 'AIサービスが利用できません。しばらく待ってから再試行してください。';
        case 'REQUEST_TIMEOUT':
          return 'リクエストがタイムアウトしました。再試行してください。';
        case 'RATE_LIMIT_EXCEEDED':
          return 'リクエストが多すぎます。しばらく待ってから再試行してください。';
        case 'NETWORK_ERROR':
          return 'ネットワークエラーが発生しました。接続を確認してください。';
        default:
          return error.message || 'エラーが発生しました';
      }
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return '予期しないエラーが発生しました';
  };
  
  const getErrorSeverity = (error: unknown): 'info' | 'warning' | 'error' => {
    if (error instanceof ApiError) {
      if (error.code === 'REQUEST_TIMEOUT' || error.code === 'RATE_LIMIT_EXCEEDED') {
        return 'warning';
      }
      if (error.isClientError) {
        return 'info';
      }
    }
    return 'error';
  };
  
  return {
    formatErrorMessage,
    getErrorSeverity,
  };
}