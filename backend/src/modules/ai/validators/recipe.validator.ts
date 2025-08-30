import { IsString, IsArray, IsOptional, IsNumber, Min, Max, ArrayNotEmpty, IsNotEmpty, validateSync } from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';
import { Recipe } from '../types/recipe.types';

export class RecipeDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) => value?.filter((item: string) => item?.trim().length > 0))
  ingredients: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) => value?.filter((item: string) => item?.trim().length > 0))
  instructions: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440) // 最大24時間
  cookingTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50) // 最大50人分
  servings?: number;
}

export class RecipeValidator {
  static validate(data: any): Recipe {
    // データの前処理
    const processedData = {
      ...data,
      title: String(data.title || '').trim(),
      description: String(data.description || '').trim(),
      ingredients: Array.isArray(data.ingredients) 
        ? data.ingredients.map(item => String(item || '').trim()).filter(item => item.length > 0)
        : [],
      instructions: Array.isArray(data.instructions) 
        ? data.instructions.map(item => String(item || '').trim()).filter(item => item.length > 0)
        : [],
      cookingTime: data.cookingTime ? Number(data.cookingTime) : undefined,
      servings: data.servings ? Number(data.servings) : undefined,
    };

    // DTOに変換
    const recipeDto = plainToClass(RecipeDto, processedData);

    // バリデーション実行
    const errors = validateSync(recipeDto);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => {
        const constraints = error.constraints ? Object.values(error.constraints) : [];
        return `${error.property}: ${constraints.join(', ')}`;
      });
      
      throw new Error(`Recipe validation failed: ${errorMessages.join('; ')}`);
    }

    return {
      title: recipeDto.title,
      description: recipeDto.description,
      ingredients: recipeDto.ingredients,
      instructions: recipeDto.instructions,
      cookingTime: recipeDto.cookingTime,
      servings: recipeDto.servings,
    };
  }

  static validateIngredients(ingredients: string[]): void {
    if (!Array.isArray(ingredients)) {
      throw new Error('Ingredients must be an array');
    }

    if (ingredients.length === 0) {
      throw new Error('At least one ingredient is required');
    }

    const validIngredients = ingredients.filter(ingredient => 
      typeof ingredient === 'string' && ingredient.trim().length > 0
    );

    if (validIngredients.length === 0) {
      throw new Error('At least one valid ingredient is required');
    }

    if (validIngredients.length > 50) {
      throw new Error('Too many ingredients (maximum 50)');
    }
  }

  static validateImages(images?: Buffer[]): void {
    if (!images || images.length === 0) {
      return; // 画像は必須ではない
    }

    if (images.length > 10) {
      throw new Error('Too many images (maximum 10)');
    }

    for (const image of images) {
      if (!Buffer.isBuffer(image)) {
        throw new Error('Invalid image format');
      }

      // 画像サイズの制限（5MB）
      if (image.length > 5 * 1024 * 1024) {
        throw new Error('Image file too large (maximum 5MB)');
      }
    }
  }
}