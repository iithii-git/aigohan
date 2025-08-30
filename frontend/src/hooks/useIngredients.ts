import { useState, useCallback, useMemo } from 'react';
import {
  validateIngredientName as validateName,
  validateMultipleIngredients,
  validateCommaSeparatedIngredients,
  normalizeIngredientName,
  suggestCorrections,
  type ValidationResult,
  type IngredientValidationOptions,
} from '@/lib/utils/ingredientValidation';

// 食材データの型定義
export interface Ingredient {
  id: string;
  name: string;
  category?: string;
  addedAt: Date;
  isEditing?: boolean;
}

// バリデーション結果の型定義（拡張版）
export interface IngredientValidation extends ValidationResult {
  suggestions?: string[];
}

// フックのオプション
export interface UseIngredientsOptions {
  maxIngredients?: number;
  allowDuplicates?: boolean;
  autoTrim?: boolean;
  minLength?: number;
  maxLength?: number;
}

// フックの戻り値の型
export interface UseIngredientsReturn {
  ingredients: Ingredient[];
  isLoading: boolean;
  errors: string[];
  warnings: string[];
  totalCount: number;
  canAddMore: boolean;
  addIngredient: (name: string, category?: string) => Promise<boolean>;
  addMultipleIngredients: (names: string[]) => Promise<Ingredient[]>;
  addCommaSeparatedIngredients: (input: string) => Promise<Ingredient[]>;
  updateIngredient: (id: string, name: string, category?: string) => boolean;
  removeIngredient: (id: string) => boolean;
  clearIngredients: () => void;
  clearErrors: () => void;
  clearWarnings: () => void;
  getIngredientById: (id: string) => Ingredient | undefined;
  validateIngredientName: (name: string, excludeId?: string) => IngredientValidation;
  validateCommaSeparated: (input: string) => { validNames: string[]; invalidNames: string[]; errors: string[] };
  toggleEditing: (id: string) => void;
  reorderIngredients: (startIndex: number, endIndex: number) => void;
  getIngredientsByCategory: () => Record<string, Ingredient[]>;
  exportIngredients: () => string[];
  importIngredients: (names: string[]) => Promise<Ingredient[]>;
}

// デフォルトオプション
const DEFAULT_OPTIONS: Required<UseIngredientsOptions> = {
  maxIngredients: 50,
  allowDuplicates: false,
  autoTrim: true,
  minLength: 1,
  maxLength: 100,
};

/**
 * 食材管理用カスタムフック
 */
