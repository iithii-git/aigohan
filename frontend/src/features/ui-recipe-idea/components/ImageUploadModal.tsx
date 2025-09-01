/**
 * ImageUploadModal.tsx - 画像アップロードモーダル
 * 
 * 【目的】
 * カメラ撮影またはギャラリーからの画像選択機能を提供します。
 * 選択された画像をAI解析し、認識された食材を自動追加します。
 * 
 * 【機能】
 * - ギャラリーからの画像選択
 * - 複数画像の同時選択対応
 * - ローディング状態の表示
 * - エラーハンドリング
 */

'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

// ===================================================================
// 型定義
// ===================================================================

/**
 * ImageUploadModalコンポーネントのプロパティ
 */
export interface ImageUploadModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
  /** 画像選択完了時のコールバック */
  onImagesSelected: (files: FileList) => void;
  /** アップロード処理中かどうか */
  isUploading?: boolean;
  /** 最大ファイル数 */
  maxFiles?: number;
  /** 最大ファイルサイズ（MB） */
  maxSizeInMB?: number;
}

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * 画像アップロードモーダル
 * 
 * ユーザーが画像を選択してAI食材認識を実行するための
 * インターフェースを提供します。
 */
export default function ImageUploadModal({
  isOpen,
  onClose,
  onImagesSelected,
  isUploading = false,
  maxFiles = 5,
  maxSizeInMB = 10,
}: ImageUploadModalProps) {
  
  // ===================================================================
  // 参照とローカル状態
  // ===================================================================
  
  /** ファイル入力の参照 */
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  /** エラーメッセージ */
  const [error, setError] = useState<string>('');
  
  // ===================================================================
  // イベントハンドラー
  // ===================================================================
  
  /**
   * ギャラリー選択ボタンクリック処理
   */
  const handleGalleryClick = () => {
    setError('');
    fileInputRef.current?.click();
  };
  
  /**
   * ファイル選択処理
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      // ファイル数チェック
      if (files.length > maxFiles) {
        setError(`選択できる画像は最大${maxFiles}枚です`);
        return;
      }
      
      // ファイルサイズチェック
      const oversizedFiles: string[] = [];
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      
      Array.from(files).forEach(file => {
        if (file.size > maxSizeInBytes) {
          oversizedFiles.push(file.name);
        }
      });
      
      if (oversizedFiles.length > 0) {
        setError(`以下のファイルがサイズ制限（${maxSizeInMB}MB）を超えています：${oversizedFiles.join(', ')}`);
        return;
      }
      
      // ファイル形式チェック
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const invalidFiles: string[] = [];
      
      Array.from(files).forEach(file => {
        if (!allowedTypes.includes(file.type)) {
          invalidFiles.push(file.name);
        }
      });
      
      if (invalidFiles.length > 0) {
        setError(`以下のファイルは対応していない形式です：${invalidFiles.join(', ')}`);
        return;
      }
      
      // 画像選択完了
      onImagesSelected(files);
      
    } catch (error) {
      console.error('ファイル選択エラー:', error);
      setError('ファイルの処理中にエラーが発生しました');
    }
    
    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  /**
   * モーダルクローズ時の処理
   */
  const handleClose = () => {
    if (!isUploading) {
      setError('');
      onClose();
    }
  };
  
  // ===================================================================
  // レンダリング
  // ===================================================================
  
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="写真を選択"
        size="sm"
        closeOnOverlayClick={!isUploading}
        closeOnEsc={!isUploading}
        showCloseButton={!isUploading}
      >
        <div className="space-y-6">
          
          {/* アップロード中の表示 */}
          {isUploading ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                画像を解析中...
              </p>
              <p className="text-sm text-gray-600">
                AIが食材を認識しています。しばらくお待ちください。
              </p>
            </div>
          ) : (
            /* 通常の選択UI */
            <>
              {/* ギャラリー選択ボタン */}
              <Button
                onClick={handleGalleryClick}
                variant="secondary"
                fullWidth
                leftIcon={<Upload className="w-6 h-6" />}
                className="h-16 border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50"
              >
                <div className="text-center">
                  <p className="font-medium text-blue-700">ギャラリーから選択</p>
                  <p className="text-xs text-blue-600">
                    最大{maxFiles}枚、{maxSizeInMB}MBまで
                  </p>
                </div>
              </Button>
              
              {/* エラーメッセージ */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 font-medium">
                    {error}
                  </p>
                </div>
              )}
              
              {/* 注意事項 */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  📸 撮影のコツ
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 食材がはっきりと見えるように撮影してください</li>
                  <li>• 明るい場所で撮影すると認識精度が上がります</li>
                  <li>• 複数の食材を一度に撮影できます</li>
                </ul>
              </div>
              
              {/* キャンセルボタン */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleClose}
                  variant="minimal"
                >
                  キャンセル
                </Button>
              </div>
            </>
          )}
          
        </div>
      </Modal>
      
      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </>
  );
}