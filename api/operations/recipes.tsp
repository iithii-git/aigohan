import "@typespec/http";
import "@typespec/rest";
import "../models/recipe.tsp";
import "../models/common.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;

namespace AiGohanApi {
  @tag("Recipes")
  @doc("画像と食材からレシピを生成する")
  @route("/api/recipes/generate")
  @post
  op generateRecipe(
    @multipartBody body: {
      @doc("食材リスト") ingredients: HttpPart<string[]>;
      @doc("食材画像ファイル") images?: HttpPart<bytes>[];
    }
  ): ApiResponse<Recipe> | {
    @statusCode _: 400;
    @body error: ApiResponse<never>;
  } | {
    @statusCode _: 500;
    @body error: ApiResponse<never>;
  } | {
    @statusCode _: 502;
    @body error: ApiResponse<never>;
  };
}