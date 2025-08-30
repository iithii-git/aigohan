'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Edit3, Trash2, Check, X, GripVertical, Package2, Clock, Tag } from 'lucide-react';
import { clsx } from 'clsx';
import { useIngredients, Ingredient } from '@/hooks/useIngredients';

interface IngredientListProps {
  ingredients?: Ingredient[];
  onIngredientsChange?: (ingredients: string[]) => void;
  className?: string;
  disabled?: boolean;
  showCategories?: boolean;
  showTimestamps?: boolean;
  allowReordering?: boolean;
  maxHeight?: number;
}

// 食材カテゴリーの色設定
const CATEGORY_COLORS: Record<string, string> = {
  '野菜': 'bg-green-100 text-green-800 border-green-200',
  '肉類': 'bg-red-100 text-red-800 border-red-200', 
  '魚介類': 'bg-blue-100 text-blue-800 border-blue-200',
  '乳製品': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '調味料': 'bg-purple-100 text-purple-800 border-purple-200',
  '穀物': 'bg-amber-100 text-amber-800 border-amber-200',
  'その他': 'bg-gray-100 text-gray-800 border-gray-200',
  '未分類': 'bg-gray-100 text-gray-800 border-gray-200',
};

// 個別の食材アイテムコンポーネント
interface IngredientItemProps {
  ingredient: Ingredient;
  onUpdate: (id: string, name: string, category?: string) => Promise<boolean>;
  onDelete: (id: string) => boolean;
  onToggleEdit: (id: string) => void;
  disabled?: boolean;
  showCategories?: boolean;
  showTimestamps?: boolean;
}

