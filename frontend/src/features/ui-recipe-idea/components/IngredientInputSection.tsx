/**
 * IngredientInputSection.tsx - 食材入力セクション
 * 
 * 【目的】
 * レシピアイデア画面での食材入力・管理機能を提供します。
 * タグ形式での表示、手動入力、画像認識による自動追加に対応します。
 * 
 * 【機能】
 * - 食材のタグ形式表示（手動・画像認識の区別）
 * - リアルタイム重複チェック
 * - カメラボタンによる画像アップロード
 * - レスポンシブデザイン
 */

'use client';

import { useState, useCallback } from 'react';
import { Plus, X, Camera, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// ===================================================================
// 型定義
// ===================================================================

/**
 * 食材アイテムの型
 */
export interface IngredientItem {
  id: string;
  name: string;
  source: 'manual' | 'image'; // 手動入力か画像認識か
}

/**
 * IngredientInputSectionコンポーネントのプロパティ
 */
export interface IngredientInputSectionProps {
  /** 現在の食材リスト */
  ingredients: IngredientItem[];
  /** 食材リスト変更時のコールバック */
  onIngredientsChange: (ingredients: IngredientItem[]) => void;
  /** 画像アップロードボタンクリック時のコールバック（従来） */
  onImageUploadClick: () => void;
  /** ギャラリー起動 */
  onOpenGallery?: () => void;
  /** カメラ起動 */
  onOpenCamera?: () => void;
  /** 最大食材数 */
  maxIngredients?: number;
  /** 無効化状態 */
  disabled?: boolean;
  /** カスタムクラス */
  className?: string;
}

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * 食材入力セクションコンポーネント
 * 
 * 手動入力と画像認識による食材追加機能を統合した
 * 使いやすい食材管理インターフェースです。
 */
export default function IngredientInputSection({
  ingredients,
  onIngredientsChange,
  onImageUploadClick,
  onOpenGallery,
  onOpenCamera,
  maxIngredients = 50,
  disabled = false,
  className,
}: IngredientInputSectionProps) {
  
  // ===================================================================
  // 状態管理
  // ===================================================================
  
  /** 新しい食材を入力するフィールドの値 */
  const [inputValue, setInputValue] = useState('');
  
  /** 入力エラーメッセージ */
  const [inputError, setInputError] = useState('');
  
  // ===================================================================
  // イベントハンドラー
  // ===================================================================
  
  /**
   * 手動での食材追加処理
   */
  const handleAddIngredient = useCallback(() => {
    const trimmed = inputValue.trim();
    
    // バリデーション
    if (!trimmed) {
      setInputError('食材名を入力してください');
      return;
    }
    
    if (trimmed.length > 30) {
      setInputError('食材名は30文字以内で入力してください');
      return;
    }
    
    // 重複チェック
    const isDuplicate = ingredients.some(item => 
      item.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setInputError('この食材は既に追加されています');
      return;
    }
    
    // 最大数チェック
    if (ingredients.length >= maxIngredients) {
      setInputError(`食材は最大${maxIngredients}個まで追加できます`);
      return;
    }
    
    // 食材追加
    const newIngredient: IngredientItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: trimmed,
      source: 'manual',
    };
    
    onIngredientsChange([...ingredients, newIngredient]);
    setInputValue('');
    setInputError('');
  }, [inputValue, ingredients, onIngredientsChange, maxIngredients]);
  
  /**
   * 食材削除処理
   */
  const handleRemoveIngredient = useCallback((id: string) => {
    onIngredientsChange(ingredients.filter(item => item.id !== id));
  }, [ingredients, onIngredientsChange]);
  
  /**
   * Enterキーでの食材追加
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  }, [handleAddIngredient]);
  
  /**
   * 入力値変更時の処理（エラークリア）
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (inputError) {
      setInputError('');
    }
  }, [inputError]);
  
  // ===================================================================
  // レンダリング
  // ===================================================================
  
  return (
    <div className={`bg-white rounded-3xl shadow-lg p-6 md:p-8 ${className}`}>
      
      {/* ===== セクションヘッダー ===== */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">使用する食材</h2>
        <span className="text-sm text-gray-500">
          {ingredients.length}個追加済み
        </span>
      </div>
      
      {/* ===== 食材入力フィールド ===== */}
      <div className="space-y-4 mb-6">
        <div className="flex space-x-3">
          
          {/* 入力フィールド */}
          <div className="flex-1">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="食材名を入力（例：にんじん、豚肉）"
              error={inputError}
              disabled={disabled}
              size="lg"
            />
          </div>
          
          {/* 追加ボタン */}
          <Button
            onClick={handleAddIngredient}
            disabled={disabled || !inputValue.trim() || ingredients.length >= maxIngredients}
            leftIcon={<Plus className="w-5 h-5" />}
            size="lg"
          >
            <span className="hidden sm:inline">追加</span>
          </Button>
          
        </div>
      </div>
      
      {/* ===== カメラ/ギャラリーボタン ===== */}
      <div className="flex justify-center gap-3 mb-6">
        <Button
          onClick={onOpenGallery ?? onImageUploadClick}
          disabled={disabled}
          variant="secondary"
          leftIcon={<Sparkles className="w-5 h-5" />}
          className="shadow-md"
        >
          ギャラリーから選ぶ
        </Button>
        <Button
          onClick={onOpenCamera ?? onImageUploadClick}
          disabled={disabled}
          variant="primary"
          leftIcon={<Camera className="w-5 h-5" />}
          className="shadow-md"
        >
          カメラで撮影
        </Button>
      </div>
      
      {/* ===== 食材タグ表示 ===== */}
      {ingredients.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {ingredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium shadow-sm
                transition-all duration-200 hover:shadow-md
                ${ingredient.source === 'image'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                }
              `}
            >
              {/* 食材名 */}
              <span>{ingredient.name}</span>
              
              {/* 削除ボタン */}
              <button
                onClick={() => handleRemoveIngredient(ingredient.id)}
                disabled={disabled}
                className="p-1 hover:bg-red-100 rounded-full transition-colors group"
                title="削除"
              >
                <X className="w-3 h-3 text-gray-500 group-hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* ===== 空状態表示 ===== */
        <div className="text-center py-12 text-gray-500">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">まずは食材を追加しましょう</p>
          <p className="text-sm">
            手動入力または写真から自動認識できます
          </p>
        </div>
      )}
      
      {/* ===== 進捗情報 ===== */}
      {ingredients.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {maxIngredients - ingredients.length}個まで追加可能
            </span>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span className="text-xs">手動入力</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-xs">画像認識</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}