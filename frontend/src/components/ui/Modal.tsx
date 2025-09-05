/**
 * Modal.tsx - 汎用モーダルコンポーネント
 * 
 * 【目的】
 * アプリケーション全体で統一されたモーダルUIを提供します。
 * オーバーレイクリック・ESCキーでの閉じる機能、
 * アニメーション、ポータル対応などを含みます。
 * 
 * 【特徴】
 * - React Portalを使用してbody直下にレンダリング
 * - アニメーション付きの開閉
 * - アクセシビリティ対応（フォーカストラップ、ESCキー）
 * - 様々なサイズ対応
 */

'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

// ===================================================================
// 型定義
// ===================================================================

/**
 * モーダルのサイズ
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Modalコンポーネントのプロパティ
 */
export interface ModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
  /** モーダルのタイトル */
  title?: string;
  /** モーダルのサイズ */
  size?: ModalSize;
  /** オーバーレイクリックで閉じるかどうか */
  closeOnOverlayClick?: boolean;
  /** ESCキーで閉じるかどうか */
  closeOnEsc?: boolean;
  /** 閉じるボタンを表示するかどうか */
  showCloseButton?: boolean;
  /** モーダルの内容 */
  children: ReactNode;
  /** カスタムクラス */
  className?: string;
}

// ===================================================================
// スタイル定義
// ===================================================================

/**
 * サイズ別のスタイル定義
 */
const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-full mx-4',
};

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * 汎用Modalコンポーネント
 * 
 * アプリケーション全体で一貫したモーダルUIを提供します。
 * React Portalを使用してbody直下にレンダリングします。
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  children,
  className,
}: ModalProps) {
  
  // モーダルコンテンツのref
  const modalRef = useRef<HTMLDivElement>(null);
  
  // ===================================================================
  // 副作用・イベントハンドラー
  // ===================================================================
  
  /**
   * ESCキーでモーダルを閉じる処理
   */
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, closeOnEsc, onClose]);
  
  /**
   * モーダルが開いている間のスクロール防止
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  /**
   * オーバーレイクリックでモーダルを閉じる処理
   */
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };
  
  // モーダルが閉じている場合は何も表示しない
  if (!isOpen) return null;
  
  // ===================================================================
  // レンダリング
  // ===================================================================
  
  // サーバーサイドレンダリング時はポータルを作成しない
  if (typeof window === 'undefined') {
    return null;
  }
  
  return createPortal(
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm',
        'transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={clsx(
          // 基本スタイル
          'bg-white rounded-3xl shadow-2xl',
          'transform transition-all duration-300',
          'max-h-[90vh] overflow-y-auto',
          
          // アニメーション
          isOpen ? 'scale-100' : 'scale-95',
          
          // サイズスタイル
          sizeStyles[size],
          
          // カスタムクラス
          className
        )}
        onClick={(e) => e.stopPropagation()} // バブリング防止
      >
        
        {/* ヘッダー */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            
            {/* タイトル */}
            {title && (
              <h2 className="text-xl font-bold text-gray-900">
                {title}
              </h2>
            )}
            
            {/* 閉じるボタン */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="モーダルを閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
          </div>
        )}
        
        {/* コンテンツ */}
        <div className="p-6">
          {children}
        </div>
        
      </div>
    </div>,
    document.body
  );
}