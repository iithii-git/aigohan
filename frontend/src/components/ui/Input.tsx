/**
 * Input.tsx - 汎用入力フィールドコンポーネント
 * 
 * 【目的】
 * アプリケーション全体で統一された入力フィールドUIを提供します。
 * ラベル、エラーメッセージ、プレースホルダー、アイコンなどの
 * 一般的な入力フィールド機能をサポートします。
 * 
 * 【特徴】
 * - フォーカス・エラー状態の視覚的フィードバック
 * - 左右アイコン表示対応
 * - バリデーションメッセージ表示
 * - アクセシビリティ対応
 */

'use client';

import { forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';

// ===================================================================
// 型定義
// ===================================================================

/**
 * 入力フィールドのサイズ
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Inputコンポーネントのプロパティ
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 入力フィールドのサイズ */
  size?: InputSize;
  /** ラベルテキスト */
  label?: string;
  /** エラーメッセージ */
  error?: string;
  /** ヘルプテキスト */
  helpText?: string;
  /** 左側に表示するアイコン */
  leftIcon?: ReactNode;
  /** 右側に表示するアイコン */
  rightIcon?: ReactNode;
  /** 入力フィールドの幅を100%にするかどうか */
  fullWidth?: boolean;
}

// ===================================================================
// スタイル定義
// ===================================================================

/**
 * サイズ別のスタイル定義
 */
const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-4 py-3 text-base',
};

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * 汎用Inputコンポーネント
 * 
 * フォーム入力に必要な機能を統合した入力フィールドです。
 * エラー状態、フォーカス状態の視覚的フィードバックを提供します。
 */
const Input = forwardRef<HTMLInputElement, InputProps>(({
  size = 'md',
  label,
  error,
  helpText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  id,
  ...props
}, ref) => {
  
  // IDの生成（ラベルとの関連付け用）
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={clsx('space-y-2', fullWidth && 'w-full')}>
      
      {/* ラベル */}
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      
      {/* 入力フィールドコンテナ */}
      <div className="relative">
        
        {/* 左アイコン */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        {/* 入力フィールド */}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            // 基本スタイル
            'w-full border rounded-2xl transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
            
            // サイズスタイル
            sizeStyles[size],
            
            // アイコンがある場合のパディング調整
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            
            // エラー状態スタイル
            error ? [
              'border-red-300 focus:border-red-500 focus:ring-red-500/20',
              'text-red-900 placeholder-red-300',
            ] : [
              'border-gray-300 focus:border-orange-500 focus:ring-orange-500/20',
              'text-gray-900 placeholder-gray-400',
            ],
            
            // カスタムクラス
            className
          )}
          {...props}
        />
        
        {/* 右アイコン */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
        
      </div>
      
      {/* エラーメッセージ */}
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
      
      {/* ヘルプテキスト（エラーがない場合のみ表示） */}
      {helpText && !error && (
        <p className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
      
    </div>
  );
});

Input.displayName = 'Input';

export default Input;