import "@typespec/http";

using TypeSpec.Http;

@doc("API統一レスポンス形式")
model ApiResponse<T> {
  @doc("処理成功フラグ")
  success: boolean;

  @doc("レスポンスデータ")
  data?: T;

  @doc("エラー情報")
  error?: ErrorInfo;
}

@doc("エラー情報")
model ErrorInfo {
  @doc("エラーコード")
  code: string;

  @doc("エラーメッセージ")
  message: string;
}