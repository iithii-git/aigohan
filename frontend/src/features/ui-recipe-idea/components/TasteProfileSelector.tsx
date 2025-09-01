/**
 * TasteProfileSelector.tsx - 味の好み設定コンポーネント
 * 
 * 【目的】
 * ユーザーの味の好みを設定するためのUIコンポーネントです。
 * セグメントコントロール、スライダー、ラジオボタンを組み合わせて
 * 直感的な味の設定インターフェースを提供します。
 * 
 * 【機能】
 * - 味のスタイル選択（セグメントコントロール）
 * - 味の濃さ設定（カスタムスライダー）
 * - 調理時間選択（ラジオボタン）
 * - レスポンシブデザイン
 */

'use client';

import { useState, useCallback } from 'react';

// ===================================================================
// 型定義
// ===================================================================

/**
 * 味のスタイル選択肢
 */
export type TasteStyle = 'あっさり' | 'ふつう' | 'しっかり';

/**
 * 調理時間選択肢
 */
export type CookingDuration = '15分以内' | '30分以内' | 'じっくり';

/**
 * 味の好み設定の状態
 */
export interface TasteProfile {
  style: TasteStyle;
  intensity: number; // 1-5のスライダー値
  duration: CookingDuration;
}

/**
 * TasteProfileSelectorコンポーネントのプロパティ
 */
export interface TasteProfileSelectorProps {
  /** 現在の味の好み設定 */
  value: TasteProfile;
  /** 設定変更時のコールバック */
  onChange: (profile: TasteProfile) => void;
  /** 無効化状態 */
  disabled?: boolean;
  /** カスタムクラス */
  className?: string;
}

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * 味の好み設定セレクター
 * 
 * ユーザーの味の好みを設定するための統合UIです。
 * 3つの異なる入力方法を組み合わせて直感的な操作を実現します。
 */
export default function TasteProfileSelector({
  value,
  onChange,
  disabled = false,
  className,
}: TasteProfileSelectorProps) {
  
  // ===================================================================
  // イベントハンドラー
  // ===================================================================
  
  /**
   * 味のスタイル変更処理
   */
  const handleStyleChange = useCallback((style: TasteStyle) => {
    if (disabled) return;
    onChange({ ...value, style });
  }, [value, onChange, disabled]);
  
  /**
   * 味の濃さ変更処理
   */
  const handleIntensityChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const intensity = parseInt(event.target.value);
    onChange({ ...value, intensity });
  }, [value, onChange, disabled]);
  
  /**
   * 調理時間変更処理
   */
  const handleDurationChange = useCallback((duration: CookingDuration) => {
    if (disabled) return;
    onChange({ ...value, duration });
  }, [value, onChange, disabled]);
  
  // ===================================================================
  // レンダリング
  // ===================================================================
  
  return (
    <div className={`bg-white rounded-3xl shadow-lg p-6 md:p-8 ${className}`}>
      
      {/* ===== セクションヘッダー ===== */}
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        どんな味付けがいい？
      </h2>
      
      <div className="space-y-8">
        
        {/* ===== 味のスタイル（セグメントコントロール） ===== */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            味のスタイル
          </h3>
          <div className="flex bg-gray-100 rounded-2xl p-1">
            {(['あっさり', 'ふつう', 'しっかり'] as TasteStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => handleStyleChange(style)}
                disabled={disabled}
                className={`
                  flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200
                  disabled:cursor-not-allowed disabled:opacity-50
                  ${value.style === style
                    ? 'bg-white text-orange-600 shadow-sm transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }
                `}
                aria-pressed={value.style === style}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
        
        {/* ===== 味の濃さ（スライダー） ===== */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            味の濃さ
          </h3>
          <div className="space-y-4">
            
            {/* カスタムスライダー */}
            <input
              type="range"
              min="1"
              max="5"
              value={value.intensity}
              onChange={handleIntensityChange}
              disabled={disabled}
              className={`
                w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                transition-opacity duration-200
                disabled:cursor-not-allowed disabled:opacity-50
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-6 
                [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:bg-orange-500 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-6 
                [&::-moz-range-thumb]:h-6 
                [&::-moz-range-thumb]:bg-orange-500
                [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:border-none 
                [&::-moz-range-thumb]:cursor-pointer
              `}
              aria-label="味の濃さを設定"
            />
            
            {/* スライダーラベル */}
            <div className="flex justify-between text-sm text-gray-600">
              <span>薄め</span>
              <span className="font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                {value.intensity}/5
              </span>
              <span>濃いめ</span>
            </div>
            
          </div>
        </div>
        
        {/* ===== 調理時間（ラジオボタン） ===== */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            調理時間
          </h3>
          <div className="space-y-3">
            {(['15分以内', '30分以内', 'じっくり'] as CookingDuration[]).map((duration) => (
              <label
                key={duration}
                className={`
                  flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200
                  hover:bg-gray-50 group
                  ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                  ${value.duration === duration ? 'bg-orange-50 border-2 border-orange-200' : 'border-2 border-transparent'}
                `}
              >
                {/* ラジオボタン */}
                <input
                  type="radio"
                  name="cooking-duration"
                  value={duration}
                  checked={value.duration === duration}
                  onChange={() => handleDurationChange(duration)}
                  disabled={disabled}
                  className="w-5 h-5 text-orange-600 focus:ring-orange-500 focus:ring-offset-2"
                />
                
                {/* ラベルテキスト */}
                <span className={`
                  font-medium transition-colors
                  ${value.duration === duration ? 'text-orange-700' : 'text-gray-700 group-hover:text-gray-900'}
                `}>
                  {duration}
                </span>
                
                {/* 説明テキスト */}
                <span className="text-xs text-gray-500 ml-auto">
                  {duration === '15分以内' && '手軽に'}
                  {duration === '30分以内' && '程よく'}
                  {duration === 'じっくり' && '時間をかけて'}
                </span>
                
              </label>
            ))}
          </div>
        </div>
        
      </div>
      
      {/* ===== 設定サマリー ===== */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="bg-orange-50 p-4 rounded-xl">
          <h4 className="text-sm font-medium text-orange-800 mb-2">
            📋 現在の設定
          </h4>
          <p className="text-sm text-orange-700">
            <span className="font-medium">{value.style}</span>で
            <span className="font-medium">濃さ{value.intensity}/5</span>、
            <span className="font-medium">{value.duration}</span>で調理
          </p>
        </div>
      </div>
      
    </div>
  );
}