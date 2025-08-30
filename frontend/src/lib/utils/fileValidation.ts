// ファイル検証ユーティリティ

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileValidationOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}

// デフォルトの検証オプション
export const DEFAULT_FILE_OPTIONS: Required<FileValidationOptions> = {
  maxSizeInMB: 5,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxFiles: 10,
};

/**
 * ファイルの形式を検証
 */
export function validateFileType(file: File, allowedTypes: string[]): FileValidationResult {
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes
      .map(type => type.split('/')[1]?.toUpperCase())
      .join(', ');
    
    return {
      isValid: false,
      error: `対応していないファイル形式です。対応形式: ${allowedExtensions}`,
    };
  }
  
  return { isValid: true };
}

/**
 * ファイルサイズを検証
 */
export function validateFileSize(file: File, maxSizeInMB: number): FileValidationResult {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `ファイルサイズが大きすぎます。最大${maxSizeInMB}MBまで対応しています。（現在: ${(file.size / 1024 / 1024).toFixed(1)}MB）`,
    };
  }
  
  return { isValid: true };
}

/**
 * ファイル数を検証
 */
export function validateFileCount(
  files: FileList | File[], 
  currentFileCount: number, 
  maxFiles: number
): FileValidationResult {
  const newFileCount = Array.from(files).length;
  const totalCount = currentFileCount + newFileCount;
  
  if (totalCount > maxFiles) {
    return {
      isValid: false,
      error: `画像は最大${maxFiles}枚まで選択できます。（現在: ${currentFileCount}枚、追加予定: ${newFileCount}枚）`,
    };
  }
  
  return { isValid: true };
}

/**
 * 単一ファイルの包括的検証
 */
export function validateSingleFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const opts = { ...DEFAULT_FILE_OPTIONS, ...options };
  
  // ファイル形式検証
  const typeValidation = validateFileType(file, opts.allowedTypes);
  if (!typeValidation.isValid) {
    return typeValidation;
  }
  
  // ファイルサイズ検証
  const sizeValidation = validateFileSize(file, opts.maxSizeInMB);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }
  
  return { isValid: true };
}

/**
 * 複数ファイルの包括的検証
 */
export function validateMultipleFiles(
  files: FileList | File[],
  currentFileCount: number = 0,
  options: FileValidationOptions = {}
): { validFiles: File[]; errors: string[] } {
  const opts = { ...DEFAULT_FILE_OPTIONS, ...options };
  const fileArray = Array.from(files);
  const validFiles: File[] = [];
  const errors: string[] = [];
  
  // ファイル数検証
  const countValidation = validateFileCount(files, currentFileCount, opts.maxFiles);
  if (!countValidation.isValid) {
    return { validFiles: [], errors: [countValidation.error!] };
  }
  
  // 各ファイルを個別に検証
  fileArray.forEach((file, index) => {
    const validation = validateSingleFile(file, options);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      errors.push(`${file.name}: ${validation.error}`);
    }
  });
  
  return { validFiles, errors };
}

/**
 * ファイルサイズを人間が読みやすい形式にフォーマット
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * ファイル形式から拡張子を取得
 */
export function getFileExtension(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() || '';
}

/**
 * 画像ファイルかどうかを判定
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * ファイルを Base64 データURL に変換
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
}