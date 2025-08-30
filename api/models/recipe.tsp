import "@typespec/http";

using TypeSpec.Http;

@doc("レシピ情報")
model Recipe {
  @doc("レシピタイトル")
  title: string;

  @doc("レシピの説明")
  description: string;

  @doc("使用する材料リスト")
  ingredients: string[];

  @doc("調理手順")
  instructions: string[];

  @doc("調理時間（分）")
  cookingTime?: int32;

  @doc("人数分")
  servings?: int32;
}

@doc("レシピ生成リクエスト")
model RecipeGenerationRequest {
  @doc("使用する食材リスト")
  ingredients: string[];
}