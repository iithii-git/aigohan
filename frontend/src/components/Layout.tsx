'use client';

import { ReactNode } from 'react';
import { ChefHat, Heart, Info } from 'lucide-react';
import { useHealthCheck } from '@/hooks/useRecipeGeneration';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: healthData, isError: isHealthError } = useHealthCheck();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ロゴとタイトル */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                  AI Gohan
                </h1>
                <p className="text-sm text-gray-600">AI料理レシピ生成</p>
              </div>
            </div>

            {/* ステータスインジケーター */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div 
                  className={`w-3 h-3 rounded-full ${
                    isHealthError ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  title={isHealthError ? 'APIオフライン' : 'API正常稼働中'}
                />
                <span className="text-sm text-gray-600">
                  {isHealthError ? 'オフライン' : '稼働中'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* フッター */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-orange-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

            {/* 機能 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                主な機能
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <ChefHat className="w-4 h-4 text-orange-500" />
                  <span>AIレシピ生成</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>画像認識機能</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span>詳細な調理手順</span>
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
                  <span className="font-medium">ステータス:</span>{' '}
                  <span className={isHealthError ? 'text-red-600' : 'text-green-600'}>
                    {isHealthError ? '接続エラー' : '正常稼働'}
                  </span>
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