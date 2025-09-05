/**
 * imageCompression.ts - 画像圧縮ユーティリティ
 * 
 * Canvas APIを使用して画像の圧縮とリサイズを行います。
 * モバイル環境での大きな画像ファイルを効率的に処理します。
 */

// ===================================================================
// 型定義
// ===================================================================

export interface CompressionOptions {
  /** 最大幅（px） */
  maxWidth?: number;
  /** 最大高さ（px） */
  maxHeight?: number;
  /** JPEG品質（0.0-1.0） */
  quality?: number;
  /** 出力フォーマット */
  outputFormat?: 'jpeg' | 'webp' | 'png';
  /** 最大ファイルサイズ（MB） */
  maxSizeInMB?: number;
}

export interface CompressionResult {
  /** 圧縮後のファイル */
  file: File;
  /** 圧縮前のサイズ（bytes） */
  originalSize: number;
  /** 圧縮後のサイズ（bytes） */
  compressedSize: number;
  /** 圧縮率（%） */
  compressionRatio: number;
  /** 元の画像サイズ */
  originalDimensions: { width: number; height: number };
  /** 圧縮後の画像サイズ */
  compressedDimensions: { width: number; height: number };
}

// ===================================================================
// デフォルト設定
// ===================================================================

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  outputFormat: 'jpeg',
  maxSizeInMB: 2,
};

// ===================================================================
// ユーティリティ関数
// ===================================================================

/**
 * ファイルから画像要素を作成
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像の読み込みに失敗しました'));
    };
    
    img.src = url;
  });
}

/**
 * Canvas要素から最適化されたファイルを生成
 */
function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  options: Required<CompressionOptions>
): Promise<File> {
  return new Promise((resolve) => {
    const mimeType = `image/${options.outputFormat}`;
    
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          throw new Error('Canvas to Blob conversion failed');
        }
        
        const file = new File([blob], fileName, {
          type: mimeType,
          lastModified: Date.now(),
        });
        
        resolve(file);
      },
      mimeType,
      options.quality
    );
  });
}

/**
 * 画像の最適なサイズを計算
 */
function calculateOptimalSize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  let newWidth = originalWidth;
  let newHeight = originalHeight;
  
  // 幅が制限を超えている場合
  if (newWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }
  
  // 高さが制限を超えている場合
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }
  
  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
}

// ===================================================================
// メイン関数
// ===================================================================

/**
 * 画像ファイルを圧縮
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // 画像をロード
  const img = await loadImageFromFile(file);
  const originalDimensions = {
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
  
  // 最適なサイズを計算
  const compressedDimensions = calculateOptimalSize(
    originalDimensions.width,
    originalDimensions.height,
    opts.maxWidth,
    opts.maxHeight
  );
  
  // Canvasで画像を描画
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context could not be created');
  }
  
  canvas.width = compressedDimensions.width;
  canvas.height = compressedDimensions.height;
  
  // 高品質な描画設定
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // 画像を描画
  ctx.drawImage(
    img,
    0,
    0,
    compressedDimensions.width,
    compressedDimensions.height
  );
  
  // ファイル名を生成
  const originalName = file.name.split('.').slice(0, -1).join('.');
  const fileName = `${originalName}_compressed.${opts.outputFormat}`;
  
  // 圧縮されたファイルを生成
  const compressedFile = await canvasToFile(canvas, fileName, opts);
  
  // Canvas をクリーンアップ
  canvas.remove();
  
  // 結果を返す
  const compressionRatio = ((file.size - compressedFile.size) / file.size) * 100;
  
  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    compressionRatio: Math.round(compressionRatio * 100) / 100,
    originalDimensions,
    compressedDimensions,
  };
}

/**
 * Canvas要素から圧縮画像を生成
 */
export async function compressCanvasImage(
  canvas: HTMLCanvasElement,
  fileName: string = 'camera-image',
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const originalDimensions = {
    width: canvas.width,
    height: canvas.height,
  };
  
  // 最適なサイズを計算
  const compressedDimensions = calculateOptimalSize(
    originalDimensions.width,
    originalDimensions.height,
    opts.maxWidth,
    opts.maxHeight
  );
  
  // 新しいCanvasを作成してリサイズ
  const resizedCanvas = document.createElement('canvas');
  const ctx = resizedCanvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context could not be created');
  }
  
  resizedCanvas.width = compressedDimensions.width;
  resizedCanvas.height = compressedDimensions.height;
  
  // 高品質な描画設定
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // 元のCanvasから新しいCanvasに描画
  ctx.drawImage(
    canvas,
    0,
    0,
    compressedDimensions.width,
    compressedDimensions.height
  );
  
  // ファイル名を生成
  const fullFileName = `${fileName}.${opts.outputFormat}`;
  
  // 圧縮されたファイルを生成
  const compressedFile = await canvasToFile(resizedCanvas, fullFileName, opts);
  
  // 元のファイルサイズを推定（非圧縮PNG相当）
  const originalSize = originalDimensions.width * originalDimensions.height * 4; // RGBA
  
  // Canvasをクリーンアップ
  resizedCanvas.remove();
  
  // 結果を返す
  const compressionRatio = ((originalSize - compressedFile.size) / originalSize) * 100;
  
  return {
    file: compressedFile,
    originalSize,
    compressedSize: compressedFile.size,
    compressionRatio: Math.round(compressionRatio * 100) / 100,
    originalDimensions,
    compressedDimensions,
  };
}

/*
★ Insight ─────────────────────────────────────
画像圧縮によるモバイル最適化

1. パフォーマンス向上: 大きな画像をAPI送信前に圧縮してレスポンス時間短縮
2. データ使用量削減: モバイルデータ通信量を大幅に削減
3. 品質維持: Canvas APIの高品質補間で視覚的劣化を最小限に

─────────────────────────────────────────────────
*/