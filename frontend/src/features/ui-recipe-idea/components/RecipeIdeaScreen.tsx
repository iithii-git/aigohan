/**
 * RecipeIdeaScreen.tsx - レシピアイデア統合画面
 * 
 * 【目的】
 * レシピアイデア生成機能の完全なユーザー体験を提供します。
 * 食材入力、画像認識、味の設定、レシピ生成、結果表示までの
 * 全フローをページコンテンツとして管理します。
 * 
 * 【設計思想】
 * - Next.js App Routerに最適化: レイアウト責任をapp/layout.tsxに移譲
 * - 純粋なページコンテンツ: ヘッダー・フッターを含まない
 * - 単一責任の原則: 各機能コンポーネントは独立している
 * - 状態管理の集約: レシピ生成フローの状態のみを管理
 * 
 * 【主要機能】
 * - 食材管理（手動入力・画像認識）
 * - 味の好み設定
 * - AIレシピ生成
 * - 結果表示とアクション
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

// 機能コンポーネント（相対インポートで循環参照回避）
import IngredientInputSection, { type IngredientItem } from './IngredientInputSection';
import ImageUploadModal from './ImageUploadModal';
import TasteProfileSelector, { type TasteProfile } from './TasteProfileSelector';
import GenerateRecipeButton from './GenerateRecipeButton';

import { 
  RecipeDisplay,
  type RecipeDisplayProps
} from '@/features/ui-recipe-view';

// フック
import { 
  useRecipeGeneration, 
  useImageUpload, 
  useApiErrorHandling 
} from '@/hooks';

// 型定義
import { RecipeWithMetadata, RecipeGenerationRequest } from '@/types/api';

// ===================================================================
// 型定義
// ===================================================================

/**
 * アプリケーション全体の状態
 */
interface AppState {
  /** 現在のステップ */
  currentStep: 'input' | 'generating' | 'result';
  /** 生成されたレシピ */
  generatedRecipe: RecipeWithMetadata | null;
  /** エラーメッセージ */
  error: string | null;
}

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * レシピアイデア統合画面
 * 
 * Next.js App Routerベストプラクティスに従った設計：
 * - app/layout.tsxでアプリ全体構造を管理
 * - ページコンポーネントは純粋にコンテンツに集中
 * - 各機能コンポーネントの独立性とテスト容易性を維持
 * - レシピ生成フローの状態管理を集約
 */
