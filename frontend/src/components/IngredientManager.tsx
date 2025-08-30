'use client';

import { useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { Utensils, Sparkles, AlertTriangle } from 'lucide-react';
import IngredientInput from './IngredientInput';
import IngredientList from './IngredientList';
import { useIngredients, type Ingredient } from '@/hooks/useIngredients';

interface IngredientManagerProps {
  className?: string;
  disabled?: boolean;
  maxIngredients?: number;
  onIngredientsChange?: (ingredients: string[]) => void;
  showAdvancedFeatures?: boolean;
  compactMode?: boolean;
}

export default function IngredientManager({
  className,
  disabled = false,
  maxIngredients = 50,
  onIngredientsChange,
  showAdvancedFeatures = true,
  compactMode = false,
}: IngredientManagerProps) {
  const {
    ingredients,
    isLoading,
    errors,
    warnings,
    totalCount,
    canAddMore,
    addIngredient,
    addMultipleIngredients,
    clearIngredients,
    clearErrors,
    clearWarnings,
    exportIngredients,
  } = useIngredients({
    maxIngredients,
    allowDuplicates: false,
    autoTrim: true,
  });

  // 親コンポーネントに変更を通知
  const handleIngredientsChange = useCallback(() => {
    if (onIngredientsChange) {
      onIngredientsChange(exportIngredients());
    }
  }, [onIngredientsChange, exportIngredients]);

  // 食材が変更されたら自動的に親コンポーネントに通知
  useEffect(() => {
    console.log('IngredientManager 食材変更:', ingredients.length, ingredients); // デバッグログ
    handleIngredientsChange();
  }, [ingredients, handleIngredientsChange]);

  // 全クリア処理
  const handleClearAll = useCallback(() => {
    if (totalCount === 0) return;
    
    const confirmed = window.confirm(
      `${totalCount}個の食材をすべて削除しますか？この操作は元に戻せません。`
    );
    
    if (confirmed) {
      clearIngredients();
      handleIngredientsChange();
    }
  }, [totalCount, clearIngredients, handleIngredientsChange]);

  // エラー・警告クリア
  const handleClearMessages = useCallback(() => {
    clearErrors();
    clearWarnings();
  }, [clearErrors, clearWarnings]);

  return (
    <div className={clsx(
      'space-y-6 bg-white rounded-2xl border border-gray-200',
      compactMode ? 'p-4' : 'p-6',
      className
    )}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
            <Utensils className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className={clsx(
              'font-bold text-gray-900',
              compactMode ? 'text-lg' : 'text-xl'
            )}>
              食材管理
            </h2>
            <p className="text-sm text-gray-600">
              レシピ生成に使用する食材を追加・管理します
            </p>
          </div>
        </div>

        {/* 統計とアクション */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">
              {totalCount}/{maxIngredients}個
            </p>
            <p className="text-xs text-gray-500">
              {totalCount === 0 ? '食材なし' : `${maxIngredients - totalCount}個追加可能`}
            </p>
          </div>
          
          {showAdvancedFeatures && totalCount > 0 && (
            <button
              onClick={handleClearAll}
              disabled={disabled || isLoading}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
            >
              全クリア
            </button>
          )}
        </div>
      </div>

      {/* グローバル警告表示 */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                入力に関する注意
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
              <button
                onClick={handleClearMessages}
                className="mt-2 text-xs text-yellow-600 hover:text-yellow-800 underline"
              >
                非表示にする
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 食材入力フォーム */}
      <IngredientInput
        onIngredientsChange={handleIngredientsChange}
        maxIngredients={maxIngredients}
        disabled={disabled}
        showCategorySelector={showAdvancedFeatures}
        showBulkInput={showAdvancedFeatures}
        // 食材状態を外部から提供
        ingredients={ingredients}
        onAddIngredient={addIngredient}
        onAddMultipleIngredients={addMultipleIngredients}
        totalCount={totalCount}
        canAddMore={canAddMore}
        errors={errors}
        clearErrors={clearErrors}
      />

      {/* 食材リスト */}
      {totalCount > 0 && (
        <IngredientList
          onIngredientsChange={handleIngredientsChange}
          disabled={disabled}
          showCategories={showAdvancedFeatures}
          showTimestamps={showAdvancedFeatures && !compactMode}
          allowReordering={showAdvancedFeatures}
          maxHeight={compactMode ? 300 : 400}
        />
      )}

      {/* 空状態での案内 */}
      {totalCount === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            まずは食材を追加しましょう
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            上の入力フォームから食材を追加すると、AIが美味しいレシピを提案してくれます。
            {showAdvancedFeatures && '複数まとめて入力することも可能です。'}
          </p>
          <div className="text-xs text-red-500 mt-4">
            デバッグ: totalCount = {totalCount}, ingredients = {ingredients.length}
          </div>
        </div>
      )}

      {/* フッター情報 */}
      {showAdvancedFeatures && totalCount > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>
                食材をクリックして編集、ホバーで削除ボタンが表示されます
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>AIがこれらの食材でレシピを生成します</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 簡易版のコンパクトな食材管理コンポーネント
export function CompactIngredientManager(props: IngredientManagerProps) {
  return (
    <IngredientManager
      {...props}
      compactMode={true}
      showAdvancedFeatures={false}
    />
  );
}

// 高機能版の食材管理コンポーネント
export function AdvancedIngredientManager(props: IngredientManagerProps) {
  return (
    <IngredientManager
      {...props}
      compactMode={false}
      showAdvancedFeatures={true}
    />
  );
}