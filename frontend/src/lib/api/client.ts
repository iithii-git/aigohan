import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ErrorInfo } from '@/types/api';

// API設定
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Axiosインスタンス作成
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30秒タイムアウト (AI処理のため長めに設定)
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター
apiClient.interceptors.request.use(
  (config) => {
    // リクエストIDを追加
    const requestId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    config.headers['X-Request-ID'] = requestId;
    
    console.log(`API Request [${requestId}]:`, {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
    });
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const requestId = response.config.headers['X-Request-ID'];
    console.log(`API Response [${requestId}]:`, {
      status: response.status,
      statusText: response.statusText,
      data: response.data?.success !== undefined ? 
        { success: response.data.success, dataType: typeof response.data.data } : 
        'unknown',
    });
    
    return response;
  },
  (error: AxiosError) => {
    const requestId = error.config?.headers?.['X-Request-ID'];
    
    console.error(`API Error [${requestId}]:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data,
    });
    
    // APIエラーレスポンスを標準化
    const apiError = createApiError(error);
    return Promise.reject(apiError);
  }
);

// APIエラーオブジェクト作成
function createApiError(error: AxiosError): ApiError {
  const response = error.response;
  
  if (response?.data && typeof response.data === 'object' && 'error' in response.data) {
    // バックエンドからの構造化エラー
    const backendError = response.data as ApiResponse<never>;
    return new ApiError(
      backendError.error?.message || error.message,
      response.status,
      backendError.error?.code || 'API_ERROR',
      backendError
    );
  }
  
  // ネットワークエラーまたは予期しないエラー
  const errorCode = response?.status 
    ? `HTTP_${response.status}`
    : error.code || 'NETWORK_ERROR';
  
  const errorMessage = response?.status 
    ? `HTTP ${response.status}: ${error.message}`
    : error.message || 'ネットワークエラーが発生しました';
  
  return new ApiError(errorMessage, response?.status, errorCode);
}

// カスタムエラークラス
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public apiResponse?: ApiResponse<never>
  ) {
    super(message);
    this.name = 'ApiError';
  }
  
  get isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR' || this.code === 'ECONNREFUSED';
  }
  
  get isServerError(): boolean {
    return this.status ? this.status >= 500 : false;
  }
  
  get isClientError(): boolean {
    return this.status ? this.status >= 400 && this.status < 500 : false;
  }
}

// マルチパートフォームデータ用のクライアント
export const createMultipartClient = (): AxiosInstance => {
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // レシピ生成は1分まで
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default apiClient;