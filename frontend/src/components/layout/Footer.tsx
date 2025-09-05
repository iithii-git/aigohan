/**
 * Footer.tsx - アプリケーションフッター（ボトムナビゲーション）
 * 
 * 【目的】
 * アプリケーションのメインナビゲーションをフッターとして提供します。
 * 画面下部に固定表示され、モバイルファーストなタブ形式で
 * 主要な画面への遷移を可能にします。
 * 
 * 【機能】
 * - 5つの主要画面への遷移
 * - 現在のページのハイライト表示
 * - アクセシビリティ対応
 * - Safe Area対応のレスポンシブデザイン
 */

'use client';

import { useState } from 'react';
import { 
  Lightbulb, 
  ChefHat, 
  Package, 
  Settings, 
  User 
} from 'lucide-react';

// ===================================================================
// 型定義
// ===================================================================

/**
 * ナビゲーション項目の型定義
 */
export type NavigationTab = 'idea' | 'recipe' | 'inventory' | 'settings' | 'profile';

/**
 * ナビゲーション項目の設定
 */
interface NavigationItem {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
  href?: string;
  isMain?: boolean;
}

/**
 * Footerコンポーネントのプロパティ
 */
export interface FooterProps {
  /** 現在アクティブなタブ */
  activeTab?: NavigationTab;
  /** タブ変更時のコールバック */
  onTabChange?: (tab: NavigationTab) => void;
  /** カスタムクラス */
  className?: string;
}

// ===================================================================
// ナビゲーション設定
// ===================================================================

/**
 * ナビゲーション項目の定義
 */
const navigationItems: NavigationItem[] = [
  {
    id: 'recipe',
    label: 'レシピ',
    icon: <ChefHat className="w-6 h-6" />,
  },
  {
    id: 'inventory',
    label: '在庫',
    icon: <Package className="w-6 h-6" />,
  },
  {
    id: 'idea',
    label: 'アイデア',
    icon: <Lightbulb className="w-7 h-7" />,
    isMain: true, // メイン項目（中央、大きく表示）
  },
  {
    id: 'settings',
    label: '設定',
    icon: <Settings className="w-6 h-6" />,
  },
  {
    id: 'profile',
    label: 'マイページ',
    icon: <User className="w-6 h-6" />,
  },
];

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * アプリケーションフッター（タブナビゲーション）
 * 
 * レイアウトのフッター部分として、モバイルファーストなタブナビゲーションを提供します。
 * 中央のアイデア画面が強調表示され、メイン機能であることを示します。
 */
export default function Footer({
  activeTab = 'idea',
  onTabChange,
  className,
}: FooterProps) {
  
  /**
   * タブクリック処理
   */
  const handleTabClick = (tab: NavigationTab) => {
    onTabChange?.(tab);
  };
  
  return (
    <footer 
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-white/95 backdrop-blur-sm border-t border-gray-200
        safe-area-padding-bottom
        ${className}
      `}
      role="contentinfo"
    >
      <nav className="h-full">
      <div className="max-w-screen-sm mx-auto">
        <div className="flex items-center justify-around px-2 py-2">
          
          {navigationItems.map((item) => {
            const isActive = activeTab === item.id;
            const isMain = item.isMain;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`
                  flex flex-col items-center justify-center p-2 min-w-0 flex-1
                  transition-all duration-200 ease-out rounded-2xl
                  ${isMain 
                    ? `transform ${isActive ? 'scale-110' : 'scale-105'} ${
                        isActive 
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' 
                          : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                      }`
                    : `${
                        isActive 
                          ? 'text-orange-600 bg-orange-50' 
                          : 'text-gray-500 hover:text-orange-500 hover:bg-gray-50'
                      }`
                  }
                `}
                aria-label={`${item.label}に移動`}
              >
                
                {/* アイコン */}
                <div className={`
                  flex items-center justify-center mb-1
                  ${isMain ? 'mb-2' : ''}
                  ${isActive && !isMain ? 'transform scale-110' : ''}
                `}>
                  {item.icon}
                </div>
                
                {/* ラベル */}
                <span className={`
                  text-xs font-medium leading-tight text-center
                  ${isMain ? 'text-sm' : ''}
                  ${isActive ? 'font-semibold' : ''}
                `}>
                  {item.label}
                </span>
                
                {/* アクティブインジケーター（メイン以外） */}
                {isActive && !isMain && (
                  <div className="w-1 h-1 bg-orange-500 rounded-full mt-1"></div>
                )}
                
              </button>
            );
          })}
          
        </div>
      </div>
      
      {/* Safe areaサポート用のパディング */}
      <div className="h-safe-area-inset-bottom bg-white/95"></div>
      </nav>
    </footer>
  );
}

/*
★ Insight ─────────────────────────────────────
モバイルファーストナビゲーション設計

1. 中央強調デザイン: アイデア画面を中央に配置し、メイン機能であることを視覚的に示す
2. アクセシビリティ: aria-labelと適切なコントラストでスクリーンリーダー対応
3. Safe Area対応: iPhone X以降のホームインジケータエリアを考慮した設計

─────────────────────────────────────────────────
*/