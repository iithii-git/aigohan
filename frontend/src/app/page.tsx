/**
 * page.tsx - AI Gohanアプリケーションのメインページ
 * 
 * 【アーキテクチャ改善】
 * - モノリシックコンポーネントから機能分割アーキテクチャに移行
 * - 新しいRecipeIdeaScreenコンポーネントを使用（コンポーネント統合型）
 * - 単一責任の原則に基づいた設計
 * 
 * 【コンポーネント分割による利点】
 * - テスト容易性の向上
 * - 保守性とスケーラビリティの改善
 * - 各機能の独立性確保
 * - 再利用可能なコンポーネント設計
 */

'use client';

import RecipeIdeaScreen from '@/features/ui-recipe-idea/components/RecipeIdeaScreen';

/**
 * ホームページコンポーネント
 * 
 * 機能分割されたコンポーネント群を統合したRecipeIdeaScreenを表示します。
 * 各機能が独立したコンポーネントとして実装され、統合画面で連携動作します。
 */
export default function Home() {
  return <RecipeIdeaScreen />;
}
