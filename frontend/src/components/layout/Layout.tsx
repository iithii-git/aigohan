/**
 * Layout.tsx - アプリケーション全体レイアウトコンポーネント
 * 
 * 【目的】
 * AI Gohanアプリケーション全体の統一されたレイアウト構造を提供します。
 * ヘッダー、メインコンテンツ、フッター、背景などの共通要素を管理します。
 * 
 * 【特徴】
 * - レスポンシブレイアウト
 * - グラデーション背景
 * - SEO対応のセマンティックHTML
 * - アクセシビリティ考慮
 */

'use client';

import { ReactNode } from 'react';
import Header from './Header';

// ===================================================================
// 型定義
// ===================================================================

/**
 * Layoutコンポーネントのプロパティ
 */
export interface LayoutProps {
  /** メインコンテンツ */
  children: ReactNode;
  /** ヘッダーのタイトル */
  headerTitle?: string;
  /** ヘッダーのサブタイトル */
  headerSubtitle?: string;
  /** ヘッダーの右側コンテンツ */
  headerRightContent?: ReactNode;
  /** 最大幅の設定（デフォルト: 4xl） */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';
  /** カスタムクラス */
  className?: string;
}

// ===================================================================
// スタイル定義
// ===================================================================

/**
 * 最大幅のマッピング
 */
const maxWidthStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  full: 'max-w-full',
};

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * アプリケーション全体レイアウト
 * 
 * ヘッダー、メインコンテンツ、背景を統合管理します。
 * グラデーション背景でモダンなデザインを実現します。
 */
export default function Layout({
  children,
  headerTitle,
  headerSubtitle,
  headerRightContent,
  maxWidth = '4xl',
  className,
}: LayoutProps) {
  
  return (
    <div className={`min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 ${className}`}>
      
      {/* ヘッダー */}
      <Header 
        title={headerTitle}
        subtitle={headerSubtitle}
        rightContent={headerRightContent}
      />
      
      {/* メインコンテンツ */}
      <main 
        className={`${maxWidthStyles[maxWidth]} mx-auto px-4 py-8`}
        role="main"
      >
        {children}
      </main>
      
      {/* フッター */}
      <footer 
        className="bg-white/60 backdrop-blur-sm border-t border-orange-200 mt-16"
        role="contentinfo"
      >
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* アプリについて */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                AI Gohan について
              </h3>
              <p className="text-gray-600 text-sm">
                AI技術を活用して、手持ちの食材から美味しいレシピを自動生成します。
                画像から食材を認識し、最適な料理を提案します。
              </p>
            </div>
            
            {/* 主な機能 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                主な機能
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                  <span>AIレシピ生成</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  <span>画像認識機能</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>味の好み設定</span>
                </li>
              </ul>
            </div>
            
            {/* システム情報 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                システム情報
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">バージョン:</span> v1.0.0
                </div>
                <div>
                  <span className="font-medium">AI モデル:</span> Gemini 1.5 Flash
                </div>
                <div>
                  <span className="font-medium">技術:</span> Next.js + TypeScript
                </div>
              </div>
            </div>
            
          </div>
          
          {/* コピーライト */}
          <div className="border-t border-orange-200 mt-8 pt-8 text-center text-sm text-gray-600">
            <p>© 2024 AI Gohan. Powered by Google AI Studio & Next.js</p>
          </div>
        </div>
      </footer>
      
    </div>
  );
}