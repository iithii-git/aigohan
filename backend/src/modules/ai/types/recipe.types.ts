export interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime?: number;
  servings?: number;
}

export interface RecipeGenerationRequest {
  ingredients: string[];
  images?: Buffer[];
}

export interface AIGenerationError extends Error {
  code: 'AI_API_ERROR' | 'PARSING_ERROR' | 'VALIDATION_ERROR';
}