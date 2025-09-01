## フロントエンドの処理順（Next.js App Router／本プロジェクト）

- 現在このリポジトリには `middleware.ts` は存在しません（リポジトリ直下の `frontend/` 配下にも未定義）。
- そのため、`/` へのリクエスト時は Next.js の標準フローで `app/layout.tsx` → `app/page.tsx` の順に評価され、`page.tsx` が画面の起点となります。
- `page.tsx` は `RecipeIdeaScreen`（統合画面）を描画し、そこから各機能コンポーネントが連携します。

```mermaid
flowchart TD
  A[ブラウザから / へアクセス] -->|middleware.ts があれば| M[middleware.ts]
  A -->|本プロジェクト: なし| L[app/layout.tsx]
  M --> L
  L --> P[app/page.tsx]
  P --> S[RecipeIdeaScreen]
  S --> I[IngredientInputSection]
  S --> T[TasteProfileSelector]
  S --> G[GenerateRecipeButton]
  S --> U[ImageUploadModal]
  S --> R[RecipeDisplay]
```

### レシピ生成操作時のフロー

```mermaid
sequenceDiagram
  participant User as ユーザー
  participant Page as app/page.tsx
  participant Screen as RecipeIdeaScreen
  participant Hook as useRecipeGeneration
  participant API as Backend API

  User->>Page: "/" にアクセス
  Page->>Screen: RecipeIdeaScreen を描画
  User->>Screen: GenerateRecipeButton をクリック
  Screen->>Hook: mutateAsync(request) を実行
  Hook->>API: レシピ生成 API を呼び出し
  API-->>Hook: 成功レスポンス（Recipe）
  Hook-->>Screen: 結果を返却
  Screen->>Screen: 状態更新 currentStep: result, generatedRecipe 設定
  Screen-->>User: RecipeDisplay に結果を表示
```

### メモ
- `middleware.ts` は存在する場合のみ最初に実行されます（ルーティング前）。本プロジェクトでは未定義のため、最初に確認するファイルは `app/layout.tsx` と `app/page.tsx` になります。
- `app/page.tsx` は `'use client'` 指定のクライアントコンポーネントで、実際の画面制御は `RecipeIdeaScreen` に集約されています。


