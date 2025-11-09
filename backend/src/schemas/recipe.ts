import { z } from 'zod';

// 入力検証スキーマ
export const ingredientsSchema = z
  .array(z.string().min(1))
  .min(1, '食材は最低1つ必要です');

export const preferencesSchema = z
  .string()
  .max(200, '好みの説明は200文字以内で入力してください')
  .optional();

// レシピ生成リクエストスキーマ
export const recipeGenerationRequestSchema = z.object({
  ingredients: ingredientsSchema,
  preferences: preferencesSchema,
});

// レシピ出力スキーマ（LLMレスポンス検証用）
export const recipeSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().min(1, '説明は必須です'),
  ingredients: z
    .array(z.string().min(1))
    .min(1, '材料は最低1つ必要です'),
  instructions: z
    .array(z.string().min(1))
    .min(1, '調理手順は最低1つ必要です'),
  cookingTime: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
});

export type RecipeGenerationRequest = z.infer<
  typeof recipeGenerationRequestSchema
>;
export type Recipe = z.infer<typeof recipeSchema>;