function IngredientItem({
  ingredient,
  onUpdate,
  onDelete,
  onToggleEdit,
  disabled = false,
  showCategories = true,
  showTimestamps = false,
}: IngredientItemProps) {
  const [editName, setEditName] = useState(ingredient.name);
  const [isUpdating, setIsUpdating] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // 編集モード切り替え時にフォーカス
  useEffect(() => {
    if (ingredient.isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [ingredient.isEditing]);

  // 編集保存処理
  const handleSaveEdit = async () => {
    if (editName.trim() === ingredient.name) {
      onToggleEdit(ingredient.id);
      return;
    }

    setIsUpdating(true);
    try {
      const success = await onUpdate(ingredient.id, editName.trim());
      if (success) {
        // 編集成功時は自動的に編集モードを終了
        console.log('Ingredient updated successfully');
      }
    } catch (error) {
      console.error('Failed to update ingredient:', error);
      setEditName(ingredient.name); // 元の値に戻す
    } finally {
      setIsUpdating(false);
    }
  };

  // 編集キャンセル処理
  const handleCancelEdit = () => {
    setEditName(ingredient.name);
    onToggleEdit(ingredient.id);
  };

  // キーボード操作
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  // 削除確認処理
  const handleDelete = () => {
    if (window.confirm(`「${ingredient.name}」を削除しますか？`)) {
      onDelete(ingredient.id);
    }
  };

  const categoryColor = CATEGORY_COLORS[ingredient.category || '未分類'] || CATEGORY_COLORS['未分類'];

  return (
    <div className={clsx(
      'group flex items-center p-3 border rounded-lg transition-all duration-200',
      ingredient.isEditing 
        ? 'bg-blue-50 border-blue-300 shadow-md' 
        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
    )}>
      {/* ドラッグハンドル */}
      <div className="flex-shrink-0 mr-3 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* 食材情報 */}
      <div className="flex-grow min-w-0">
        {ingredient.isEditing ? (
          // 編集モード
          <div className="space-y-2">
            <input
              ref={editInputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-1 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="食材名を入力"
              disabled={isUpdating}
            />
            {showCategories && (
              <div className="flex items-center space-x-2">
                <Tag className="w-3 h-3 text-gray-400" />
                <span className={clsx(
                  'px-2 py-0.5 text-xs rounded-md border',
                  categoryColor
                )}>
                  {ingredient.category || '未分類'}
                </span>
              </div>
            )}
          </div>
        ) : (
          // 表示モード
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-800 truncate">
                {ingredient.name}
              </span>
              {showCategories && (
                <span className={clsx(
                  'px-2 py-0.5 text-xs rounded-md border flex-shrink-0',
                  categoryColor
                )}>
                  {ingredient.category || '未分類'}
                </span>
              )}
            </div>
            {showTimestamps && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(ingredient.addedAt).toLocaleString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
        {ingredient.isEditing ? (
          // 編集中のボタン
          <>
            <button
              onClick={handleSaveEdit}
              disabled={disabled || isUpdating || !editName.trim()}
              className={clsx(
                'p-1.5 rounded-md transition-colors',
                editName.trim() && !isUpdating
                  ? 'text-green-600 hover:bg-green-100'
                  : 'text-gray-400 cursor-not-allowed'
              )}
              title="保存"
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={disabled || isUpdating}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
              title="キャンセル"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          // 通常のボタン
          <>
            <button
              onClick={() => onToggleEdit(ingredient.id)}
              disabled={disabled}
              className="p-1.5 rounded-md text-blue-600 hover:bg-blue-100 transition-colors opacity-0 group-hover:opacity-100"
              title="編集"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={disabled}
              className="p-1.5 rounded-md text-red-600 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function IngredientList({
  ingredients: externalIngredients,
  onIngredientsChange,
  className,
  disabled = false,
  showCategories = true,
  showTimestamps = false,
  allowReordering = false,
  maxHeight = 400,
}: IngredientListProps) {
  const {
    ingredients: internalIngredients,
    updateIngredient,
    removeIngredient,
    toggleEditing,
    reorderIngredients,
    getIngredientsByCategory,
    exportIngredients,
  } = useIngredients();

  // 外部から渡された食材リストか内部の状態かを選択
  const ingredients = externalIngredients || internalIngredients;
  const [groupByCategory, setGroupByCategory] = useState(false);

  // 親コンポーネントに変更を通知
  useEffect(() => {
    if (onIngredientsChange && !externalIngredients) {
      onIngredientsChange(exportIngredients());
    }
  }, [internalIngredients, onIngredientsChange, exportIngredients, externalIngredients]);

  // 食材更新処理
  const handleUpdateIngredient = async (id: string, name: string, category?: string): Promise<boolean> => {
    if (externalIngredients) {
      // 外部管理の場合は親コンポーネントに委譲
      console.warn('External ingredients update not implemented');
      return false;
    }
    return updateIngredient(id, name, category);
  };

  // 食材削除処理
  const handleRemoveIngredient = (id: string): boolean => {
    if (externalIngredients) {
      // 外部管理の場合は親コンポーネントに委譲
      console.warn('External ingredients remove not implemented');
      return false;
    }
    return removeIngredient(id);
  };

  // 食材編集トグル処理
  const handleToggleEdit = (id: string) => {
    if (externalIngredients) {
      // 外部管理の場合は親コンポーネントに委譲
      console.warn('External ingredients toggle edit not implemented');
      return;
    }
    toggleEditing(id);
  };

  // 食材が空の場合
  if (ingredients.length === 0) {
    return (
      <div className={clsx('text-center py-8', className)}>
        <Package2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium mb-1">食材が追加されていません</p>
        <p className="text-sm text-gray-400">上の入力フォームから食材を追加してください</p>
      </div>
    );
  }

  // カテゴリー別表示
  if (groupByCategory && showCategories) {
    const categorizedIngredients = getIngredientsByCategory();
    
    return (
      <div className={clsx('space-y-4', className)}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <Package2 className="w-5 h-5 text-orange-500" />
            <span>追加した食材（{ingredients.length}個）</span>
          </h3>
          <button
            onClick={() => setGroupByCategory(false)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            リスト表示
          </button>
        </div>

        {/* カテゴリー別リスト */}
        <div className="space-y-4" style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}>
          {Object.entries(categorizedIngredients).map(([category, categoryIngredients]) => (
            <div key={category} className="space-y-2">
              <h4 className="font-medium text-gray-700 flex items-center space-x-2">
                <span className={clsx(
                  'px-2 py-1 text-sm rounded-md border',
                  CATEGORY_COLORS[category] || CATEGORY_COLORS['未分類']
                )}>
                  {category}
                </span>
                <span className="text-sm text-gray-500">({categoryIngredients.length}個)</span>
              </h4>
              <div className="space-y-2 pl-4">
                {categoryIngredients.map(ingredient => (
                  <IngredientItem
                    key={ingredient.id}
                    ingredient={ingredient}
                    onUpdate={handleUpdateIngredient}
                    onDelete={handleRemoveIngredient}
                    onToggleEdit={handleToggleEdit}
                    disabled={disabled}
                    showCategories={false} // カテゴリー別表示では個別のカテゴリーは非表示
                    showTimestamps={showTimestamps}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 通常のリスト表示
  return (
    <div className={clsx('space-y-4', className)}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <Package2 className="w-5 h-5 text-orange-500" />
          <span>追加した食材（{ingredients.length}個）</span>
        </h3>
        {showCategories && ingredients.length > 3 && (
          <button
            onClick={() => setGroupByCategory(true)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            カテゴリー別表示
          </button>
        )}
      </div>

      {/* 食材リスト */}
      <div 
        className="space-y-2"
        style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}
      >
        {ingredients.map((ingredient, index) => (
          <IngredientItem
            key={ingredient.id}
            ingredient={ingredient}
            onUpdate={handleUpdateIngredient}
            onDelete={handleRemoveIngredient}
            onToggleEdit={handleToggleEdit}
            disabled={disabled}
            showCategories={showCategories}
            showTimestamps={showTimestamps}
          />
        ))}
      </div>

      {/* フッター情報 */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
        <span>
          食材をクリックして編集、ホバーで削除ボタンが表示されます
        </span>
        {allowReordering && (
          <span className="text-xs">
            ドラッグして並び替え可能
          </span>
        )}
      </div>
    </div>
  );
}