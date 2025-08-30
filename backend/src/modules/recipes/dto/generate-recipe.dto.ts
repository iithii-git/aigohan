import { IsArray, IsNotEmpty, IsString, ArrayNotEmpty, ArrayMaxSize } from 'class-validator';
import { Transform } from 'class-transformer';

export class GenerateRecipeDto {
  @IsArray()
  @ArrayNotEmpty({ message: '少なくとも1つの食材を指定してください' })
  @ArrayMaxSize(50, { message: '食材は最大50個まで指定できます' })
  @IsString({ each: true, message: '食材名は文字列で入力してください' })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(item => String(item).trim()).filter(item => item.length > 0);
    }
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return [];
  })
  ingredients: string[];
}

export class GenerateRecipeResponse {
  success: boolean;
  data?: {
    title: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    cookingTime?: number;
    servings?: number;
  };
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    requestId: string;
    processingTime: number;
    timestamp: string;
  };
  qualityInfo?: {
    hasIssues: boolean;
    issues: string[];
    enhanced: {
      titleChanged: boolean;
      ingredientsReorganized: boolean;
      instructionsReformatted: boolean;
    };
  };
}