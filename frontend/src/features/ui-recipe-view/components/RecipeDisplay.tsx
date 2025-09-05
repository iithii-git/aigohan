/**
 * RecipeDisplay.tsx - レシピ表示メインコンポーネント
 * 
 * 【目的】
 * AIによって生成されたレシピを美しく表示します。
 * タイトル、説明、食材、手順を見やすくレイアウトし、
 * ユーザーがレシピを簡単に理解・実行できるUIを提供します。
 * 
 * 【機能】
 * - レシピタイトルと説明の表示
 * - 食材リストの整理表示
 * - ステップバイステップの手順表示
 * - 調理時間・人数分の表示
 * - お気に入り登録機能
 */

'use client';

import { useState, useCallback } from 'react';
import { Clock, Users, Heart, Share2, ChefHat } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Recipe, RecipeWithMetadata } from '@/types/api';

// ===================================================================
// 型定義
// ===================================================================

/**
 * RecipeDisplayコンポーネントのプロパティ
 */
export interface RecipeDisplayProps {
  /** 表示するレシピデータ */
  recipe: RecipeWithMetadata;
  /** お気に入り状態変更時のコールバック */
  onFavoriteToggle?: (recipeId: string, isFavorite: boolean) => void;
  /** シェアボタンクリック時のコールバック */
  onShare?: (recipe: RecipeWithMetadata) => void;
  /** 新しいレシピを作るボタンクリック時のコールバック */
  onCreateNew?: () => void;
  /** ローディング状態 */
  isLoading?: boolean;
  /** カスタムクラス */
  className?: string;
}

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * レシピ表示メインコンポーネント
 * 
 * 生成されたレシピを見やすく表示し、ユーザーが料理を作りやすいよう
 * 情報を整理して提供します。
 */
export default function RecipeDisplay({
  recipe,
  onFavoriteToggle,
  onShare,
  onCreateNew,
  isLoading = false,
  className,
}: RecipeDisplayProps) {
  
  // ===================================================================
  // 状態管理
  // ===================================================================
  
  /** お気に入り状態（ローカル管理） */
  const [isFavorite, setIsFavorite] = useState(recipe.isFavorite || false);
  
  // ===================================================================
  // イベントハンドラー
  // ===================================================================
  
  /**
   * お気に入り状態切り替え処理
   */
  const handleFavoriteToggle = useCallback(() => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    if (onFavoriteToggle && recipe.id) {
      onFavoriteToggle(recipe.id, newFavoriteState);
    }
  }, [isFavorite, onFavoriteToggle, recipe.id]);
  
  /**
   * シェアボタンクリック処理
   */
  const handleShare = useCallback(() => {
    if (onShare) {
      onShare(recipe);
    }
  }, [onShare, recipe]);
  
  // ローディング中の表示
  if (isLoading) {
    return (
      <div className={`bg-white rounded-3xl shadow-xl p-8 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded-xl"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded-lg"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // ===================================================================
  // レンダリング
  // ===================================================================
  
  return (
    <div className={`bg-white rounded-3xl shadow-xl overflow-hidden ${className}`}>
      
      {/* ===== ヘッダー部分 ===== */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white">
        <div className="flex items-start justify-between mb-4">
          
          {/* タイトルとアイコン */}
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-3 rounded-2xl">
              <ChefHat className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 leading-tight">
                {recipe.title}
              </h1>
              <p className="text-orange-100 text-lg">
                {recipe.description}
              </p>
            </div>
          </div>
          
          {/* アクションボタン */}
          <div className="flex space-x-2">
            <button
              onClick={handleFavoriteToggle}
              className={`
                p-3 rounded-full transition-all duration-200
                ${isFavorite 
                  ? 'bg-white text-red-500 shadow-lg' 
                  : 'bg-white/20 text-white hover:bg-white/30'
                }
              `}
              title={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            
            {onShare && (
              <button
                onClick={handleShare}
                className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-200"
                title="レシピを共有"
              >
                <Share2 className="w-6 h-6" />
              </button>
            )}
          </div>
          
        </div>
        
        {/* メタ情報 */}
        <div className="flex items-center space-x-6 text-orange-100">
          {recipe.cookingTime && (
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">{recipe.cookingTime}分</span>
            </div>
          )}
          
          {recipe.servings && (
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">{recipe.servings}人分</span>
            </div>
          )}
          
          {recipe.createdAt && (
            <div className="text-sm">
              作成日: {new Date(recipe.createdAt).toLocaleDateString('ja-JP')}
            </div>
          )}
        </div>
      </div>
      
      {/* ===== コンテンツ部分 ===== */}
      <div className="p-8 space-y-8">
        
        {/* ===== 材料セクション ===== */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="w-3 h-8 bg-orange-500 rounded-full mr-3"></span>
            材料 {recipe.servings && `（${recipe.servings}人分）`}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipe.ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
              >
                <div className="w-3 h-3 bg-orange-400 rounded-full mr-3"></div>
                <span className="text-gray-800 font-medium">
                  {ingredient}
                </span>
              </div>
            ))}
          </div>
        </section>
        
        {/* ===== 作り方セクション ===== */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="w-3 h-8 bg-blue-500 rounded-full mr-3"></span>
            作り方
          </h2>
          
          <div className="space-y-6">
            {recipe.instructions.map((instruction, index) => (
              <div
                key={index}
                className="flex items-start p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 leading-relaxed text-lg">
                    {instruction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
        
      </div>
      
      {/* ===== フッターアクション ===== */}
      <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          
          {/* 成功メッセージ */}
          <div className="text-center sm:text-left">
            <p className="text-green-600 font-medium text-lg">
              🎉 レシピが完成しました！
            </p>
            <p className="text-gray-600 text-sm">
              素敵な料理をお楽しみください
            </p>
          </div>
          
          {/* 新しいレシピボタン */}
          {onCreateNew && (
            <Button
              onClick={onCreateNew}
              variant="primary"
              leftIcon={<ChefHat className="w-5 h-5" />}
              className="shadow-lg"
            >
              新しいレシピを作る
            </Button>
          )}
          
        </div>
      </div>
      
    </div>
  );
}