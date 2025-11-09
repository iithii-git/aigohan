// API型定義 - OpenAPI仕様に基づく

export interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime?: number;
  servings?: number;
}

export interface ErrorInfo {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorInfo;
  meta?: {
    requestId: string;
    processingTime: number;
    timestamp: string;
  };
  qualityInfo?: {
    hasIssues: boolean;
    issues: string[];
    enhanced: {
      titleChanged: boolean;
      ingredientsReorganized: boolean;
      instructionsReformatted: boolean;
    };
  };
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
}

export interface DetailedHealthResponse {
  status: string;
  timestamp: string;
  services: {
    api: { status: string; uptime: number };
    ai: { status: string; configured: boolean };
    enhancer: { status: string };
  };
  environment: {
    nodeVersion: string;
    platform: string;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
  };
}

