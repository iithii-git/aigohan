/**
 * Button.tsx - 汎用ボタンコンポーネント
 * 
 * 【目的】
 * アプリケーション全体で統一されたボタンUIを提供します。
 * 複数のバリエーション（primary、secondary、minimal）と
 * サイズ（sm、md、lg）をサポートします。
 * 
 * 【特徴】
 * - Tailwind CSSによる一貫したデザイン
 * - アクセシビリティ対応
 * - ローディング状態の表示
 * - アイコン表示対応
 */

'use client';

import { forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';

// ===================================================================
// 型定義
// ===================================================================

/**
 * ボタンのバリエーション
 */
export type ButtonVariant = 'primary' | 'secondary' | 'minimal' | 'danger';

/**
 * ボタンのサイズ
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Buttonコンポーネントのプロパティ
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** ボタンのスタイルバリエーション */
  variant?: ButtonVariant;
  /** ボタンのサイズ */
  size?: ButtonSize;
  /** ローディング状態の表示 */
  loading?: boolean;
  /** ボタンの左側に表示するアイコン */
  leftIcon?: ReactNode;
  /** ボタンの右側に表示するアイコン */
  rightIcon?: ReactNode;
  /** ボタンの幅を100%にするかどうか */
  fullWidth?: boolean;
}

// ===================================================================
// スタイル定義
// ===================================================================

/**
 * バリエーション別のスタイル定義
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-orange-500 to-yellow-500 text-white
    hover:from-orange-600 hover:to-yellow-600
    focus:ring-4 focus:ring-orange-500/20
    disabled:from-gray-400 disabled:to-gray-400
    shadow-md hover:shadow-lg
  `,
  secondary: `
    bg-white text-gray-800 border border-gray-300
    hover:bg-gray-50 hover:border-gray-400
    focus:ring-4 focus:ring-gray-500/20
    disabled:bg-gray-100 disabled:text-gray-400
    shadow-sm hover:shadow-md
  `,
  minimal: `
    bg-transparent text-gray-600 
    hover:bg-gray-100 hover:text-gray-800
    focus:ring-4 focus:ring-gray-500/20
    disabled:text-gray-300 disabled:hover:bg-transparent
  `,
  danger: `
    bg-red-500 text-white
    hover:bg-red-600
    focus:ring-4 focus:ring-red-500/20
    disabled:bg-gray-400
    shadow-md hover:shadow-lg
  `,
};

/**
 * サイズ別のスタイル定義
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * 汎用Buttonコンポーネント
 * 
 * アプリケーション全体で一貫したボタンUIを提供します。
 * forwardRefを使用してref転送に対応しています。
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}, ref) => {
  
  // ローディング中またはdisabledの場合は無効化
  const isDisabled = disabled || loading;
  
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={clsx(
        // 基本スタイル
        'inline-flex items-center justify-center font-medium rounded-2xl',
        'transition-all duration-200 transform',
        'focus:outline-none focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        
        // ホバーアニメーション（無効でない場合のみ）
        !isDisabled && 'hover:scale-105 active:scale-95',
        
        // バリエーション・サイズスタイル
        variantStyles[variant],
        sizeStyles[size],
        
        // 幅設定
        fullWidth && 'w-full',
        
        // カスタムクラス
        className
      )}
      {...props}
    >
      {/* 左アイコンまたはローディングスピナー */}
      {loading ? (
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
      ) : leftIcon ? (
        <span className="mr-2">{leftIcon}</span>
      ) : null}
      
      {/* ボタンテキスト */}
      <span>{children}</span>
      
      {/* 右アイコン */}
      {rightIcon && !loading && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;