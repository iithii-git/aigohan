/**
 * TasteProfileSelector.tsx - 味の好み設定コンポーネント
 * 
 * 【目的】
 * ユーザーの気分や好みを設定するためのUIコンポーネントです。
 * 統一されたセグメントコントロールで
 * シンプルで直感的な設定インターフェースを提供します。
 * 
 * 【機能】
 * - 味のスタイル選択（セグメントコントロール）
 * - 味の濃さ設定（セグメントコントロール）
 * - 調理時間選択（セグメントコントロール）
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
export type TasteStyle = 'あっさり' | '普通' | 'こってり';

/**
 * 味の濃さ選択肢
 */
export type TasteIntensity = '薄め' | '普通' | '濃いめ';

/**
 * 調理時間選択肢
 */
export type CookingDuration = '早く' | '気にしない';

/**
 * 味の好み設定の状態
 */
export interface TasteProfile {
  style: TasteStyle;
  intensity: TasteIntensity; // セグメントコントロール値
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
  const handleIntensityChange = useCallback((intensity: TasteIntensity) => {
    if (disabled) return;
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
    <div className={`bg-white rounded-3xl shadow-lg p-4 md:p-5 ${className}`}>
      
      {/* ===== セクションヘッダー ===== */}
      <h2 className="text-xl font-bold text-gray-900 mb-3">
        どんな気分？
      </h2>
      
      <div className="space-y-4">
        
        {/* ===== 味のスタイル（セグメントコントロール） ===== */}
        <div>
          <div className="flex bg-gray-100 rounded-2xl p-1">
            {(['あっさり', '普通', 'こってり'] as TasteStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => handleStyleChange(style)}
                disabled={disabled}
                className={`
                  flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-all duration-200
                  disabled:cursor-not-allowed disabled:opacity-50
                  ${value.style === style
                    ? 'bg-white text-orange-600 shadow-sm'
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
        
        {/* ===== 味の濃さ（セグメントコントロール） ===== */}
        <div>
          <div className="flex bg-gray-100 rounded-2xl p-1">
            {(['薄め', '普通', '濃いめ'] as TasteIntensity[]).map((intensity) => (
              <button
                key={intensity}
                onClick={() => handleIntensityChange(intensity)}
                disabled={disabled}
                className={`
                  flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-all duration-200
                  disabled:cursor-not-allowed disabled:opacity-50
                  ${value.intensity === intensity
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }
                `}
                aria-pressed={value.intensity === intensity}
              >
                {intensity}
              </button>
            ))}
          </div>
        </div>
        
        {/* ===== 調理時間（セグメントコントロール） ===== */}
        <div>
          <div className="flex bg-gray-100 rounded-2xl p-1">
            {(['早く', '気にしない'] as CookingDuration[]).map((duration) => (
              <button
                key={duration}
                onClick={() => handleDurationChange(duration)}
                disabled={disabled}
                className={`
                  flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-all duration-200
                  disabled:cursor-not-allowed disabled:opacity-50
                  ${value.duration === duration
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }
                `}
                aria-pressed={value.duration === duration}
              >
                {duration}
              </button>
            ))}
          </div>
        </div>
        
      </div>
      
      {/* ===== 設定サマリー ===== */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-3 rounded-xl border border-orange-100">
          <h4 className="text-sm font-medium text-orange-800 mb-2">
            ✨ 今の気分
          </h4>
          <p className="text-sm text-orange-700">
            <span className="font-medium">{value.style}</span>で
            <span className="font-medium">{value.intensity}</span>な味付け、時間は
            <span className="font-medium">{value.duration}</span>で作りたい気分
          </p>
        </div>
      </div>
      
    </div>
  );
}