'use client';

import { useState, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, RefreshCw, Sparkles, ChefHat, BookOpen } from 'lucide-react';
import RecipeDisplay from './RecipeDisplay';
import RecipeGenerateButton from './RecipeGenerateButton';
import { useRecipeState } from '@/hooks/useRecipeGeneration';
import { Recipe } from '@/types/api';

interface RecipeManagerProps {
  ingredients: string[];
  images?: File[];
  className?: string;
  showProgress?: boolean;
  onRecipeGenerated?: (recipe: Recipe) => void;
  onError?: (error: string) => void;
  enableAutoSave?: boolean;
  storageKey?: string;
}

// エラー状態の種類
type ErrorState = {
  type: 'generation' | 'storage' | 'network' | 'validation';
  message: string;
  recoverable: boolean;
};

// レシピ管理の状態
type RecipeManagerState = 'idle' | 'generating' | 'success' | 'error' | 'empty';

export default function RecipeManager({
  ingredients,
  images,
  className,
  showProgress = true,
  onRecipeGenerated,
  onError,
  enableAutoSave = true,
  storageKey = 'ai-gohan-latest-recipe',
}: RecipeManagerProps) {
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [managerState, setManagerState] = useState<RecipeManagerState>('idle');
  const [error, setError] = useState<ErrorState | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { getLatestRecipe, clearLatestRecipe } = useRecipeState();

  // レシピの自動保存
  const saveRecipeToStorage = useCallback((recipe: Recipe) => {
    if (!enableAutoSave || !storageKey) return;
    
    try {
      const recipeData = {
        recipe,
        savedAt: new Date().toISOString(),
        ingredients,
      };
      localStorage.setItem(storageKey, JSON.stringify(recipeData));
    } catch (error) {
      console.error('Failed to save recipe to storage:', error);
    }
  }, [enableAutoSave, storageKey, ingredients]);

  // ストレージからレシピを復元
  const loadRecipeFromStorage = useCallback(() => {
    if (!enableAutoSave || !storageKey) return null;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        return data.recipe;
      }
    } catch (error) {
      console.error('Failed to load recipe from storage:', error);
    }
    return null;
  }, [enableAutoSave, storageKey]);

  // 初期化時にストレージからレシピを復元
  useEffect(() => {
    const savedRecipe = loadRecipeFromStorage();
    if (savedRecipe) {
      setCurrentRecipe(savedRecipe);
      setManagerState('success');
    }
  }, [loadRecipeFromStorage]);

  // レシピ生成成功時の処理
  const handleRecipeGenerated = useCallback((recipe: Recipe) => {
    setCurrentRecipe(recipe);
    setManagerState('success');
    setError(null);
    setRetryCount(0);
    
    saveRecipeToStorage(recipe);
    onRecipeGenerated?.(recipe);
  }, [saveRecipeToStorage, onRecipeGenerated]);

  // エラー処理
  const handleError = useCallback((errorMessage: string) => {
    const errorState: ErrorState = {
      type: 'generation',
      message: errorMessage,
      recoverable: true,
    };
    
    setError(errorState);
    setManagerState('error');
    onError?.(errorMessage);
  }, [onError]);

  // レシピクリア
  const handleClearRecipe = useCallback(() => {
    setCurrentRecipe(null);
    setManagerState('idle');
    setError(null);
    setRetryCount(0);
    clearLatestRecipe();
    
    if (enableAutoSave && storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [clearLatestRecipe, enableAutoSave, storageKey]);

  // リトライ処理
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setManagerState('idle');
  }, []);

  // お気に入り処理
  const handleFavorite = useCallback((recipe: Recipe, isFavorite: boolean) => {
    // お気に入りのローカルストレージ管理
    const favoritesKey = 'ai-gohan-favorites';
    try {
      const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
      if (isFavorite) {
        const favoriteRecipe = { ...recipe, id: Date.now().toString(), favoritedAt: new Date().toISOString() };
        favorites.push(favoriteRecipe);
      } else {
        const filtered = favorites.filter((fav: any) => fav.title !== recipe.title);
        localStorage.setItem(favoritesKey, JSON.stringify(filtered));
        return;
      }
      localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to manage favorites:', error);
    }
  }, []);

  // 共有処理
  const handleShare = useCallback(async (recipe: Recipe) => {
    const shareText = `【${recipe.title}】\n\n${recipe.description}\n\n#AIごはん #レシピ`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: shareText,
          url: window.location.href,
        });
      } catch (error) {
        // ユーザーがシェアをキャンセルした場合は何もしない
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to share:', error);
        }
      }
    } else {
      // フォールバック: クリップボードにコピー
      try {
        await navigator.clipboard.writeText(shareText);
        alert('レシピの情報がクリップボードにコピーされました！');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  }, []);

  // ダウンロード処理
  const handleDownload = useCallback((recipe: Recipe) => {
    const recipeText = `
【${recipe.title}】

${recipe.description}

■ 材料（${recipe.servings ? `${recipe.servings}人分` : '適量'}）
${recipe.ingredients.map(ingredient => `• ${ingredient}`).join('\n')}

■ 作り方
${recipe.instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

${recipe.cookingTime ? `⏰ 調理時間：${recipe.cookingTime}分` : ''}

---
このレシピはAI Gohanで生成されました
生成日時: ${new Date().toLocaleString('ja-JP')}
    `.trim();

    const blob = new Blob([recipeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${recipe.title}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // 状態に応じたコンテンツレンダリング
  const renderContent = () => {
    switch (managerState) {
      case 'success':
        return currentRecipe ? (
          <div className="space-y-6">
            <RecipeDisplay
              recipe={currentRecipe}
              onFavorite={handleFavorite}
              onShare={handleShare}
              onDownload={handleDownload}
              showProgress={showProgress}
              showActions={true}
            />
            
            {/* 新しいレシピ生成 */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  新しいレシピを生成
                </h3>
                <button
                  onClick={handleClearRecipe}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  クリア
                </button>
              </div>
              <RecipeGenerateButton
                ingredients={ingredients}
                images={images}
                onRecipeGenerated={handleRecipeGenerated}
                onError={handleError}
                size="sm"
                variant="secondary"
                showProgress={showProgress}
              />
            </div>
          </div>
        ) : null;
        
      case 'error':
        return (
          <div className="text-center py-12 space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                レシピの生成に失敗しました
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {error?.message || 'エラーが発生しました。しばらく時間をおいて再度お試しください。'}
              </p>
            </div>
            
            {error?.recoverable && (
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>再試行 {retryCount > 0 && `(${retryCount}回目)`}</span>
                </button>
                
                <p className="text-xs text-gray-500">
                  問題が続く場合は、食材を見直すか、しばらく時間をおいてお試しください
                </p>
              </div>
            )}
          </div>
        );
        
      case 'empty':
        return (
          <div className="text-center py-12">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              食材を追加してレシピを生成しましょう
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              食材を選択すると、AIが美味しいレシピを提案してくれます
            </p>
          </div>
        );
        
      default:
        return (
          <div className="space-y-6">
            {ingredients.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
                  <ChefHat className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  食材を追加してください
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  レシピを生成するには、少なくとも1つの食材が必要です
                </p>
              </div>
            ) : (
              <div className="text-center">
                <RecipeGenerateButton
                  ingredients={ingredients}
                  images={images}
                  onRecipeGenerated={handleRecipeGenerated}
                  onError={handleError}
                  showProgress={showProgress}
                />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={clsx(
      'bg-white rounded-2xl border border-gray-200 p-6',
      className
    )}>
      {/* ヘッダー */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
          <Sparkles className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            AIレシピ生成
          </h2>
          <p className="text-sm text-gray-600">
            あなたの食材から美味しいレシピを提案します
          </p>
        </div>
      </div>

      {/* メインコンテンツ */}
      {renderContent()}
    </div>
  );
}