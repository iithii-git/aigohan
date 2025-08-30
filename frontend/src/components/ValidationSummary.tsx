'use client';

import { CheckCircle, AlertTriangle, XCircle, FileImage, Gauge } from 'lucide-react';
import { clsx } from 'clsx';
import { ImageData } from '@/hooks/useImageUpload';
import { formatFileSize, DEFAULT_FILE_OPTIONS } from '@/lib/utils/fileValidation';

interface ValidationSummaryProps {
  images: ImageData[];
  maxFiles?: number;
  maxSizeInMB?: number;
  className?: string;
}

interface ValidationStatus {
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export default function ValidationSummary({
  images,
  maxFiles = DEFAULT_FILE_OPTIONS.maxFiles,
  maxSizeInMB = DEFAULT_FILE_OPTIONS.maxSizeInMB,
  className,
}: ValidationSummaryProps) {
  // バリデーション結果を計算
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  const totalSizeInMB = totalSize / (1024 * 1024);

  const validations: ValidationStatus[] = [];

  // ファイル数チェック
  const fileCountValidation: ValidationStatus = (() => {
    if (images.length === 0) {
      return {
        status: 'warning',
        message: 'まだ画像が選択されていません',
        details: `最大${maxFiles}枚まで選択できます`,
      };
    }
    
    if (images.length > maxFiles) {
      return {
        status: 'error',
        message: `画像数が上限を超えています (${images.length}/${maxFiles})`,
        details: `${images.length - maxFiles}枚を削除してください`,
      };
    }
    
    if (images.length === maxFiles) {
      return {
        status: 'warning',
        message: `最大数の画像が選択されています (${images.length}/${maxFiles})`,
        details: 'これ以上追加できません',
      };
    }
    
    return {
      status: 'success',
      message: `${images.length}枚の画像が選択されています`,
      details: `残り${maxFiles - images.length}枚まで追加可能`,
    };
  })();

  validations.push(fileCountValidation);

  // 総ファイルサイズチェック
  const maxTotalSizeInMB = maxSizeInMB * maxFiles; // 想定最大総サイズ
  const sizeValidation: ValidationStatus = (() => {
    if (totalSizeInMB === 0) {
      return {
        status: 'warning',
        message: 'ファイルサイズ: 0 MB',
        details: '画像を選択してください',
      };
    }
    
    if (totalSizeInMB > maxTotalSizeInMB) {
      return {
        status: 'error',
        message: `総ファイルサイズが大きすぎます (${formatFileSize(totalSize)})`,
        details: `推奨最大サイズ: ${formatFileSize(maxTotalSizeInMB * 1024 * 1024)}`,
      };
    }
    
    if (totalSizeInMB > maxTotalSizeInMB * 0.8) {
      return {
        status: 'warning',
        message: `総ファイルサイズ: ${formatFileSize(totalSize)}`,
        details: 'サイズが大きいため、処理に時間がかかる場合があります',
      };
    }
    
    return {
      status: 'success',
      message: `総ファイルサイズ: ${formatFileSize(totalSize)}`,
      details: '適切なサイズです',
    };
  })();

  validations.push(sizeValidation);

  // 個別ファイルサイズチェック
  const oversizedImages = images.filter(img => 
    img.size > maxSizeInMB * 1024 * 1024
  );

  if (oversizedImages.length > 0) {
    validations.push({
      status: 'error',
      message: `${oversizedImages.length}枚の画像がサイズ上限を超えています`,
      details: oversizedImages.map(img => 
        `${img.name} (${formatFileSize(img.size)})`
      ).join(', '),
    });
  }

  // ファイル形式チェック
  const invalidTypeImages = images.filter(img => 
    !DEFAULT_FILE_OPTIONS.allowedTypes.includes(img.type)
  );

  if (invalidTypeImages.length > 0) {
    validations.push({
      status: 'error',
      message: `${invalidTypeImages.length}枚の画像が対応していない形式です`,
      details: invalidTypeImages.map(img => 
        `${img.name} (${img.type})`
      ).join(', '),
    });
  }

  // 全体的な状態を決定
  const hasErrors = validations.some(v => v.status === 'error');
  const hasWarnings = validations.some(v => v.status === 'warning');
  const overallStatus = hasErrors ? 'error' : hasWarnings ? 'warning' : 'success';

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={clsx('space-y-3', className)}>
      {/* 概要統計 */}
      <div className={clsx(
        'border rounded-lg p-4',
        getStatusColor(overallStatus)
      )}>
        <div className="flex items-center space-x-2 mb-3">
          {getStatusIcon(overallStatus)}
          <h3 className="text-sm font-semibold">
            バリデーション結果
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <FileImage className="w-4 h-4" />
            <span>
              <span className="font-medium">{images.length}</span>
              <span className="text-gray-600">/{maxFiles} 枚</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Gauge className="w-4 h-4" />
            <span>
              <span className="font-medium">{formatFileSize(totalSize)}</span>
              <span className="text-gray-600"> 合計</span>
            </span>
          </div>
        </div>
      </div>

      {/* 詳細バリデーション結果 */}
      <div className="space-y-2">
        {validations.map((validation, index) => (
          <div
            key={index}
            className={clsx(
              'border rounded-lg p-3 text-sm',
              getStatusColor(validation.status)
            )}
          >
            <div className="flex items-start space-x-2">
              {getStatusIcon(validation.status)}
              <div className="flex-1">
                <p className="font-medium">{validation.message}</p>
                {validation.details && (
                  <p className="text-xs mt-1 opacity-75">
                    {validation.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}