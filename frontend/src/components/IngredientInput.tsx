'use client';

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { Plus, Package2, Sparkles, X, AlertCircle, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useIngredients, Ingredient } from '@/hooks/useIngredients';

interface IngredientInputProps {
  onIngredientsChange?: (ingredients: string[]) => void;
  maxIngredients?: number;
  className?: string;
  disabled?: boolean;
  showCategorySelector?: boolean;
  showBulkInput?: boolean;
  // 外部から食材状態を受け取るためのプロパティ
  ingredients?: Ingredient[];
  onAddIngredient?: (name: string, category?: string) => Promise<boolean>;
  onAddMultipleIngredients?: (names: string[]) => Promise<Ingredient[]>;
  totalCount?: number;
  canAddMore?: boolean;
  errors?: string[];
  clearErrors?: () => void;
}

// 食材カテゴリーの定義
const INGREDIENT_CATEGORIES = [
  { value: '野菜', label: '🥬 野菜', color: 'bg-green-50 text-green-800 border-green-200' },
  { value: '肉類', label: '🥩 肉類', color: 'bg-red-50 text-red-800 border-red-200' },
  { value: '魚介類', label: '🐟 魚介類', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  { value: '乳製品', label: '🧀 乳製品', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  { value: '調味料', label: '🧂 調味料', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { value: '穀物', label: '🌾 穀物', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'その他', label: '📦 その他', color: 'bg-gray-50 text-gray-800 border-gray-200' },
];

// よく使われる食材のサジェスト
const COMMON_INGREDIENTS = [
  // 野菜
  'にんじん', 'たまねぎ', 'じゃがいも', 'きゃべつ', 'トマト', 'ほうれん草', 'ねぎ', 'だいこん',
  // 肉類
  '鶏肉', '豚肉', '牛肉', 'ひき肉', 'ベーコン', 'ソーセージ',
  // 魚介類
  '鮭', 'まぐろ', 'えび', 'いか', 'あさり',
  // 調味料
  '醤油', 'みそ', '塩', 'こしょう', '砂糖', 'みりん', '酒', '酢', 'サラダ油',
  // その他
  '卵', '牛乳', 'バター', 'チーズ', '米', 'パン', '麺',
];

export default function IngredientInput({
  onIngredientsChange,
  maxIngredients = 50,
  className,
  disabled = false,
  showCategorySelector = true,
  showBulkInput = true,
  // 外部から受け取る食材状態
  ingredients: externalIngredients,
  onAddIngredient: externalAddIngredient,
  onAddMultipleIngredients: externalAddMultipleIngredients,
  totalCount: externalTotalCount,
  canAddMore: externalCanAddMore,
  errors: externalErrors,
  clearErrors: externalClearErrors,
}: IngredientInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('その他');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 内部の食材管理フック（外部から提供されない場合のフォールバック）
  const internalHook = useIngredients({
    maxIngredients,
    allowDuplicates: false,
  });

  // 外部から提供されている場合は外部の値を使用、そうでなければ内部のフックを使用
  const ingredients = externalIngredients ?? internalHook.ingredients;
  const isLoading = internalHook.isLoading;
  const errors = externalErrors ?? internalHook.errors;
  const totalCount = externalTotalCount ?? internalHook.totalCount;
  const canAddMore = externalCanAddMore ?? internalHook.canAddMore;
  const addIngredient = externalAddIngredient ?? internalHook.addIngredient;
  const addMultipleIngredients = externalAddMultipleIngredients ?? internalHook.addMultipleIngredients;
  const clearErrors = externalClearErrors ?? internalHook.clearErrors;
  const exportIngredients = useCallback(() => {
    if (externalIngredients) {
      return externalIngredients.map(ingredient => ingredient.name);
    }
    return internalHook.exportIngredients();
  }, [externalIngredients, internalHook.exportIngredients]);

  // 親コンポーネントに変更を通知
  const notifyParent = useCallback(() => {
    if (onIngredientsChange) {
      onIngredientsChange(exportIngredients());
    }
  }, [onIngredientsChange, exportIngredients]);

  // 食材が変更されたら親コンポーネントに通知
  useEffect(() => {
    notifyParent();
  }, [ingredients, notifyParent]);

  // 入力値の変更処理
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    clearErrors();

    // サジェスト更新
    if (value.trim() && !isBulkMode) {
      const filtered = COMMON_INGREDIENTS
        .filter(ingredient => 
          ingredient.toLowerCase().includes(value.toLowerCase()) &&
          !exportIngredients().includes(ingredient)
        )
        .slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [isBulkMode, clearErrors, exportIngredients]);

  // 単一食材追加
  const handleSingleAdd = useCallback(async () => {
    if (!inputValue.trim() || disabled || !canAddMore) return;

    const success = await addIngredient(inputValue.trim(), selectedCategory);
    if (success) {
      setInputValue('');
      setShowSuggestions(false);
      notifyParent();
      inputRef.current?.focus();
    }
  }, [inputValue, disabled, canAddMore, addIngredient, selectedCategory, notifyParent]);

  // 複数食材追加（カンマ区切り）
  const handleBulkAdd = useCallback(async () => {
    if (!inputValue.trim() || disabled) return;

    const names = inputValue
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) return;

    await addMultipleIngredients(names);
    setInputValue('');
    notifyParent();
    inputRef.current?.focus();
  }, [inputValue, disabled, addMultipleIngredients, notifyParent]);

  // エンターキー処理
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isBulkMode) {
        handleBulkAdd();
      } else {
        handleSingleAdd();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [isBulkMode, handleBulkAdd, handleSingleAdd]);

  // サジェストクリック
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  // バルクモード切り替え
  const toggleBulkMode = useCallback(() => {
    setIsBulkMode(prev => {
      const newMode = !prev;
      if (!newMode) {
        setInputValue('');
      }
      setShowSuggestions(false);
      return newMode;
    });
  }, []);

  return (
    <div className={clsx('space-y-4', className)}>
      {/* 入力モード切り替え */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <Package2 className="w-5 h-5 text-orange-500" />
          <span>食材を追加</span>
        </h3>

        {showBulkInput && (
          <button
            onClick={toggleBulkMode}
            className={clsx(
              'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
              isBulkMode
                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
            disabled={disabled}
          >
            {isBulkMode ? '1個ずつ' : '複数まとめて'}
          </button>
        )}
      </div>

      {/* 入力フォーム */}
      <div className="relative">
        <div className={clsx(
          'border rounded-xl p-4 space-y-4 transition-colors',
          errors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
        )}>
          {/* カテゴリー選択 */}
          {showCategorySelector && !isBulkMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                カテゴリー
              </label>
              <div className="flex flex-wrap gap-2">
                {INGREDIENT_CATEGORIES.map(category => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={clsx(
                      'px-3 py-1 rounded-lg text-sm border transition-all',
                      selectedCategory === category.value
                        ? category.color
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    )}
                    disabled={disabled}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 入力エリア */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {isBulkMode ? '食材名（カンマ区切りで複数入力可）' : '食材名'}
            </label>
            
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className={clsx(
                  'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors',
                  disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
                  errors.length > 0 ? 'border-red-300' : 'border-gray-300'
                )}
                placeholder={
                  isBulkMode 
                    ? 'にんじん, たまねぎ, じゃがいも...'
                    : 'にんじん'
                }
                disabled={disabled || !canAddMore}
              />

              {/* 追加ボタン */}
              <button
                onClick={isBulkMode ? handleBulkAdd : handleSingleAdd}
                disabled={disabled || !inputValue.trim() || !canAddMore || isLoading}
                className={clsx(
                  'absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg font-medium transition-colors',
                  inputValue.trim() && canAddMore && !isLoading
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* サジェスト */}
            {showSuggestions && !isBulkMode && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                <div className="p-2">
                  <div className="flex items-center space-x-2 px-2 py-1 text-xs text-gray-500">
                    <Sparkles className="w-3 h-3" />
                    <span>おすすめの食材</span>
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-2 py-2 text-left hover:bg-gray-100 rounded transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* バルクモード時のヘルプ */}
          {isBulkMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">複数入力モード</p>
                  <p>食材名をカンマ（,）で区切って入力すると、まとめて追加できます。</p>
                  <p className="mt-1 text-xs text-blue-600">
                    例: にんじん, たまねぎ, じゃがいも
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 状態表示 */}
        <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
          <div className="flex items-center space-x-4">
            <span>
              <span className="font-medium">{totalCount}</span>
              <span>/{maxIngredients} 個</span>
            </span>
            
            {!canAddMore && (
              <div className="flex items-center space-x-1 text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">上限に達しました</span>
              </div>
            )}
          </div>

          {totalCount > 0 && (
            <div className="flex items-center space-x-1 text-green-600">
              <Check className="w-4 h-4" />
              <span className="text-xs">{totalCount}個の食材を追加済み</span>
            </div>
          )}
        </div>
      </div>

      {/* エラー表示 */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                入力エラー
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
              <button
                onClick={clearErrors}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                エラーを非表示
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}