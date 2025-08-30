/**
 * 食材入力バリデーションユーティリティ
 */

// バリデーション結果の型定義
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// バリデーションオプション
export interface IngredientValidationOptions {
  minLength: number;
  maxLength: number;
  allowDuplicates: boolean;
  allowEmptySpaces: boolean;
  maxIngredients: number;
  strictMode: boolean; // 厳格モード（英数字のみなどの制限）
}

// デフォルトオプション
export const DEFAULT_VALIDATION_OPTIONS: IngredientValidationOptions = {
  minLength: 1,
  maxLength: 100,
  allowDuplicates: false,
  allowEmptySpaces: false,
  maxIngredients: 50,
  strictMode: false,
};

// 食材名の許可されない文字パターン
const FORBIDDEN_PATTERNS = {
  // HTMLタグ
  htmlTags: /<[^>]*>/g,
  // スクリプトタグ
  scriptTags: /<script[^>]*>.*?<\/script>/gi,
  // 特殊文字（ファイルパス、SQL等で問題となる文字）
  specialChars: /[<>{}[\]\\\/]/g,
  // 制御文字
  controlChars: /[\x00-\x1f\x7f]/g,
  // 連続するスペース
  multipleSpaces: /\s{2,}/g,
};

// 食材名として疑わしいパターン
const SUSPICIOUS_PATTERNS = {
  // SQLインジェクション
  sqlInjection: /(union|select|insert|update|delete|drop|create|alter|exec|execute)\s/gi,
  // スクリプト関連
  javascript: /(javascript|vbscript|onclick|onerror|onload):/gi,
  // URLパターン
  urls: /(https?:\/\/|ftp:\/\/|www\.)/gi,
  // 数字のみ
  numbersOnly: /^\d+$/,
  // 極端に長い文字列
  extremeLength: /^.{200,}$/,
};

// 一般的でない食材名パターン（警告用）
const UNCOMMON_PATTERNS = {
  // 英語のみの長い単語
  longEnglishOnly: /^[a-zA-Z]{20,}$/,
  // 特殊記号が多い
  tooManySymbols: /[^\w\sぁ-んァ-ンー一-龯]{3,}/,
  // 大文字小文字の混在が不自然
  weirdCasing: /[A-Z]{5,}[a-z]{1,}[A-Z]{5,}/,
};

/**
 * 単一の食材名をバリデーション
 */
