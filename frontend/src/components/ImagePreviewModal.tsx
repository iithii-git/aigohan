'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, RotateCw } from 'lucide-react';
import { clsx } from 'clsx';
import { ImageData } from '@/hooks/useImageUpload';
import { formatFileSize } from '@/lib/utils/fileValidation';

interface ImagePreviewModalProps {
  images: ImageData[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onNavigate?: (index: number) => void;
}

export default function ImagePreviewModal({
  images,
  currentIndex,
  isOpen,
  onClose,
  onDelete,
  onNavigate,
}: ImagePreviewModalProps) {
  const [rotation, setRotation] = useState(0);
  const currentImage = images[currentIndex];

  // モーダル開閉時の処理
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setRotation(0); // 回転をリセット
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // キーボードショートカット
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          navigatePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateNext();
          break;
        case 'Delete':
          e.preventDefault();
          if (currentImage && onDelete) {
            onDelete(currentImage.id);
          }
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleRotate();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentIndex, images.length]);

  const navigatePrevious = () => {
    if (images.length <= 1) return;
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    onNavigate?.(newIndex);
    setRotation(0);
  };

  const navigateNext = () => {
    if (images.length <= 1) return;
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    onNavigate?.(newIndex);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDelete = () => {
    if (currentImage && onDelete) {
      onDelete(currentImage.id);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !currentImage) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* バックドロップ */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* モーダル内容 */}
      <div className="relative w-full h-full max-w-6xl max-h-screen flex flex-col">
        {/* ヘッダー */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            {/* 画像情報 */}
            <div className="text-white">
              <h2 className="text-lg font-semibold truncate max-w-md" title={currentImage.name}>
                {currentImage.name}
              </h2>
              <p className="text-sm text-gray-300">
                {formatFileSize(currentImage.size)} • {currentIndex + 1} / {images.length}
              </p>
            </div>

            {/* 操作ボタン */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRotate}
                className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                title="回転 (R)"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-2 bg-red-500/50 hover:bg-red-500/70 text-white rounded-lg transition-colors"
                  title="削除 (Delete)"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                title="閉じる (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* メイン画像エリア */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={currentImage.dataUrl}
              alt={currentImage.name}
              className={clsx(
                'max-w-full max-h-full object-contain transition-transform duration-300',
                'shadow-2xl rounded-lg'
              )}
              style={{
                transform: `rotate(${rotation}deg)`,
              }}
            />
          </div>
        </div>

        {/* ナビゲーションボタン */}
        {images.length > 1 && (
          <>
            <button
              onClick={navigatePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              title="前の画像 (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={navigateNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              title="次の画像 (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* サムネイルナビゲーション */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex items-center justify-center space-x-2 overflow-x-auto max-w-full">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => {
                    onNavigate?.(index);
                    setRotation(0);
                  }}
                  className={clsx(
                    'flex-shrink-0 w-16 h-16 border-2 rounded-lg overflow-hidden transition-all',
                    index === currentIndex
                      ? 'border-white shadow-lg scale-110'
                      : 'border-transparent opacity-70 hover:opacity-100 hover:border-white/50'
                  )}
                >
                  <img
                    src={image.dataUrl}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}