// 画像処理ユーティリティ

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_COUNT = 10;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImage(file: File): ImageValidationResult {
  // ファイルサイズチェック
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `画像サイズが5MBを超えています: ${file.name}`,
    };
  }

  // MIMEタイプチェック
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `サポートされていない画像形式です: ${file.type}`,
    };
  }

  return { valid: true };
}

export function validateImageCount(count: number): ImageValidationResult {
  if (count > MAX_IMAGE_COUNT) {
    return {
      valid: false,
      error: `画像は最大${MAX_IMAGE_COUNT}枚までアップロードできます`,
    };
  }
  return { valid: true };
}

/**
 * Fileオブジェクトをbase64文字列に変換
 */
export async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

/**
 * 画像ファイルとMIMEタイプのペア
 */
export interface ImageBase64 {
  base64: string;
  mimeType: string;
}

/**
 * 画像ファイルの配列をbase64文字列とMIMEタイプのペアの配列に変換（最大3枚）
 */
export async function imagesToBase64(
  files: File[]
): Promise<ImageBase64[]> {
  const limitedFiles = files.slice(0, 3);
  return Promise.all(
    limitedFiles.map(async (file) => ({
      base64: await fileToBase64(file),
      mimeType: file.type,
    }))
  );
}

/**
 * MIMEタイプからdata URLの形式を決定
 */
export function getDataUrlMimeType(mimeType: string): string {
  // image/jpg は image/jpeg に正規化
  if (mimeType === 'image/jpg') {
    return 'image/jpeg';
  }
  return mimeType;
}

/**
 * base64文字列とMIMEタイプからdata URLを作成
 */
export function createDataUrl(base64: string, mimeType: string): string {
  const normalizedMimeType = getDataUrlMimeType(mimeType);
  return `data:${normalizedMimeType};base64,${base64}`;
}