export default function RecipeIdeaScreen() {
  
  // ===================================================================
  // 状態管理
  // ===================================================================
  
  /** アプリケーション全体状態 */
  const [appState, setAppState] = useState<AppState>({
    currentStep: 'input',
    generatedRecipe: null,
    error: null,
  });
  
  /** 食材リスト */
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  
  /** 味の好み設定 */
  const [tasteProfile, setTasteProfile] = useState<TasteProfile>({
    style: 'ふつう',
    intensity: 3,
    duration: '30分以内',
  });
  
  /** 画像アップロードモーダル表示状態 */
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  // ===================================================================
  // フック
  // ===================================================================
  
  /** レシピ生成 */
  const recipeGeneration = useRecipeGeneration();
  
  /** 画像アップロード管理 */
  const imageUpload = useImageUpload({
    maxFiles: 5,
    maxSizeInMB: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });
  
  /** エラーハンドリング */
  const { formatErrorMessage } = useApiErrorHandling();
  
  // ===================================================================
  // イベントハンドラー
  // ===================================================================
  
  /**
   * 食材追加（画像認識結果から）
   */
  const handleImageIngredientsAdd = useCallback((recognizedIngredients: string[]) => {
    const newIngredients = recognizedIngredients.map((name, index) => ({
      id: `image-${Date.now()}-${index}`,
      name: name.trim(),
      source: 'image' as const,
    }));
    
    // 重複チェック
    const existingNames = ingredients.map(item => item.name.toLowerCase());
    const uniqueIngredients = newIngredients.filter(
      newItem => !existingNames.includes(newItem.name.toLowerCase())
    );
    
    setIngredients(prev => [...prev, ...uniqueIngredients]);
    
    // 画像をクリア
    imageUpload.clearImages();
    setIsImageModalOpen(false);
    
    console.log('Added ingredients from image:', uniqueIngredients.map(i => i.name));
  }, [ingredients, imageUpload]);
  
  /**
   * 画像選択完了処理
   */
  const handleImagesSelected = useCallback(async (files: FileList) => {
    try {
      // 画像をアップロード管理に追加
      await imageUpload.addImages(files);
      
      // TODO: 実際のAI画像解析APIを呼び出し
      // 現在はデモ用の模擬データ
      setTimeout(() => {
        const mockIngredients = ['トマト', 'たまねぎ', 'にんじん', 'じゃがいも'];
        handleImageIngredientsAdd(mockIngredients);
      }, 2000);
      
    } catch (error) {
      console.error('画像処理エラー:', error);
      setAppState(prev => ({
        ...prev,
        error: '画像の処理中にエラーが発生しました'
      }));
    }
  }, [imageUpload, handleImageIngredientsAdd]);
  
  /**
   * レシピ生成実行
   */
  const handleGenerateRecipe = useCallback(async () => {
    if (ingredients.length === 0) return;
    
    setAppState(prev => ({
      ...prev,
      currentStep: 'generating',
      error: null,
    }));
    
    try {
      const request: RecipeGenerationRequest = {
        ingredients: ingredients.map(item => item.name),
        preferences: `味のスタイル: ${tasteProfile.style}, 濃さ: ${tasteProfile.intensity}/5, 調理時間: ${tasteProfile.duration}`,
      };
      
      const response = await recipeGeneration.mutateAsync(request);
      
      if (response.success && response.data) {
        const recipeWithMetadata: RecipeWithMetadata = {
          ...response.data,
          id: `recipe-${Date.now()}`,
          createdAt: new Date().toISOString(),
          isFavorite: false,
        };
        
        setAppState(prev => ({
          ...prev,
          currentStep: 'result',
          generatedRecipe: recipeWithMetadata,
          error: null,
        }));
        
      } else {
        throw new Error(response.error?.message || 'レシピ生成に失敗しました');
      }
      
    } catch (error) {
      console.error('レシピ生成エラー:', error);
      setAppState(prev => ({
        ...prev,
        currentStep: 'input',
        error: formatErrorMessage(error),
      }));
    }
  }, [ingredients, tasteProfile, recipeGeneration, formatErrorMessage]);
  
  /**
   * 新しいレシピ作成開始
   */
  const handleCreateNewRecipe = useCallback(() => {
    setAppState({
      currentStep: 'input',
      generatedRecipe: null,
      error: null,
    });
    setIngredients([]);
    setTasteProfile({
      style: 'ふつう',
      intensity: 3,
      duration: '30分以内',
    });
  }, []);
  
  /**
   * レシピ共有処理
   */
  const handleShareRecipe = useCallback((recipe: RecipeWithMetadata) => {
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // フォールバック: クリップボードにコピー
      navigator.clipboard?.writeText(
        `${recipe.title}\n\n${recipe.description}\n\n材料:\n${recipe.ingredients.join('\n')}`
      );
    }
  }, []);
  
  
  // ===================================================================
  // エフェクト
  // ===================================================================
  
  /**
   * エラー自動クリア
   */
  useEffect(() => {
    if (appState.error) {
      const timer = setTimeout(() => {
        setAppState(prev => ({ ...prev, error: null }));
      }, 10000); // 10秒後に自動クリア
      
      return () => clearTimeout(timer);
    }
  }, [appState.error]);
  
  // ===================================================================
  // レンダリング
  // ===================================================================
  
  return (
    <div className="space-y-8">
        
        {/* ===== エラー表示 ===== */}
        {appState.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 font-medium">{appState.error}</p>
          </div>
        )}
        
        {/* ===== 入力ステップ ===== */}
        {appState.currentStep === 'input' && (
          <>
            {/* 食材入力セクション */}
            <IngredientInputSection
              ingredients={ingredients}
              onIngredientsChange={setIngredients}
              onImageUploadClick={() => setIsImageModalOpen(true)}
              maxIngredients={50}
              disabled={recipeGeneration.isPending}
            />
            
            {/* 味の好み設定 */}
            <TasteProfileSelector
              value={tasteProfile}
              onChange={setTasteProfile}
              disabled={recipeGeneration.isPending}
            />
            
            {/* レシピ生成ボタン */}
            <GenerateRecipeButton
              onClick={handleGenerateRecipe}
              ingredientCount={ingredients.length}
              isLoading={recipeGeneration.isPending}
              disabled={ingredients.length === 0}
            />
          </>
        )}
        
        {/* ===== 生成中ステップ ===== */}
        {appState.currentStep === 'generating' && (
          <div className="text-center py-16">
            <div className="animate-spin w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              レシピを生成中...
            </h2>
            <p className="text-gray-600">
              {ingredients.length}個の食材から最適なレシピを考案しています
            </p>
          </div>
        )}
        
        {/* ===== 結果表示ステップ ===== */}
        {appState.currentStep === 'result' && appState.generatedRecipe && (
          <RecipeDisplay
            recipe={appState.generatedRecipe}
            onCreateNew={handleCreateNewRecipe}
            onShare={handleShareRecipe}
          />
        )}
        
        {/* ===== 画像アップロードモーダル ===== */}
        <ImageUploadModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          onImagesSelected={handleImagesSelected}
          isUploading={imageUpload.isLoading}
          maxFiles={5}
          maxSizeInMB={10}
        />
      </div>
  );
}

/*
★ Insight ─────────────────────────────────────
コンポーネント分割によるアーキテクチャ改善

1. 単一責任の原則: 各コンポーネントが明確な責任を持ち、独立してテスト・保守可能
2. 状態管理の集約: 親コンポーネントで全体フローを管理し、子コンポーネントは純粋な表示・操作に専念
3. 再利用性の向上: 分離されたコンポーネントは他の画面でも使用可能

─────────────────────────────────────────────────
*/
