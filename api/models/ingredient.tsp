import "@typespec/http";

using TypeSpec.Http;

@doc("食材情報")
model Ingredient {
  @doc("食材名")
  name: string;
}