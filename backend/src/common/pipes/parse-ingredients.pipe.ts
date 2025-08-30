import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIngredientsPipe implements PipeTransform {
  transform(value: any): any {
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('Invalid request body');
    }

    // ingredientsフィールドを処理
    if (value.ingredients) {
      value.ingredients = this.parseIngredients(value.ingredients);
    }

    return value;
  }

  private parseIngredients(ingredients: any): string[] {
    let parsedIngredients: string[] = [];

    // すでに配列の場合
    if (Array.isArray(ingredients)) {
      parsedIngredients = ingredients.map(item => String(item).trim());
    }
    // JSON文字列の場合
    else if (typeof ingredients === 'string') {
      try {
        // JSON形式の場合
        if (ingredients.startsWith('[') && ingredients.endsWith(']')) {
          const parsed = JSON.parse(ingredients);
          if (Array.isArray(parsed)) {
            parsedIngredients = parsed.map(item => String(item).trim());
          } else {
            throw new Error('Parsed value is not an array');
          }
        }
        // カンマ区切りの場合
        else {
          parsedIngredients = ingredients
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);
        }
      } catch (error) {
        // JSON パースに失敗した場合、カンマ区切りとして処理
        parsedIngredients = ingredients
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
    }
    // その他の型の場合
    else {
      parsedIngredients = [String(ingredients).trim()].filter(item => item.length > 0);
    }

    // 空の要素と重複を削除
    const uniqueIngredients = [...new Set(parsedIngredients.filter(item => item.length > 0))];

    if (uniqueIngredients.length === 0) {
      throw new BadRequestException('少なくとも1つの食材を指定してください');
    }

    if (uniqueIngredients.length > 50) {
      throw new BadRequestException('食材は最大50個まで指定できます');
    }

    return uniqueIngredients;
  }
}