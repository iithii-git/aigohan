'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, ImageIcon, AlertCircle, X, Loader2, Eye } from 'lucide-react';
import { clsx } from 'clsx';
import { useImageUpload, ImageData } from '@/hooks/useImageUpload';
import { formatFileSize } from '@/lib/utils/fileValidation';
import ImagePreviewModal from './ImagePreviewModal';
import ValidationSummary from './ValidationSummary';

interface ImageUploadProps {
  onImagesChange?: (images: File[]) => void;
  maxFiles?: number;
  maxSizeInMB?: number;
  className?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  onImagesChange,
  maxFiles = 10,
  maxSizeInMB = 5,
  className,
  disabled = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // 画像管理フックを使用
  const {
    images,
    isLoading,
    errors,
    totalSize,
    canAddMore,
    addImages,
    removeImage,
    clearImages,
    clearErrors,
  } = useImageUpload({
    maxFiles,
    maxSizeInMB,
  });

  // 親コンポーネントに変更を通知
  const notifyParent = useCallback(() => {
    if (onImagesChange) {
      onImagesChange(images.map(img => img.file));
    }
  }, [images, onImagesChange]);

  // 画像が変更されたら親コンポーネントに通知
  useState(() => {
    notifyParent();
  });

  // ファイル選択処理
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;
    
    await addImages(files);
    
    // input をリセット（同じファイルを再選択できるようにする）
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    notifyParent();
  }, [addImages, disabled, notifyParent]);

  // ファイル選択ボタンクリック
  const handleUploadClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  // ドラッグ&ドロップ処理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    await handleFileSelect(files);
  }, [disabled, handleFileSelect]);

  // 画像削除処理
  const handleRemoveImage = useCallback((id: string) => {
    removeImage(id);
    notifyParent();
  }, [removeImage, notifyParent]);

  // 全クリア処理
  const handleClearAll = useCallback(() => {
    clearImages();
    notifyParent();
  }, [clearImages, notifyParent]);

  // プレビューモーダル処理
  const handlePreviewImage = useCallback((imageId: string) => {
    const index = images.findIndex(img => img.id === imageId);
    if (index !== -1) {
      setCurrentPreviewIndex(index);
      setPreviewModalOpen(true);
    }
  }, [images]);

  const handlePreviewModalClose = useCallback(() => {
    setPreviewModalOpen(false);
  }, []);

  const handlePreviewNavigate = useCallback((index: number) => {
    setCurrentPreviewIndex(index);
  }, []);

  const handlePreviewDelete = useCallback((imageId: string) => {
    removeImage(imageId);
    notifyParent();
    
    // 削除後のインデックス調整
    const newImages = images.filter(img => img.id !== imageId);
    if (newImages.length === 0) {
      setPreviewModalOpen(false);
    } else if (currentPreviewIndex >= newImages.length) {
      setCurrentPreviewIndex(newImages.length - 1);
    }
  }, [images, currentPreviewIndex, removeImage, notifyParent]);

  return (
    <div className={clsx('space-y-4', className)}>
      {/* アップロードエリア */}
      <div
        className={clsx(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
          {
            'border-orange-300 bg-orange-50': isDragOver && !disabled,
            'border-gray-300 bg-gray-50': !isDragOver && !disabled,
            'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50': disabled,
            'hover:border-orange-400 hover:bg-orange-25 cursor-pointer': !disabled && !isDragOver,
          }
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        {/* 非表示のファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        {/* アップロード中の表示 */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
            <div className="flex items-center space-x-2 text-orange-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="font-medium">画像を処理中...</span>
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className={clsx(
              'w-16 h-16 rounded-full flex items-center justify-center',
              isDragOver ? 'bg-orange-200' : 'bg-gray-200'
            )}>
              {isDragOver ? (
                <Upload className="w-8 h-8 text-orange-600" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-500" />
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {isDragOver ? '画像をドロップしてください' : '画像をアップロード'}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              画像をドラッグ&ドロップするか、クリックしてファイルを選択してください
            </p>
            
            <div className="text-xs text-gray-500 space-y-1">
              <div>対応形式: JPEG, PNG, WebP</div>
              <div>最大ファイルサイズ: {maxSizeInMB}MB</div>
              <div>最大画像数: {maxFiles}枚</div>
            </div>
          </div>

          {!canAddMore && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                最大画像数（{maxFiles}枚）に達しました
              </p>
            </div>
          )}
        </div>
      </div>

      {/* エラー表示 */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                アップロードエラー
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
              <button
                onClick={clearErrors}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                エラーを非表示
              </button>
            </div>
          </div>
        </div>
      )}

      {/* バリデーション概要 */}
      <ValidationSummary
        images={images}
        maxFiles={maxFiles}
        maxSizeInMB={maxSizeInMB}
      />

      {/* 画像統計情報 */}
      {images.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleClearAll}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            すべて削除
          </button>
        </div>
      )}

      {/* 画像プレビューエリア（次のステップで実装） */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-800">選択された画像</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <ImagePreviewCard
                key={image.id}
                image={image}
                onRemove={() => handleRemoveImage(image.id)}
                onPreview={() => handlePreviewImage(image.id)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* プレビューモーダル */}
      {previewModalOpen && images.length > 0 && (
        <ImagePreviewModal
          images={images}
          currentIndex={currentPreviewIndex}
          isOpen={previewModalOpen}
          onClose={handlePreviewModalClose}
          onDelete={handlePreviewDelete}
          onNavigate={handlePreviewNavigate}
        />
      )}
    </div>
  );
}

// 画像プレビューカードコンポーネント
interface ImagePreviewCardProps {
  image: ImageData;
  onRemove: () => void;
  onPreview?: () => void;
  disabled?: boolean;
}

function ImagePreviewCard({ image, onRemove, onPreview, disabled = false }: ImagePreviewCardProps) {
  return (
    <div className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* 画像プレビュー */}
      <div className="aspect-square bg-gray-100">
        {image.dataUrl ? (
          <img
            src={image.dataUrl}
            alt={image.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* 操作ボタン */}
      {!disabled && (
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 拡大表示ボタン */}
          {onPreview && (
            <button
              onClick={onPreview}
              className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center"
              title="拡大表示"
            >
              <Eye className="w-3 h-3" />
            </button>
          )}
          
          {/* 削除ボタン */}
          <button
            onClick={onRemove}
            className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
            title="画像を削除"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 画像情報 */}
      <div className="p-2 bg-white">
        <p className="text-xs font-medium text-gray-800 truncate" title={image.name}>
          {image.name}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(image.size)}
        </p>
      </div>
    </div>
  );
}