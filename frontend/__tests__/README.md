# AI Gohan フロントエンド テスト計画

## 概要

このドキュメントでは、AI Gohan MVPフロントエンドのテスト戦略、テストケース、および実行方法について説明します。

## テスト戦略

### 1. 単体テスト (Unit Tests)
- **対象**: 個別の関数、ユーティリティ、フック
- **ツール**: Jest + Testing Library
- **カバレッジ目標**: 70% 以上（重要なモジュールは90%以上）

### 2. 統合テスト (Integration Tests)
- **対象**: コンポーネント間の連携、APIとの統合
- **ツール**: Jest + Testing Library + MSW (Mock Service Worker)

### 3. E2Eテスト (End-to-End Tests)
- **対象**: ユーザーフローの完全な動作確認
- **ツール**: Playwright または Cypress（今後実装予定）

## テスト構成

```
__tests__/
├── setup.ts                 # テスト環境セットアップ
├── unit/                    # 単体テスト
│   ├── validation.test.ts   # バリデーション機能テスト
│   └── api.test.ts         # API関連テスト
├── integration/            # 統合テスト
│   └── userFlow.test.ts    # ユーザーフローテスト
└── README.md              # テスト計画書（このファイル）
```

## テスト実行方法

### 基本的なテスト実行

```bash
# すべてのテストを実行
npm test

# ウォッチモードでテスト実行
npm run test:watch

# カバレッジ付きでテスト実行
npm run test:coverage

# 特定のテストファイルのみ実行
npm test -- validation.test.ts

# 特定のテストケースのみ実行
npm test -- --testNamePattern="正常な食材名を受け入れる"
```

### CI/CD環境でのテスト実行

```bash
# CI環境用（ウォッチモードなし）
npm run test:ci

# カバレッジレポート生成
npm run test:coverage:ci
```

## テストカテゴリー

### 1. バリデーション機能テスト

**ファイル**: `__tests__/unit/validation.test.ts`

#### テストケース
- ✅ 正常な食材名の検証
- ✅ 空文字・スペースのみの拒否
- ✅ 重複検出（大文字小文字無視）
- ✅ 長さ制限の検証
- ✅ XSS攻撃パターンの検出
- ✅ SQLインジェクションの検出
- ✅ 制御文字の拒否
- ✅ 複数食材の一括検証
- ✅ カンマ区切り文字列の処理
- ✅ 正規化機能
- ✅ 修正提案機能
- ✅ パフォーマンステスト

### 2. API機能テスト

**ファイル**: `__tests__/unit/api.test.ts`

#### テストケース
- ✅ レシピ生成APIの正常呼び出し
- ✅ 画像付きリクエストの処理
- ✅ APIエラーハンドリング
- ✅ ネットワークエラー処理
- ✅ タイムアウト処理
- ✅ ヘルスチェック機能
- ✅ FormData構築の検証
- ✅ レスポンス形式バリデーション

### 3. ユーザーフロー統合テスト

**ファイル**: `__tests__/integration/userFlow.test.ts`

#### テストケース
- ✅ 初期状態の表示確認
- ✅ ステップインジケーターの動作
- ✅ ステップ間の遷移
- ✅ 戻る機能
- ✅ 進捗サマリーの表示
- ✅ エラーハンドリング
- ✅ リセット機能
- ✅ コンポーネント統合確認
- ✅ アクセシビリティチェック
- ✅ レスポンシブデザインテスト

## カバレッジ目標

### 全体目標
- **Line Coverage**: 70% 以上
- **Function Coverage**: 70% 以上  
- **Branch Coverage**: 70% 以上
- **Statement Coverage**: 70% 以上

### 重要ファイルの高い目標
- **ingredientValidation.ts**: 90% 以上
- **recipes.ts**: 80% 以上
- **useIngredients.ts**: 80% 以上
- **useRecipeGeneration.ts**: 80% 以上

## モックとテストデータ

### 1. API モック
- Fetch APIのモック
- レスポンスデータの模擬
- エラーレスポンスのシミュレーション

### 2. ブラウザAPI モック
- localStorage/sessionStorage
- Clipboard API
- Web Share API
- File API

### 3. テストデータ
- 各種画像ファイル（JPEG, PNG, WebP）
- 食材名リスト（正常・異常パターン）
- APIレスポンスサンプル

## テストのベストプラクティス

### 1. テストの命名規則
```typescript
describe('機能名', () => {
  it('期待される動作を説明', () => {
    // テスト実装
  });
});
```

### 2. Arrange-Act-Assert パターン
```typescript
it('正常な食材名を受け入れる', () => {
  // Arrange: テストデータの準備
  const ingredientName = 'にんじん';
  
  // Act: 実行
  const result = validateIngredientName(ingredientName);
  
  // Assert: 検証
  expect(result.isValid).toBe(true);
  expect(result.errors).toHaveLength(0);
});
```

### 3. エラーケースのテスト
- 正常系だけでなく異常系も必ずテスト
- エラーメッセージの内容も検証
- エラー境界のテスト

### 4. 非同期処理のテスト
```typescript
it('非同期処理を正しく待つ', async () => {
  await waitFor(() => {
    expect(screen.getByText('結果')).toBeInTheDocument();
  });
});
```

## 継続的な改善

### 1. テストの追加
- 新機能追加時には対応するテストも追加
- バグ修正時には再現テストケースを追加

### 2. カバレッジの監視
- PRごとにカバレッジの変化を確認
- カバレッジ低下時は追加テストを検討

### 3. パフォーマンステスト
- 大量データ処理のテスト
- メモリリーク検出
- レンダリングパフォーマンス

## 既知の制限事項

### 1. 現在未実装の項目
- E2Eテスト（Playwright/Cypress）
- ビジュアルリグレッションテスト
- 負荷テスト
- クロスブラウザテスト

### 2. テスト環境の制約
- JSDOMではCanvas APIが完全サポートされない
- 実際のファイルアップロードは模擬
- ネットワーク遅延のシミュレーションは簡易的

## トラブルシューティング

### よくある問題と解決方法

1. **テストがタイムアウトする**
   ```bash
   # タイムアウト時間を延長
   npm test -- --testTimeout=60000
   ```

2. **モックが効かない**
   ```typescript
   // jest.clearAllMocks() を beforeEach で実行
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

3. **型エラーが発生する**
   ```typescript
   // 型アサーションを使用
   const mockFn = jest.fn() as jest.MockedFunction<typeof originalFn>;
   ```

## 今後の予定

### Phase 2: E2Eテスト導入
- Playwright または Cypress の導入
- 主要ユーザーフローのE2Eテスト作成
- CI/CD パイプラインでの自動実行

### Phase 3: 高度なテスト
- ビジュアルリグレッションテスト
- パフォーマンステスト
- アクセシビリティテスト自動化

### Phase 4: 品質向上
- Mutation Testing 導入
- Property-based Testing
- Chaos Engineering 手法の適用

---

## 実行コマンド一覧

```bash
# 基本的なテスト実行
npm test                    # 全テスト実行
npm run test:watch         # ウォッチモード
npm run test:coverage      # カバレッジ付き実行
npm run test:ci           # CI環境用

# 特定のテスト実行
npm test validation        # validation関連のテスト
npm test api              # API関連のテスト
npm test integration      # 統合テスト

# レポート生成
npm run test:coverage:report  # カバレッジHTMLレポート
npm run test:junit           # JUnit形式レポート
```