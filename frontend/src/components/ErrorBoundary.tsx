/**
 * ErrorBoundary.tsx - エラーバウンダリーコンポーネント
 * 
 * 【目的】
 * React のエラーバウンダリーを実装し、アプリケーション全体の
 * エラーを適切にキャッチして表示します。
 * 
 * 【機能】
 * - JavaScript エラーをキャッチ
 * - ユーザーフレンドリーなエラー表示
 * - リフレッシュボタンの提供
 * - 開発環境でのエラー詳細表示
 */

'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

// ===================================================================
// 型定義
// ===================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * アプリケーション全体のエラーバウンダリー
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // エラーが発生した場合の状態更新
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーログの記録
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 本来ならここでエラー監視サービス（Sentry等）に送信
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    // ページをリロード
    window.location.reload();
  };

  handleReset = () => {
    // エラー状態をリセット
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバック表示が指定されている場合
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラー画面
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
            
            {/* エラーアイコン */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">😵</span>
            </div>
            
            {/* エラーメッセージ */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              問題が発生しました
            </h1>
            
            <p className="text-gray-600 mb-8">
              申し訳ございません。アプリケーションでエラーが発生しました。
              ページを再読み込みしてお試しください。
            </p>
            
            {/* アクションボタン */}
            <div className="space-y-3">
              <Button
                onClick={this.handleReload}
                leftIcon={<RefreshCw className="w-5 h-5" />}
                className="w-full"
              >
                ページを再読み込み
              </Button>
              
              <Button
                onClick={this.handleReset}
                variant="secondary"
                className="w-full"
              >
                再試行
              </Button>
            </div>
            
            {/* 開発環境での詳細表示 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer mb-2">
                  技術的な詳細 (開発環境のみ表示)
                </summary>
                <div className="bg-gray-100 rounded-lg p-4 text-xs">
                  <div className="font-mono text-red-600 mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <pre className="whitespace-pre-wrap text-gray-700">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}
            
          </div>
        </div>
      );
    }

    // 正常時は子コンポーネントを表示
    return this.props.children;
  }
}