import { useState, useCallback, useMemo } from 'react';
import { 
  validateMultipleFiles, 
  FileValidationOptions, 
  DEFAULT_FILE_OPTIONS, 
  fileToDataURL, 
  formatFileSize 
} from '@/lib/utils/fileValidation';

// 画像データの型定義
export interface ImageData {
  id: string;
  file: File;
  dataUrl: string;
  name: string;
  size: number;
  type: string;
}

// フックのオプション
export interface UseImageUploadOptions extends FileValidationOptions {
  autoGeneratePreview?: boolean;
}

// フックの戻り値の型
export interface UseImageUploadReturn {
  images: ImageData[];
  isLoading: boolean;
  errors: string[];
  totalSize: number;
  canAddMore: boolean;
  addImages: (files: FileList | File[]) => Promise<void>;
  removeImage: (id: string) => void;
  clearImages: () => void;
  clearErrors: () => void;
  getImageById: (id: string) => ImageData | undefined;
  reorderImages: (startIndex: number, endIndex: number) => void;
}

/**
 * 画像アップロード管理用カスタムフック
 */
export function useImageUpload(
  options: UseImageUploadOptions = {}
): UseImageUploadReturn {
  const opts = { 
    ...DEFAULT_FILE_OPTIONS, 
    autoGeneratePreview: true,
    ...options 
  };
  
  // 状態管理
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // 派生値の計算
  const totalSize = useMemo(() => {
    return images.reduce((total, image) => total + image.size, 0);
  }, [images]);

  const canAddMore = useMemo(() => {
    return images.length < opts.maxFiles;
  }, [images.length, opts.maxFiles]);

  /**
   * 画像を追加
   */
  const addImages = useCallback(async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setErrors([]);

    try {
      // ファイル検証
      const { validFiles, errors: validationErrors } = validateMultipleFiles(
        files,
        images.length,
        opts
      );

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
      }

      if (validFiles.length === 0) {
        return;
      }

      // プレビュー画像生成
      const newImages: ImageData[] = [];
      
      for (const file of validFiles) {
        try {
          const dataUrl = opts.autoGeneratePreview 
            ? await fileToDataURL(file)
            : '';

          const imageData: ImageData = {
            id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            file,
            dataUrl,
            name: file.name,
            size: file.size,
            type: file.type,
          };

          newImages.push(imageData);
        } catch (error) {
          console.error('Failed to process image:', file.name, error);
          setErrors(prev => [...prev, `${file.name}: プレビュー生成に失敗しました`]);
        }
      }

      // 画像を状態に追加
      setImages(prev => [...prev, ...newImages]);

      console.log(`Successfully added ${newImages.length} images:`, 
        newImages.map(img => ({ name: img.name, size: formatFileSize(img.size) }))
      );

    } catch (error) {
      console.error('Failed to add images:', error);
      setErrors(['画像の追加に失敗しました']);
    } finally {
      setIsLoading(false);
    }
  }, [images.length, opts]);

  /**
   * 画像を削除
   */
  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    
    // エラーもクリア（関連するエラーかもしれないため）
    setErrors([]);
    
    console.log('Removed image:', id);
  }, []);

  /**
   * 全画像をクリア
   */
  const clearImages = useCallback(() => {
    setImages([]);
    setErrors([]);
    console.log('Cleared all images');
  }, []);

  /**
   * エラーをクリア
   */
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  /**
   * IDで画像を取得
   */
  const getImageById = useCallback((id: string): ImageData | undefined => {
    return images.find(img => img.id === id);
  }, [images]);

  /**
   * 画像の順序を変更
   */
  const reorderImages = useCallback((startIndex: number, endIndex: number) => {
    if (startIndex < 0 || endIndex < 0 || startIndex >= images.length || endIndex >= images.length) {
      return;
    }

    setImages(prev => {
      const result = [...prev];
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });

    console.log(`Reordered images: ${startIndex} -> ${endIndex}`);
  }, [images.length]);

  return {
    images,
    isLoading,
    errors,
    totalSize,
    canAddMore,
    addImages,
    removeImage,
    clearImages,
    clearErrors,
    getImageById,
    reorderImages,
  };
}