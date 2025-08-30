'use client';

import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Plus, X, Package2, AlertCircle } from 'lucide-react';

interface SimpleIngredientManagerProps {
  onIngredientsChange?: (ingredients: string[]) => void;
  className?: string;
  disabled?: boolean;
  maxIngredients?: number;
}

export default function SimpleIngredientManager({
  onIngredientsChange,
  className,
  disabled = false,
  maxIngredients = 50,
}: SimpleIngredientManagerProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  // 食材追加
  const handleAddIngredient = useCallback(() => {
    const trimmed = inputValue.trim();
    
    if (!trimmed) {
      setError('食材名を入力してください');
      return;
    }

    if (ingredients.includes(trimmed)) {
      setError('この食材は既に追加されています');
      return;
    }

    if (ingredients.length >= maxIngredients) {
      setError(`食材は最大${maxIngredients}個まで追加できます`);
      return;
    }

    const newIngredients = [...ingredients, trimmed];
    setIngredients(newIngredients);
    setInputValue('');
    setError('');
    
    console.log('SimpleIngredientManager 食材追加:', trimmed, 'total:', newIngredients.length);
    
    // 親コンポーネントに通知
    if (onIngredientsChange) {
      onIngredientsChange(newIngredients);
    }
  }, [ingredients, inputValue, maxIngredients, onIngredientsChange]);

  // 食材削除
  const handleRemoveIngredient = useCallback((index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
    
    console.log('SimpleIngredientManager 食材削除:', ingredients[index], 'remaining:', newIngredients.length);
    
    // 親コンポーネントに通知
    if (onIngredientsChange) {
      onIngredientsChange(newIngredients);
    }
  }, [ingredients, onIngredientsChange]);

  // エンターキー処理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  return (
    <div className={clsx('space-y-6 bg-white rounded-2xl border border-gray-200 p-6', className)}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
            <Package2 className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              食材管理
            </h2>
            <p className="text-sm text-gray-600">
              レシピ生成に使用する食材を追加・管理します
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">
            {ingredients.length}/{maxIngredients}個
          </p>
        </div>
      </div>

      {/* 入力フォーム */}
      <div className="space-y-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="食材名を入力してください（例：にんじん）"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            disabled={disabled}
          />
          <button
            onClick={handleAddIngredient}
            disabled={disabled || !inputValue.trim() || ingredients.length >= maxIngredients}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 食材リスト */}
      {ingredients.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">
            追加した食材（{ingredients.length}個）
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg group"
              >
                <span className="text-gray-800">{ingredient}</span>
                <button
                  onClick={() => handleRemoveIngredient(index)}
                  disabled={disabled}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 rounded transition-all"
                  title="削除"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Package2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p>まだ食材が追加されていません</p>
          <p className="text-sm">上のフォームから食材を追加してください</p>
        </div>
      )}

      {/* デバッグ情報 */}
      <div className="text-xs text-gray-400 border-t pt-4">
        デバッグ: 現在の食材数 = {ingredients.length}
      </div>
    </div>
  );
}