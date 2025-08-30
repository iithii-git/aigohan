'use client';

import { useState, useCallback } from 'react';
import { 
  Clock, 
  Users, 
  ChefHat, 
  Heart, 
  Share, 
  Download, 
  CheckCircle,
  Circle,
  Sparkles,
  Copy,
  Star
} from 'lucide-react';
import { clsx } from 'clsx';
import { Recipe } from '@/types/api';

interface RecipeDisplayProps {
  recipe: Recipe;
  onFavorite?: (recipe: Recipe, isFavorite: boolean) => void;
  onShare?: (recipe: Recipe) => void;
  onDownload?: (recipe: Recipe) => void;
  className?: string;
  showActions?: boolean;
  showProgress?: boolean;
  compact?: boolean;
}

export default function RecipeDisplay({
  recipe,
  onFavorite,
  onShare,
  onDownload,
  className,
  showActions = true,
  showProgress = false,
  compact = false,
}: RecipeDisplayProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // お気に入りトグル
  const handleFavoriteToggle = useCallback(() => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    onFavorite?.(recipe, newFavoriteState);
  }, [isFavorite, onFavorite, recipe]);

  // ステップ完了トグル
  const handleStepToggle = useCallback((stepIndex: number) => {
    if (!showProgress) return;

    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);
  }, [completedSteps, showProgress]);

  // テキストコピー
  const handleCopyText = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, []);

  // レシピ全体をテキスト形式でコピー
  const handleCopyRecipe = useCallback(() => {
    const recipeText = `
【${recipe.title}】

${recipe.description}

■ 材料（${recipe.servings ? `${recipe.servings}人分` : '適量'}）
${recipe.ingredients.map(ingredient => `• ${ingredient}`).join('\n')}

■ 作り方
${recipe.instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

${recipe.cookingTime ? `⏰ 調理時間：${recipe.cookingTime}分` : ''}
    `.trim();
    
    handleCopyText(recipeText, 'レシピ全体');
  }, [recipe, handleCopyText]);

  // 進捗計算
  const progressPercentage = showProgress 
    ? Math.round((completedSteps.size / recipe.instructions.length) * 100)
    : 0;

  return (
    <div className={clsx(
      'bg-white rounded-2xl border border-gray-200 overflow-hidden',
      compact ? 'p-4' : 'p-6',
      className
    )}>
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-grow">
            <h1 className={clsx(
              'font-bold text-gray-900 leading-tight',
              compact ? 'text-xl' : 'text-2xl'
            )}>
              {recipe.title}
            </h1>
            <div className="flex items-center space-x-1 mt-1">
              <Star className="w-4 h-4 text-orange-400 fill-current" />
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-600 font-medium">AI生成レシピ</span>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={handleFavoriteToggle}
                className={clsx(
                  'p-2 rounded-full transition-colors',
                  isFavorite
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                title="お気に入り"
              >
                <Heart className={clsx('w-5 h-5', isFavorite && 'fill-current')} />
              </button>
              
              <button
                onClick={() => onShare?.(recipe)}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="共有"
              >
                <Share className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleCopyRecipe}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="コピー"
              >
                <Copy className="w-5 h-5" />
              </button>

              {onDownload && (
                <button
                  onClick={() => onDownload(recipe)}
                  className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  title="ダウンロード"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 説明 */}
        <p className="text-gray-600 leading-relaxed mb-4">
          {recipe.description}
        </p>

        {/* メタ情報 */}
        <div className="flex items-center space-x-6 text-sm text-gray-500">
          {recipe.cookingTime && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{recipe.cookingTime}分</span>
            </div>
          )}
          
          {recipe.servings && (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>{recipe.servings}人分</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <ChefHat className="w-4 h-4" />
            <span>{recipe.instructions.length}ステップ</span>
          </div>
        </div>

        {/* 進捗表示 */}
        {showProgress && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                調理進捗
              </span>
              <span className="text-sm text-gray-600">
                {completedSteps.size}/{recipe.instructions.length} 完了
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* コピー成功メッセージ */}
      {copiedText && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800">
              {copiedText}をクリップボードにコピーしました
            </span>
          </div>
        </div>
      )}

      {/* 材料セクション */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">材料</h2>
          {recipe.servings && (
            <span className="text-sm text-gray-600">
              {recipe.servings}人分
            </span>
          )}
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4">
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-center space-x-3">
                <Circle className="w-2 h-2 text-orange-500 fill-current flex-shrink-0" />
                <span className="text-gray-700">{ingredient}</span>
                <button
                  onClick={() => handleCopyText(ingredient, '材料')}
                  className="ml-auto p-1 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 作り方セクション */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">作り方</h2>
        
        <div className="space-y-4">
          {recipe.instructions.map((instruction, index) => {
            const isCompleted = completedSteps.has(index);
            
            return (
              <div
                key={index}
                className={clsx(
                  'group flex space-x-4 p-4 rounded-xl border transition-all',
                  isCompleted && showProgress
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                )}
              >
                {/* ステップ番号/チェックボックス */}
                <div 
                  className="flex-shrink-0 cursor-pointer"
                  onClick={() => handleStepToggle(index)}
                >
                  {showProgress ? (
                    isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors" />
                    )
                  ) : (
                    <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* 指示内容 */}
                <div className="flex-grow">
                  <p className={clsx(
                    'text-gray-700 leading-relaxed',
                    isCompleted && showProgress && 'line-through text-gray-500'
                  )}>
                    {instruction}
                  </p>
                </div>

                {/* コピーボタン */}
                <button
                  onClick={() => handleCopyText(instruction, `手順${index + 1}`)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 完了メッセージ */}
      {showProgress && completedSteps.size === recipe.instructions.length && completedSteps.size > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white text-center">
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">お疲れさまでした！美味しいお料理の完成です！</span>
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* フッター */}
      {!compact && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>このレシピはAIによって生成されました</span>
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>powered by AI Gohan</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}