export function useIngredients(
  options: UseIngredientsOptions = {}
): UseIngredientsReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // 状態管理
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // 派生値の計算
  const totalCount = ingredients.length;
  const canAddMore = totalCount < opts.maxIngredients;

  /**
   * 食材名のバリデーション（包括的バージョン）
   */
  const validateIngredientName = useCallback((
    name: string, 
    excludeId?: string
  ): IngredientValidation => {
    // 現在の食材リストから対象を除外
    const existingNames = ingredients
      .filter(ing => ing.id !== excludeId)
      .map(ing => ing.name);

    // 新しいバリデーションシステムを使用
    const validationOptions: Partial<IngredientValidationOptions> = {
      minLength: opts.minLength,
      maxLength: opts.maxLength,
      allowDuplicates: opts.allowDuplicates,
      maxIngredients: opts.maxIngredients,
      allowEmptySpaces: false,
      strictMode: false,
    };

    const result = validateName(name, existingNames, validationOptions);
    
    // 修正提案を追加
    const suggestions = suggestCorrections(name);

    return {
      ...result,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }, [ingredients, opts]);

  /**
   * 食材を1つ追加
   */
  const addIngredient = useCallback(async (
    name: string, 
    category?: string
  ): Promise<boolean> => {
    if (!canAddMore) {
      setErrors([`食材は最大${opts.maxIngredients}個まで追加できます`]);
      return false;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      const validation = validateIngredientName(name);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        return false;
      }

      const trimmedName = opts.autoTrim ? name.trim() : name;
      const newIngredient: Ingredient = {
        id: `ingredient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: trimmedName,
        category: category || '未分類',
        addedAt: new Date(),
        isEditing: false,
      };

      setIngredients(prev => [...prev, newIngredient]);
      
      console.log('Added ingredient:', newIngredient.name);
      return true;
    } catch (error) {
      console.error('Failed to add ingredient:', error);
      setErrors(['食材の追加に失敗しました']);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [canAddMore, opts.maxIngredients, opts.autoTrim, validateIngredientName]);

  /**
   * 複数の食材を一度に追加
   */
  const addMultipleIngredients = useCallback(async (names: string[]): Promise<Ingredient[]> => {
    const addedIngredients: Ingredient[] = [];
    const addErrors: string[] = [];

    setIsLoading(true);
    setErrors([]);

    try {
      for (const name of names) {
        if (ingredients.length + addedIngredients.length >= opts.maxIngredients) {
          addErrors.push(`上限数に達したため、「${name}」以降は追加されませんでした`);
          break;
        }

        const validation = validateIngredientName(name);
        if (validation.isValid) {
          const trimmedName = opts.autoTrim ? name.trim() : name;
          const newIngredient: Ingredient = {
            id: `ingredient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: trimmedName,
            category: '未分類',
            addedAt: new Date(),
            isEditing: false,
          };
          addedIngredients.push(newIngredient);
        } else {
          addErrors.push(`${name}: ${validation.errors.join(', ')}`);
        }
      }

      if (addedIngredients.length > 0) {
        setIngredients(prev => [...prev, ...addedIngredients]);
      }

      if (addErrors.length > 0) {
        setErrors(addErrors);
      }

      console.log(`Added ${addedIngredients.length} ingredients:`, 
        addedIngredients.map(ing => ing.name)
      );

      return addedIngredients;
    } catch (error) {
      console.error('Failed to add multiple ingredients:', error);
      setErrors(['食材の一括追加に失敗しました']);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [ingredients.length, opts.maxIngredients, opts.autoTrim, validateIngredientName]);

  /**
   * 食材を更新
   */
  const updateIngredient = useCallback((
    id: string, 
    name: string, 
    category?: string
  ): boolean => {
    const validation = validateIngredientName(name, id);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return false;
    }

    const trimmedName = opts.autoTrim ? name.trim() : name;
    
    setIngredients(prev => prev.map(ingredient => 
      ingredient.id === id 
        ? { 
            ...ingredient, 
            name: trimmedName, 
            category: category || ingredient.category,
            isEditing: false 
          }
        : ingredient
    ));

    setErrors([]);
    console.log('Updated ingredient:', id, '->', trimmedName);
    return true;
  }, [validateIngredientName, opts.autoTrim]);

  /**
   * 食材を削除
   */
  const removeIngredient = useCallback((id: string): boolean => {
    const ingredient = ingredients.find(ing => ing.id === id);
    if (!ingredient) {
      return false;
    }

    setIngredients(prev => prev.filter(ing => ing.id !== id));
    setErrors([]);
    console.log('Removed ingredient:', ingredient.name);
    return true;
  }, [ingredients]);

  /**
   * 全食材をクリア
   */
  const clearIngredients = useCallback(() => {
    setIngredients([]);
    setErrors([]);
    setWarnings([]);
    console.log('Cleared all ingredients');
  }, []);

  /**
   * エラーをクリア
   */
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  /**
   * 警告をクリア
   */
  const clearWarnings = useCallback(() => {
    setWarnings([]);
  }, []);

  /**
   * カンマ区切り文字列のバリデーション
   */
  const validateCommaSeparated = useCallback((input: string) => {
    const existingNames = ingredients.map(ing => ing.name);
    const validationOptions: Partial<IngredientValidationOptions> = {
      minLength: opts.minLength,
      maxLength: opts.maxLength,
      allowDuplicates: opts.allowDuplicates,
      maxIngredients: opts.maxIngredients,
      allowEmptySpaces: false,
      strictMode: false,
    };

    const result = validateCommaSeparatedIngredients(input, existingNames, validationOptions);
    return {
      validNames: result.validNames,
      invalidNames: result.invalidNames,
      errors: [...result.globalErrors, ...result.results.flatMap(r => r.result.errors)],
    };
  }, [ingredients, opts]);

  /**
   * カンマ区切り文字列から食材を一括追加
   */
  const addCommaSeparatedIngredients = useCallback(async (input: string): Promise<Ingredient[]> => {
    const validation = validateCommaSeparated(input);
    
    if (validation.errors.length > 0) {
      setErrors(validation.errors);
      return [];
    }

    return await addMultipleIngredients(validation.validNames);
  }, [validateCommaSeparated, addMultipleIngredients]);

  /**
   * IDで食材を取得
   */
  const getIngredientById = useCallback((id: string): Ingredient | undefined => {
    return ingredients.find(ing => ing.id === id);
  }, [ingredients]);

  /**
   * 編集状態をトグル
   */
  const toggleEditing = useCallback((id: string) => {
    setIngredients(prev => prev.map(ingredient =>
      ingredient.id === id
        ? { ...ingredient, isEditing: !ingredient.isEditing }
        : ingredient
    ));
  }, []);

  /**
   * 食材の順序を変更
   */
  const reorderIngredients = useCallback((startIndex: number, endIndex: number) => {
    if (startIndex < 0 || endIndex < 0 || startIndex >= ingredients.length || endIndex >= ingredients.length) {
      return;
    }

    setIngredients(prev => {
      const result = [...prev];
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });

    console.log(`Reordered ingredients: ${startIndex} -> ${endIndex}`);
  }, [ingredients.length]);

  /**
   * カテゴリー別に食材を取得
   */
  const getIngredientsByCategory = useCallback((): Record<string, Ingredient[]> => {
    return ingredients.reduce((acc, ingredient) => {
      const category = ingredient.category || '未分類';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(ingredient);
      return acc;
    }, {} as Record<string, Ingredient[]>);
  }, [ingredients]);

  /**
   * 食材リストをエクスポート
   */
  const exportIngredients = useCallback((): string[] => {
    return ingredients.map(ingredient => ingredient.name);
  }, [ingredients]);

  /**
   * 食材リストをインポート
   */
  const importIngredients = useCallback(async (names: string[]): Promise<Ingredient[]> => {
    return await addMultipleIngredients(names);
  }, [addMultipleIngredients]);

  return {
    ingredients,
    isLoading,
    errors,
    warnings,
    totalCount,
    canAddMore,
    addIngredient,
    addMultipleIngredients,
    addCommaSeparatedIngredients,
    updateIngredient,
    removeIngredient,
    clearIngredients,
    clearErrors,
    clearWarnings,
    getIngredientById,
    validateIngredientName,
    validateCommaSeparated,
    toggleEditing,
    reorderIngredients,
    getIngredientsByCategory,
    exportIngredients,
    importIngredients,
  };
}