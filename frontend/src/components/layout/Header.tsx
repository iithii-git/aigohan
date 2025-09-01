/**
 * Header.tsx - アプリケーションヘッダーコンポーネント
 * 
 * 【目的】
 * AI Gohanアプリケーションの統一されたヘッダーUIを提供します。
 * ブランドロゴ、ナビゲーション、ユーザーアクションなどを含みます。
 * 
 * 【特徴】
 * - スティッキーヘッダー対応
 * - モバイル・デスクトップレスポンシブ
 * - ブランドアイデンティティの統一
 * - 背景ブラー効果
 */

'use client';

import { ChefHat } from 'lucide-react';

// ===================================================================
// 型定義
// ===================================================================

/**
 * Headerコンポーネントのプロパティ
 */
export interface HeaderProps {
  /** ヘッダーのタイトル（デフォルト: "AI Gohan"） */
  title?: string;
  /** ヘッダーのサブタイトル */
  subtitle?: string;
  /** 右側に表示する追加要素 */
  rightContent?: React.ReactNode;
  /** カスタムクラス */
  className?: string;
}

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * アプリケーションヘッダー
 * 
 * ブランドロゴとタイトルを表示する統一されたヘッダーです。
 * 背景にブラー効果を適用してモダンなデザインを実現します。
 */
export default function Header({
  title = "AI Gohan",
  subtitle = "レシピを構想しましょう",
  rightContent,
  className,
}: HeaderProps) {
  
  return (
    <header className={`
      bg-white/80 backdrop-blur-sm border-b border-orange-200 
      sticky top-0 z-10 transition-all duration-300
      ${className}
    `}>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          
          {/* 左側: ブランドロゴとタイトル */}
          <div className="flex items-center space-x-3">
            
            {/* ブランドアイコン */}
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl shadow-lg">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            
            {/* タイトル・サブタイトル */}
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
            
          </div>
          
          {/* 右側: 追加コンテンツ */}
          {rightContent && (
            <div className="flex items-center">
              {rightContent}
            </div>
          )}
          
        </div>
      </div>
    </header>
  );
}