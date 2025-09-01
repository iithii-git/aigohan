/**
 * GenerateRecipeButton.tsx - レシピ生成ボタンコンポーネント
 * 
 * 【目的】
 * レシピ生成のメインアクションボタンです。
 * 食材の有無チェック、ローディング状態表示、エラーハンドリングを統合し、
 * ユーザーにとって分かりやすい操作体験を提供します。
 * 
 * 【機能】
 * - 動的な無効化制御
 * - ローディングアニメーション
 * - 進捗状況の表示
 * - アクセシビリティ対応
 */

'use client';

import { ChefHat } from 'lucide-react';
import Button from '@/components/ui/Button';

// ===================================================================
// 型定義
// ===================================================================

/**
 * GenerateRecipeButtonコンポーネントのプロパティ
 */
export interface GenerateRecipeButtonProps {
  /** レシピ生成ボタンクリック時のコールバック */
  onClick: () => void;
  /** 現在の食材数 */
  ingredientCount: number;
  /** ローディング状態 */
  isLoading?: boolean;
  /** 無効化状態 */
  disabled?: boolean;
  /** カスタムクラス */
  className?: string;
}

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * レシピ生成ボタン
 * 
 * アプリケーションのメインアクションボタンです。
 * 視覚的に目立つデザインで、ユーザーの注意を引きつけます。
 */
export default function GenerateRecipeButton({
  onClick,
  ingredientCount,
  isLoading = false,
  disabled = false,
  className,
}: GenerateRecipeButtonProps) {
  
  // ===================================================================
  // 状態計算
  // ===================================================================
  
  /** ボタンを無効化するかどうか */
  const isDisabled = disabled || ingredientCount === 0 || isLoading;
  
  /** 表示するメッセージ */
  const getButtonText = () => {
    if (isLoading) return 'レシピを作成中...';
    if (ingredientCount === 0) return 'AIでレシピを作る';
    return 'AIでレシピを作る';
  };
  
  /** 表示するアイコン */
  const getButtonIcon = () => {
    if (isLoading) {
      return (
        <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
      );
    }
    return <ChefHat className="w-6 h-6" />;
  };
  
  // ===================================================================
  // レンダリング
  // ===================================================================
  
  return (
    <div className={`text-center space-y-4 ${className}`}>
      
      {/* ===== メインボタン ===== */}
      <Button
        onClick={onClick}
        disabled={isDisabled}
        loading={isLoading}
        leftIcon={!isLoading ? <ChefHat className="w-6 h-6" /> : undefined}
        className={`
          w-full max-w-md mx-auto h-14 text-lg font-bold shadow-2xl
          transform transition-all duration-300 ease-out
          ${!isDisabled ? 'hover:scale-105 hover:shadow-3xl active:scale-95' : ''}
          ${isLoading ? 'cursor-wait' : ''}
        `}
        aria-label={
          isLoading 
            ? 'レシピを生成中です。しばらくお待ちください。' 
            : `${ingredientCount}個の食材からレシピを生成します`
        }
      >
        {getButtonText()}
      </Button>
      
      {/* ===== 状態メッセージ ===== */}
      <div className="space-y-2">
        {ingredientCount === 0 ? (
          /* 食材未追加時のメッセージ */
          <p className="text-sm text-gray-500">
            食材を追加するとレシピを作成できます
          </p>
        ) : isLoading ? (
          /* ローディング中のメッセージ */
          <div className="space-y-1">
            <p className="text-sm text-orange-600 font-medium">
              {ingredientCount}個の食材からレシピを生成中...
            </p>
            <div className="w-48 mx-auto bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full animate-pulse"
                style={{ width: '60%' }}
              ></div>
            </div>
          </div>
        ) : (
          /* 通常状態のメッセージ */
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              {ingredientCount}個の食材からレシピを作成します
            </p>
            <p className="text-xs text-gray-500">
              💡 より詳細なレシピを生成するために、味の好みも設定してみてください
            </p>
          </div>
        )}
      </div>
      
      {/* ===== 追加情報（ローディング中のみ） ===== */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
          <div className="flex items-start space-x-3">
            <div className="animate-bounce">🤖</div>
            <div className="text-left">
              <p className="text-sm font-medium text-blue-800 mb-1">
                AI が作業中です
              </p>
              <p className="text-xs text-blue-600">
                食材の組み合わせを分析し、最適なレシピを考案しています...
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* ===== 成功の効果音・振動対応（将来拡張用） ===== */}
      {/* PWA対応時にvibrationやnotificationを追加予定 */}
      
    </div>
  );
}