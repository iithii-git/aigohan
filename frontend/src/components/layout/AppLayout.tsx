/**
 * AppLayout.tsx - アプリケーション全体のクライアントレイアウト
 * 
 * 【目的】
 * Next.js App Routerのapp/layout.tsxから呼ばれる、
 * アプリケーション全体のクライアント側レイアウトコンポーネントです。
 * ヘッダー、フッター、ナビゲーション状態管理を統合します。
 * 
 * 【責任】
 * - QueryProviderの提供（React Query）
 * - ヘッダーの表示・制御
 * - フッター（タブナビゲーション）の表示・制御
 * - アクティブページの状態管理
 * - 背景とレイアウトスタイル
 */

'use client';

import { ReactNode, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import QueryProvider from '@/lib/providers/QueryProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import Header from './Header';
import Footer, { NavigationTab } from './Footer';

// ===================================================================
// 型定義
// ===================================================================

export interface AppLayoutProps {
  children: ReactNode;
}

// ===================================================================
// パス→タブのマッピング
// ===================================================================

/**
 * URLパスからアクティブタブを判定
 */
function getActiveTabFromPath(pathname: string): NavigationTab {
  if (pathname.startsWith('/recipe')) return 'recipe';
  if (pathname.startsWith('/inventory')) return 'inventory';
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname.startsWith('/profile')) return 'profile';
  return 'idea'; // デフォルトはアイデア画面
}

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * アプリケーション全体レイアウト
 * 
 * Next.js App Routerの構造に合わせて、
 * ルートレイアウトから呼ばれるクライアント側のレイアウトです。
 */
export default function AppLayout({ children }: AppLayoutProps) {
  
  // ===================================================================
  // 状態管理
  // ===================================================================
  
  /** 現在のパス */
  const pathname = usePathname();
  
  /** アクティブなナビゲーションタブ */
  const [activeTab, setActiveTab] = useState<NavigationTab>(
    getActiveTabFromPath(pathname)
  );
  
  // ===================================================================
  // イベントハンドラー
  // ===================================================================
  
  /**
   * ナビゲーションタブ変更処理
   */
  const handleTabChange = useCallback((tab: NavigationTab) => {
    setActiveTab(tab);
    
    // TODO: 将来的にはNext.js Routerでページ遷移
    console.log('ナビゲーション:', tab);
    switch (tab) {
      case 'recipe':
        console.log('レシピ画面に遷移予定');
        break;
      case 'inventory':
        console.log('在庫画面に遷移予定');
        break;
      case 'settings':
        console.log('設定画面に遷移予定');
        break;
      case 'profile':
        console.log('マイページに遷移予定');
        break;
      case 'idea':
      default:
        console.log('アイデア画面を表示');
        break;
    }
  }, []);
  
  // ===================================================================
  // レンダリング
  // ===================================================================
  
  return (
    <QueryProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
          
          {/* ヘッダー */}
          <Header title="AI Gohan" />
          
          {/* メインコンテンツ */}
          <main 
            className="max-w-4xl mx-auto px-4 py-4 pb-24"
            role="main"
          >
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          
          {/* フッター（タブナビゲーション） */}
          <Footer
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          
        </div>
      </ErrorBoundary>
    </QueryProvider>
  );
}

/*
★ Insight ─────────────────────────────────────
Next.js App Routerのベストプラクティス

1. 適切な責任分離: app/layout.tsx（サーバー）とAppLayout.tsx（クライアント）で役割を明確化
2. メタデータ管理: サーバーコンポーネントでSEO情報を管理、クライアントで状態管理
3. パフォーマンス: 必要な部分のみをクライアント側で実行

─────────────────────────────────────────────────
*/