export function validateIngredientName(
  name: string,
  existingIngredients: string[] = [],
  options: Partial<IngredientValidationOptions> = {}
): ValidationResult {
  const opts = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];

  // 前後の空白を除去
  const trimmedName = name.trim();

  // 空文字チェック
  if (!trimmedName) {
    errors.push('食材名を入力してください');
    return { isValid: false, errors, warnings };
  }

  // 長さチェック
  if (trimmedName.length < opts.minLength) {
    errors.push(`食材名は${opts.minLength}文字以上で入力してください`);
  }

  if (trimmedName.length > opts.maxLength) {
    errors.push(`食材名は${opts.maxLength}文字以内で入力してください`);
  }

  // 重複チェック
  if (!opts.allowDuplicates && existingIngredients.length > 0) {
    const isDuplicate = existingIngredients.some(
      existing => existing.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      errors.push('この食材は既に追加されています');
    }
  }

  // 禁止文字チェック
  Object.entries(FORBIDDEN_PATTERNS).forEach(([patternName, pattern]) => {
    if (pattern.test(trimmedName)) {
      switch (patternName) {
        case 'htmlTags':
        case 'scriptTags':
          errors.push('HTMLタグは使用できません');
          break;
        case 'specialChars':
          errors.push('使用できない特殊文字が含まれています');
          break;
        case 'controlChars':
          errors.push('制御文字は使用できません');
          break;
        case 'multipleSpaces':
          if (!opts.allowEmptySpaces) {
            errors.push('連続するスペースは使用できません');
          }
          break;
      }
    }
  });

  // 疑わしいパターンチェック
  Object.entries(SUSPICIOUS_PATTERNS).forEach(([patternName, pattern]) => {
    if (pattern.test(trimmedName)) {
      switch (patternName) {
        case 'sqlInjection':
          errors.push('不正な文字列パターンが検出されました');
          break;
        case 'javascript':
          errors.push('スクリプトコードは使用できません');
          break;
        case 'urls':
          warnings.push('URLのような文字列が含まれています');
          break;
        case 'numbersOnly':
          warnings.push('数字のみの食材名は推奨されません');
          break;
        case 'extremeLength':
          errors.push('食材名が長すぎます');
          break;
      }
    }
  });

  // 一般的でないパターンチェック（警告のみ）
  if (!opts.strictMode) {
    Object.entries(UNCOMMON_PATTERNS).forEach(([patternName, pattern]) => {
      if (pattern.test(trimmedName)) {
        switch (patternName) {
          case 'longEnglishOnly':
            warnings.push('長い英語のみの食材名は一般的ではありません');
            break;
          case 'tooManySymbols':
            warnings.push('特殊記号が多く含まれています');
            break;
          case 'weirdCasing':
            warnings.push('大文字小文字の使い方が不自然です');
            break;
        }
      }
    });
  }

  // 厳格モードでの追加チェック
  if (opts.strictMode) {
    // ひらがな、カタカナ、漢字、英数字、一般的な記号のみ許可
    const allowedPattern = /^[ぁ-んァ-ンー一-龯a-zA-Z0-9\s\-・,，.。()（）]+$/;
    if (!allowedPattern.test(trimmedName)) {
      errors.push('使用可能な文字は、ひらがな、カタカナ、漢字、英数字、一般的な記号のみです');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 複数の食材名を一括バリデーション
 */
export function validateMultipleIngredients(
  names: string[],
  existingIngredients: string[] = [],
  options: Partial<IngredientValidationOptions> = {}
): {
  results: Array<{ name: string; result: ValidationResult }>;
  globalErrors: string[];
  validNames: string[];
  invalidNames: string[];
} {
  const opts = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const results: Array<{ name: string; result: ValidationResult }> = [];
  const globalErrors: string[] = [];
  const validNames: string[] = [];
  const invalidNames: string[] = [];

  // 全体的な制限チェック
  if (names.length + existingIngredients.length > opts.maxIngredients) {
    globalErrors.push(
      `追加可能な食材数の上限（${opts.maxIngredients}個）を超えています`
    );
  }

  // 入力された食材間での重複チェック
  const inputNamesLower = names.map(name => name.trim().toLowerCase());
  const duplicateInputs = inputNamesLower.filter(
    (name, index) => inputNamesLower.indexOf(name) !== index
  );

  if (duplicateInputs.length > 0 && !opts.allowDuplicates) {
    globalErrors.push('入力された食材に重複があります');
  }

  // 各食材の個別バリデーション
  let cumulativeIngredients = [...existingIngredients];

  names.forEach(name => {
    const result = validateIngredientName(name, cumulativeIngredients, options);
    results.push({ name, result });

    if (result.isValid) {
      validNames.push(name.trim());
      cumulativeIngredients.push(name.trim());
    } else {
      invalidNames.push(name.trim());
    }
  });

  return {
    results,
    globalErrors,
    validNames,
    invalidNames,
  };
}

/**
 * カンマ区切り文字列から食材リストを抽出・バリデーション
 */
export function validateCommaSeparatedIngredients(
  input: string,
  existingIngredients: string[] = [],
  options: Partial<IngredientValidationOptions> = {}
) {
  if (!input.trim()) {
    return {
      results: [],
      globalErrors: ['食材を入力してください'],
      validNames: [],
      invalidNames: [],
    };
  }

  // カンマ区切りで分割
  const names = input
    .split(/[,，]/) // 日本語カンマも対応
    .map(name => name.trim())
    .filter(name => name.length > 0);

  if (names.length === 0) {
    return {
      results: [],
      globalErrors: ['有効な食材名が見つかりません'],
      validNames: [],
      invalidNames: [],
    };
  }

  return validateMultipleIngredients(names, existingIngredients, options);
}

/**
 * 食材名の正規化（トリミング、文字変換など）
 */
export function normalizeIngredientName(name: string): string {
  return name
    .trim()
    // 全角英数字を半角に変換
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    // 全角スペースを半角に変換
    .replace(/　/g, ' ')
    // 連続するスペースを1つにまとめ
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 食材名の自動補正提案
 */
export function suggestCorrections(name: string): string[] {
  const suggestions: string[] = [];
  const normalized = normalizeIngredientName(name);

  if (normalized !== name) {
    suggestions.push(normalized);
  }

  // 一般的なタイポの修正
  const typoCorrections: Record<string, string> = {
    'たまねぎ': 'たまねぎ',
    'たまのぎ': 'たまねぎ',
    'じゃがいも': 'じゃがいも',
    'じゃがりいも': 'じゃがいも',
    'にんじん': 'にんじん',
    'にいじん': 'にんじん',
  };

  Object.entries(typoCorrections).forEach(([typo, correct]) => {
    if (name.includes(typo) && !suggestions.includes(correct)) {
      suggestions.push(correct);
    }
  });

  return suggestions.slice(0, 3); // 最大3つまで
}