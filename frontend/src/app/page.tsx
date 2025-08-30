'use client';

import { useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import ImageUpload from '@/components/ImageUpload';
import IngredientManager from '@/components/IngredientManager';
import SimpleIngredientManager from '@/components/SimpleIngredientManager';
import RecipeManager from '@/components/RecipeManager';
import { ChefHat, ImageIcon, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { Recipe } from '@/types/api';

// ステップの状態管理
type Step = 'upload' | 'ingredients' | 'recipe' | 'complete';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);

  // 画像アップロード完了時
  const handleImagesUploaded = useCallback((images: File[]) => {
    setUploadedImages(images);
    if (images.length > 0) {
      setCurrentStep('ingredients');
    }
  }, []);

  // 食材変更時
  const handleIngredientsChange = useCallback((newIngredients: string[]) => {
    console.log('食材更新:', newIngredients); // デバッグログ
    setIngredients(newIngredients);
  }, []);

  // レシピ生成完了時
  const handleRecipeGenerated = useCallback((recipe: Recipe) => {
    setGeneratedRecipe(recipe);
    setCurrentStep('complete');
  }, []);

  // ステップリセット
  const handleReset = useCallback(() => {
    setCurrentStep('upload');
    setUploadedImages([]);
    setIngredients([]);
    setGeneratedRecipe(null);
  }, []);

  // ステップ進行
  const handleProceedToRecipe = useCallback(() => {
    if (ingredients.length > 0) {
      setCurrentStep('recipe');
    }
  }, [ingredients.length]);

  // ステップインジケーター
  const steps = [
    { key: 'upload', label: '画像アップロード', icon: ImageIcon },
    { key: 'ingredients', label: '食材管理', icon: Sparkles },
    { key: 'recipe', label: 'レシピ生成', icon: ChefHat },
    { key: 'complete', label: '完了', icon: CheckCircle },
  ];

  const getStepIndex = (step: Step) => steps.findIndex(s => s.key === step);
  const currentStepIndex = getStepIndex(currentStep);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl shadow-2xl">
              <ChefHat className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-yellow-600 to-red-600 bg-clip-text text-transparent">
            AI Gohan
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            手持ちの食材から、AIが最適なレシピを提案します
          </p>
        </div>

        {/* ステップインジケーター */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-4 mb-8">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                    ${isActive ? 'bg-orange-500 border-orange-500 text-white' : 
                      isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                      'bg-gray-100 border-gray-300 text-gray-500'}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {index < steps.length - 1 && (
                    <ArrowRight className={`
                      w-6 h-6 mx-2 transition-colors duration-300
                      ${index < currentStepIndex ? 'text-green-500' : 'text-gray-300'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {steps[currentStepIndex]?.label}
            </p>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="space-y-8">
          {/* ステップ1: 画像アップロード */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <ImageUpload
                onImagesChange={handleImagesUploaded}
                maxFiles={10}
                disabled={false}
              />
              
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  画像をアップロードしたら、次のステップに進みます
                </p>
                
                {/* スキップオプション */}
                <button
                  onClick={() => setCurrentStep('ingredients')}
                  className="text-orange-600 hover:text-orange-700 underline text-sm"
                >
                  画像なしで食材入力から開始する →
                </button>
              </div>
            </div>
          )}

          {/* ステップ2: 食材管理 */}
          {currentStep === 'ingredients' && (
            <div className="space-y-6">
              <SimpleIngredientManager
                onIngredientsChange={handleIngredientsChange}
                maxIngredients={50}
              />

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ← 戻る
                </button>

                <button
                  onClick={handleProceedToRecipe}
                  disabled={ingredients.length === 0}
                  className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  レシピを生成する →
                </button>
              </div>
            </div>
          )}

          {/* ステップ3: レシピ生成 */}
          {currentStep === 'recipe' && (
            <div className="space-y-6">
              <RecipeManager
                ingredients={ingredients}
                images={uploadedImages}
                onRecipeGenerated={handleRecipeGenerated}
                showProgress={true}
                enableAutoSave={true}
              />

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep('ingredients')}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ← 食材を編集
                </button>
              </div>
            </div>
          )}

          {/* ステップ4: 完了 */}
          {currentStep === 'complete' && generatedRecipe && (
            <div className="space-y-6">
              <div className="text-center py-8 bg-green-50 rounded-2xl border border-green-200">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800 mb-2">
                  レシピが完成しました！
                </h2>
                <p className="text-green-700">
                  美味しい料理を楽しんでください
                </p>
              </div>

              <RecipeManager
                ingredients={ingredients}
                images={uploadedImages}
                onRecipeGenerated={handleRecipeGenerated}
                showProgress={true}
                enableAutoSave={true}
              />

              <div className="flex justify-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  新しいレシピを作る
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 進捗サマリー */}
        {(ingredients.length > 0 || uploadedImages.length > 0) && (
          <div className="mt-12 p-6 bg-gray-50 rounded-2xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">現在の進捗</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${uploadedImages.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>画像: {uploadedImages.length}枚</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${ingredients.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>食材: {ingredients.length}個</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${generatedRecipe ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>レシピ: {generatedRecipe ? '生成完了' : '未生成'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
