'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChefHat, Sparkles, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { 
  useRecipeGeneration, 
  useApiErrorHandling 
} from '@/hooks/useRecipeGeneration';
import { RecipeGenerationRequest, Recipe } from '@/types/api';

interface RecipeGenerateButtonProps {
  ingredients: string[];
  images?: File[];
  onRecipeGenerated?: (recipe: Recipe) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'minimal';
  showProgress?: boolean;
  showRetry?: boolean;
}

// 進捗メッセージのリスト
const PROGRESS_MESSAGES = [
  { message: '画像を解析中...', duration: 2000 },
  { message: '食材を認識中...', duration: 1500 },
  { message: 'レシピを考案中...', duration: 3000 },
  { message: '調理手順を整理中...', duration: 2000 },
  { message: '栄養バランスを確認中...', duration: 1500 },
  { message: 'レシピを完成中...', duration: 1000 },
];

export default function RecipeGenerateButton({
  ingredients,
  images,
  onRecipeGenerated,
  onError,
  disabled = false,
  className,
  size = 'md',
  variant = 'primary',
  showProgress = true,
  showRetry = true,
}: RecipeGenerateButtonProps) {
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [showProgressAnimation, setShowProgressAnimation] = useState(false);

  // Recipe generation mutation
  const {
    mutate: generateRecipe,
    isPending: isGenerating,
    error,
    data: response,
    reset,
  } = useRecipeGeneration();

  // Error handling
  const { formatErrorMessage, getErrorSeverity } = useApiErrorHandling();

  // 進捗アニメーション
  const animateProgress = useCallback(() => {
    if (!showProgress) return;

    setShowProgressAnimation(true);
    setProgress(0);
    setProgressMessage('処理を開始中...');

    let currentStep = 0;
    let currentProgress = 5;

    const runStep = () => {
      if (currentStep >= PROGRESS_MESSAGES.length) {
        // 完了
        setProgress(100);
        setProgressMessage('レシピの生成が完了しました！');
        setTimeout(() => {
          setShowProgressAnimation(false);
        }, 1000);
        return;
      }

      const step = PROGRESS_MESSAGES[currentStep];
      setProgressMessage(step.message);
      
      // 進捗を段階的に更新
      const targetProgress = Math.min(15 + (currentStep * 15), 95);
      const progressIncrement = (targetProgress - currentProgress) / 10;
      
      let animationStep = 0;
      const updateProgress = () => {
        if (animationStep < 10) {
          currentProgress += progressIncrement;
          setProgress(Math.round(currentProgress));
          animationStep++;
          setTimeout(updateProgress, step.duration / 10);
        } else {
          currentStep++;
          setTimeout(runStep, 200);
        }
      };

      updateProgress();
    };

    setTimeout(runStep, 300);
  }, [showProgress]);

  // レシピ生成処理
  const handleGenerateRecipe = useCallback(() => {
    if (!ingredients || ingredients.length === 0) {
      onError?.('食材を少なくとも1つ選択してください');
      return;
    }

    const request: RecipeGenerationRequest = {
      ingredients,
      images: images?.length ? images : undefined,
    };

    // 進捗アニメーション開始
    if (showProgress) {
      animateProgress();
    }

    generateRecipe(request, {
      onSuccess: (data) => {
        if (data.success && data.data) {
          onRecipeGenerated?.(data.data);
        } else if (data.error) {
          onError?.(data.error.message || 'レシピの生成に失敗しました');
        }
      },
      onError: (error) => {
        onError?.(formatErrorMessage(error));
        setShowProgressAnimation(false);
      },
    });
  }, [
    ingredients, 
    images, 
    generateRecipe, 
    onRecipeGenerated, 
    onError, 
    formatErrorMessage,
    animateProgress,
    showProgress
  ]);

  // リトライ処理
  const handleRetry = useCallback(() => {
    reset();
    setTimeout(handleGenerateRecipe, 100);
  }, [reset, handleGenerateRecipe]);

  // サイズ設定
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-8 py-4 text-lg';
      default:
        return 'px-6 py-3 text-base';
    }
  };

  // バリアント設定
  const getVariantClasses = (variant: string) => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600';
      case 'minimal':
        return 'bg-transparent hover:bg-orange-50 text-orange-600 border-orange-200';
      default:
        return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500';
    }
  };

  const isDisabled = disabled || isGenerating || ingredients.length === 0;
  const errorSeverity = error ? getErrorSeverity(error) : null;

  return (
    <div className={clsx('space-y-4', className)}>
      {/* メインボタン */}
      <button
        onClick={handleGenerateRecipe}
        disabled={isDisabled}
        className={clsx(
          'relative flex items-center justify-center space-x-3 rounded-xl border-2 font-semibold transition-all duration-200 shadow-sm',
          getSizeClasses(size),
          isDisabled 
            ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed' 
            : getVariantClasses(variant),
          !isDisabled && 'hover:shadow-md transform hover:-translate-y-0.5',
          className
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>レシピを生成中...</span>
          </>
        ) : (
          <>
            <ChefHat className="w-5 h-5" />
            <span>レシピを生成する</span>
            <Sparkles className="w-4 h-4 opacity-75" />
          </>
        )}
      </button>

      {/* 進捗表示 */}
      {showProgress && showProgressAnimation && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium text-gray-800">
                {progressMessage}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                AIが美味しいレシピを考案しています...
              </p>
            </div>
            <div className="text-sm font-medium text-orange-600">
              {progress}%
            </div>
          </div>

          {/* プログレスバー */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full bg-white opacity-30 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* エラー表示とリトライ */}
      {error && (
        <div className={clsx(
          'border rounded-xl p-4',
          errorSeverity === 'error' && 'bg-red-50 border-red-200',
          errorSeverity === 'warning' && 'bg-yellow-50 border-yellow-200',
          errorSeverity === 'info' && 'bg-blue-50 border-blue-200'
        )}>
          <div className="flex items-start space-x-3">
            <AlertTriangle className={clsx(
              'w-5 h-5 mt-0.5 flex-shrink-0',
              errorSeverity === 'error' && 'text-red-500',
              errorSeverity === 'warning' && 'text-yellow-500',
              errorSeverity === 'info' && 'text-blue-500'
            )} />
            <div className="flex-grow">
              <p className={clsx(
                'text-sm font-medium mb-1',
                errorSeverity === 'error' && 'text-red-800',
                errorSeverity === 'warning' && 'text-yellow-800',
                errorSeverity === 'info' && 'text-blue-800'
              )}>
                レシピ生成エラー
              </p>
              <p className={clsx(
                'text-sm',
                errorSeverity === 'error' && 'text-red-700',
                errorSeverity === 'warning' && 'text-yellow-700',
                errorSeverity === 'info' && 'text-blue-700'
              )}>
                {formatErrorMessage(error)}
              </p>
              
              {showRetry && (
                <button
                  onClick={handleRetry}
                  className={clsx(
                    'mt-3 inline-flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                    errorSeverity === 'error' && 'text-red-700 hover:bg-red-100',
                    errorSeverity === 'warning' && 'text-yellow-700 hover:bg-yellow-100',
                    errorSeverity === 'info' && 'text-blue-700 hover:bg-blue-100'
                  )}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>再試行</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 食材要件メッセージ */}
      {ingredients.length === 0 && (
        <div className="text-center py-3">
          <p className="text-sm text-gray-500">
            レシピを生成するには、食材を少なくとも1つ追加してください
          </p>
        </div>
      )}
    </div>
  );
}