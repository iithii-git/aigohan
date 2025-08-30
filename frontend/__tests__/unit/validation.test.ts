/**
 * バリデーション機能の単体テスト
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateIngredientName,
  validateMultipleIngredients,
  validateCommaSeparatedIngredients,
  normalizeIngredientName,
  suggestCorrections,
} from '@/lib/utils/ingredientValidation';

describe('食材名バリデーション', () => {
  describe('validateIngredientName', () => {
    it('正常な食材名を受け入れる', () => {
      const result = validateIngredientName('にんじん');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('空文字を拒否する', () => {
      const result = validateIngredientName('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('食材名を入力してください');
    });

    it('スペースのみの文字列を拒否する', () => {
      const result = validateIngredientName('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('食材名を入力してください');
    });

    it('重複食材を検出する', () => {
      const existingIngredients = ['にんじん', 'たまねぎ'];
      const result = validateIngredientName('にんじん', existingIngredients);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('この食材は既に追加されています');
    });

    it('大文字小文字を区別せずに重複を検出する', () => {
      const existingIngredients = ['にんじん'];
      const result = validateIngredientName('ニンジン', existingIngredients);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('この食材は既に追加されています');
    });

    it('長さ制限を検証する', () => {
      const shortResult = validateIngredientName('a', [], { minLength: 2 });
      expect(shortResult.isValid).toBe(false);
      expect(shortResult.errors).toContain('食材名は2文字以上で入力してください');

      const longName = 'a'.repeat(101);
      const longResult = validateIngredientName(longName, [], { maxLength: 100 });
      expect(longResult.isValid).toBe(false);
      expect(longResult.errors).toContain('食材名は100文字以内で入力してください');
    });

    it('危険な文字を検出する', () => {
      const htmlResult = validateIngredientName('<script>alert("xss")</script>');
      expect(htmlResult.isValid).toBe(false);
      expect(htmlResult.errors).toContain('HTMLタグは使用できません');

      const specialResult = validateIngredientName('食材<>{}[]\\');
      expect(specialResult.isValid).toBe(false);
      expect(specialResult.errors).toContain('使用できない特殊文字が含まれています');
    });

    it('SQLインジェクション試行を検出する', () => {
      const result = validateIngredientName("'; DROP TABLE ingredients; --");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('不正な文字列パターンが検出されました');
    });

    it('警告を生成する', () => {
      const result = validateIngredientName('12345');
      expect(result.warnings).toContain('数字のみの食材名は推奨されません');
    });
  });

  describe('validateMultipleIngredients', () => {
    it('複数の正常な食材を受け入れる', () => {
      const ingredients = ['にんじん', 'たまねぎ', 'じゃがいも'];
      const result = validateMultipleIngredients(ingredients);
      
      expect(result.validNames).toHaveLength(3);
      expect(result.invalidNames).toHaveLength(0);
      expect(result.globalErrors).toHaveLength(0);
    });

    it('無効な食材を検出する', () => {
      const ingredients = ['にんじん', '', '<script>'];
      const result = validateMultipleIngredients(ingredients);
      
      expect(result.validNames).toContain('にんじん');
      expect(result.invalidNames).toHaveLength(2);
    });

    it('上限数を検証する', () => {
      const ingredients = Array(6).fill('食材');
      const result = validateMultipleIngredients(ingredients, [], { maxIngredients: 5 });
      
      expect(result.globalErrors).toContain('追加可能な食材数の上限（5個）を超えています');
    });

    it('重複する食材を検出する', () => {
      const ingredients = ['にんじん', 'たまねぎ', 'にんじん'];
      const result = validateMultipleIngredients(ingredients, [], { allowDuplicates: false });
      
      expect(result.globalErrors).toContain('入力された食材に重複があります');
    });
  });

  describe('validateCommaSeparatedIngredients', () => {
    it('カンマ区切りの食材を正しく分割して検証する', () => {
      const input = 'にんじん,たまねぎ,じゃがいも';
      const result = validateCommaSeparatedIngredients(input);
      
      expect(result.validNames).toHaveLength(3);
      expect(result.validNames).toEqual(['にんじん', 'たまねぎ', 'じゃがいも']);
    });

    it('日本語カンマを処理する', () => {
      const input = 'にんじん，たまねぎ，じゃがいも';
      const result = validateCommaSeparatedIngredients(input);
      
      expect(result.validNames).toHaveLength(3);
    });

    it('空の入力を処理する', () => {
      const result = validateCommaSeparatedIngredients('');
      expect(result.globalErrors).toContain('食材を入力してください');
    });

    it('空白を適切に処理する', () => {
      const input = ' にんじん , たまねぎ , じゃがいも ';
      const result = validateCommaSeparatedIngredients(input);
      
      expect(result.validNames).toEqual(['にんじん', 'たまねぎ', 'じゃがいも']);
    });
  });
});

describe('食材名正規化', () => {
  describe('normalizeIngredientName', () => {
    it('前後の空白を除去する', () => {
      expect(normalizeIngredientName('  にんじん  ')).toBe('にんじん');
    });

    it('全角英数字を半角に変換する', () => {
      expect(normalizeIngredientName('ポテト１２３')).toBe('ポテト123');
    });

    it('全角スペースを半角に変換する', () => {
      expect(normalizeIngredientName('牛　肉')).toBe('牛 肉');
    });

    it('連続するスペースを1つにまとめる', () => {
      expect(normalizeIngredientName('牛   肉')).toBe('牛 肉');
    });

    it('複合的な変換を行う', () => {
      expect(normalizeIngredientName('　　ポテト１２３　　　')).toBe('ポテト123');
    });
  });
});

describe('修正提案', () => {
  describe('suggestCorrections', () => {
    it('正規化提案を行う', () => {
      const suggestions = suggestCorrections('　にんじん　');
      expect(suggestions).toContain('にんじん');
    });

    it('一般的なタイポを修正する', () => {
      const suggestions = suggestCorrections('たまのぎ');
      expect(suggestions).toContain('たまねぎ');
    });

    it('修正提案の上限を守る', () => {
      const suggestions = suggestCorrections('test');
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('修正不要な場合は空配列を返す', () => {
      const suggestions = suggestCorrections('にんじん');
      expect(suggestions).toHaveLength(0);
    });
  });
});

describe('セキュリティテスト', () => {
  it('XSS攻撃を防ぐ', () => {
    const xssAttempts = [
      '<img src=x onerror=alert(1)>',
      'javascript:alert("xss")',
      '<svg onload=alert(1)>',
      'vbscript:msgbox("xss")',
    ];

    xssAttempts.forEach(attempt => {
      const result = validateIngredientName(attempt);
      expect(result.isValid).toBe(false);
    });
  });

  it('SQLインジェクションを防ぐ', () => {
    const sqlAttempts = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "UNION SELECT * FROM ingredients",
      "INSERT INTO users VALUES",
    ];

    sqlAttempts.forEach(attempt => {
      const result = validateIngredientName(attempt);
      expect(result.isValid).toBe(false);
    });
  });

  it('制御文字を拒否する', () => {
    const controlChars = [
      'test\x00null',
      'test\x01control',
      'test\x7fdelete',
    ];

    controlChars.forEach(input => {
      const result = validateIngredientName(input);
      expect(result.isValid).toBe(false);
    });
  });
});

describe('パフォーマンステスト', () => {
  it('大量の食材を効率的に処理する', () => {
    const manyIngredients = Array(1000).fill(0).map((_, i) => `食材${i}`);
    
    const startTime = performance.now();
    const result = validateMultipleIngredients(manyIngredients);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
    expect(result.validNames).toHaveLength(1000);
  });

  it('長い文字列を効率的に処理する', () => {
    const longString = 'あ'.repeat(10000);
    
    const startTime = performance.now();
    const result = validateIngredientName(longString);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(100); // 100ms以内
    expect(result.isValid).toBe(false); // 長すぎるため無効
  });
});