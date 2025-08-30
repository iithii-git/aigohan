import "@typespec/http";
import "@typespec/rest";
import "./models/common.tsp";
import "./models/ingredient.tsp";
import "./models/recipe.tsp";
import "./operations/recipes.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;

@service
@server("http://localhost:3001", "Development server")
namespace AiGohanApi;