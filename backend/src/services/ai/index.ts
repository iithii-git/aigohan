// AIプロバイダ抽象インターフェース

import type { Recipe } from '../../schemas/recipe.js';

export interface ImageData {
  base64: string;
  mimeType: string;
}

export interface AIProvider {
  generateRecipe(
    ingredients: string[],
    preferences?: string,
    images?: ImageData[]
  ): Promise<Recipe>;
}

export interface GenerateRecipeOptions {
  ingredients: string[];
  preferences?: string;
  images?: ImageData[]; // base64エンコードされた画像とMIMEタイプの配列
}

