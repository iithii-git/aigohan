import { Injectable, Logger } from '@nestjs/common';
import { Recipe } from '../../ai/types/recipe.types';

@Injectable()
export class RecipeEnhancerService {
  private readonly logger = new Logger(RecipeEnhancerService.name);

  enhanceRecipe(recipe: Recipe): Recipe {
    this.logger.debug('Enhancing recipe', { title: recipe.title });

    const enhanced: Recipe = {
      title: this.enhanceTitle(recipe.title),
      description: this.enhanceDescription(recipe.description),
      ingredients: this.enhanceIngredients(recipe.ingredients),
      instructions: this.enhanceInstructions(recipe.instructions),
      cookingTime: this.validateCookingTime(recipe.cookingTime),
      servings: this.validateServings(recipe.servings),
    };

    this.logger.debug('Recipe enhancement completed', {
      originalTitle: recipe.title,
      enhancedTitle: enhanced.title,
      ingredientCount: enhanced.ingredients.length,
      instructionCount: enhanced.instructions.length,
    });

    return enhanced;
  }

  private enhanceTitle(title: string): string {
    let enhanced = title.trim();
    
    // タイトルの長さ制限
    if (enhanced.length > 100) {
      enhanced = enhanced.substring(0, 97) + '...';
    }

    // 末尾の句読点を除去
    enhanced = enhanced.replace(/[。、！？\.\,\!\?]+$/, '');

    // 先頭を大文字にする（英語の場合）
    if (/^[a-z]/.test(enhanced)) {
      enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
    }

    return enhanced;
  }

  private enhanceDescription(description: string): string {
    let enhanced = description.trim();
    
    // 説明の長さ制限
    if (enhanced.length > 500) {
      enhanced = enhanced.substring(0, 497) + '...';
    }

    // 末尾に適切な句読点を追加
    if (enhanced && !enhanced.match(/[。！？\.\!\?]$/)) {
      // 日本語の場合は「。」を追加
      if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(enhanced)) {
        enhanced += '。';
      }
      // 英語の場合は「.」を追加
      else if (/[a-zA-Z]/.test(enhanced)) {
        enhanced += '.';
      }
    }

    return enhanced;
  }

  private enhanceIngredients(ingredients: string[]): string[] {
    // 重複除去
    const uniqueIngredients = [...new Set(ingredients.map(ing => ing.trim()))];
    
    // 空の食材を除去
    const validIngredients = uniqueIngredients.filter(ing => ing.length > 0);

    // 食材の整理とフォーマット
    const enhancedIngredients = validIngredients.map(ingredient => {
      let enhanced = ingredient.trim();
      
      // 先頭の「・」「-」「*」を除去
      enhanced = enhanced.replace(/^[・\-\*\s]+/, '');
      
      // 末尾の句読点を除去
      enhanced = enhanced.replace(/[。、]+$/, '');
      
      // 食材名の長さ制限
      if (enhanced.length > 150) {
        enhanced = enhanced.substring(0, 147) + '...';
      }

      return enhanced;
    });

    // 食材を種類別にソートする簡単なロジック
    return this.sortIngredients(enhancedIngredients);
  }

  private enhanceInstructions(instructions: string[]): string[] {
    const enhancedInstructions = instructions
      .map((instruction, index) => {
        let enhanced = instruction.trim();
        
        // 先頭の番号や記号を除去
        enhanced = enhanced.replace(/^[\d\.\)\s\-\*・]+/, '');
        
        // 手順番号を統一形式で追加
        const stepNumber = index + 1;
        enhanced = `${stepNumber}. ${enhanced}`;
        
        // 末尾に適切な句読点を追加
        if (!enhanced.match(/[。！？\.\!\?]$/)) {
          if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(enhanced)) {
            enhanced += '。';
          } else if (/[a-zA-Z]/.test(enhanced)) {
            enhanced += '.';
          }
        }
        
        // 手順の長さ制限
        if (enhanced.length > 300) {
          enhanced = enhanced.substring(0, 297) + '...';
        }

        return enhanced;
      })
      .filter(instruction => instruction.length > 3); // 空に近い手順を除去

    return enhancedInstructions;
  }

  private sortIngredients(ingredients: string[]): string[] {
    // 簡単なソートロジック：主要食材、調味料、その他の順
    const mainIngredients: string[] = [];
    const seasonings: string[] = [];
    const others: string[] = [];

    const seasoningKeywords = ['塩', 'しょうゆ', '醤油', '味噌', 'みそ', 'ソース', '砂糖', 'みりん', '酒', '酢', '胡椒', 'コショウ', '油', 'オイル', 'バター'];

    ingredients.forEach(ingredient => {
      const isSeasonging = seasoningKeywords.some(keyword => 
        ingredient.toLowerCase().includes(keyword.toLowerCase())
      );

      if (isSeasonging) {
        seasonings.push(ingredient);
      } else if (ingredient.length < 10) {
        // 短い名前は調味料の可能性が高い
        seasonings.push(ingredient);
      } else {
        mainIngredients.push(ingredient);
      }
    });

    // 各カテゴリ内でアルファベット順にソート
    return [
      ...mainIngredients.sort(),
      ...seasonings.sort(),
      ...others.sort()
    ];
  }

  private validateCookingTime(cookingTime?: number): number | undefined {
    if (cookingTime === undefined || cookingTime === null) {
      return undefined;
    }

    // 調理時間の妥当性チェック
    if (cookingTime < 1) return 5; // 最小5分
    if (cookingTime > 480) return 480; // 最大8時間

    return Math.round(cookingTime);
  }

  private validateServings(servings?: number): number | undefined {
    if (servings === undefined || servings === null) {
      return undefined;
    }

    // 人数分の妥当性チェック
    if (servings < 1) return 1; // 最小1人分
    if (servings > 20) return 20; // 最大20人分

    return Math.round(servings);
  }

  validateRecipeQuality(recipe: Recipe): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // タイトルの品質チェック
    if (!recipe.title || recipe.title.length < 3) {
      issues.push('レシピタイトルが短すぎます');
    }

    // 食材の品質チェック
    if (recipe.ingredients.length === 0) {
      issues.push('食材リストが空です');
    }

    if (recipe.ingredients.length < 2) {
      issues.push('食材が少なすぎます（推奨：2個以上）');
    }

    // 手順の品質チェック
    if (recipe.instructions.length === 0) {
      issues.push('調理手順が空です');
    }

    if (recipe.instructions.length < 2) {
      issues.push('調理手順が少なすぎます（推奨：2ステップ以上）');
    }

    // 説明の品質チェック
    if (!recipe.description || recipe.description.length < 10) {
      issues.push('レシピの説明が短すぎます');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}