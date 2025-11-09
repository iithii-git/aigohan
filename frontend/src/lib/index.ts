// ライブラリの統一エクスポート

// API関連
export { default as apiClient, createMultipartClient, ApiError } from './api/client';
export { RecipeApi, recipeApi } from './api/recipes';

// ユーティリティ関数
export {
  validateFileType,
  validateFileSize,
  validateFileCount,
  validateSingleFile,
  validateMultipleFiles,
  formatFileSize,
  getFileExtension,
  isImageFile,
  fileToDataURL,
  DEFAULT_FILE_OPTIONS,
  type FileValidationResult,
  type FileValidationOptions,
} from './utils/fileValidation';

// 食材バリデーション関数
export {
  validateIngredientName,
  validateMultipleIngredients,
  validateCommaSeparatedIngredients,
  normalizeIngredientName,
  suggestCorrections,
  DEFAULT_VALIDATION_OPTIONS,
  type ValidationResult,
  type IngredientValidationOptions,
} from './utils/ingredientValidation';

export {
  separateIngredients,
  detectSeasoningGroups,
  parseRecipeIngredients,
} from './utils/ingredientParser';