/**
 * Jest テストセットアップファイル
 */

import '@testing-library/jest-dom';

// TextEncoderとTextDecoderのポリフィル
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// matchMediaのモック (レスポンシブデザインテスト用)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// IntersectionObserverのモック
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// ResizeObserverのモック
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Web Clipboardのモック
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
    readText: jest.fn().mockImplementation(() => Promise.resolve('')),
  },
});

// Web Share APIのモック
Object.assign(navigator, {
  share: jest.fn().mockImplementation(() => Promise.resolve()),
});

// LocalStorageのモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// SessionStorageのモック
global.sessionStorage = localStorageMock as any;

// Fileオブジェクトのモック強化
global.File = class File extends Blob {
  constructor(chunks: any[], filename: string, opts?: any) {
    super(chunks, opts);
    this.name = filename;
    this.lastModified = Date.now();
  }
  name: string;
  lastModified: number;
};

// URLのモック
global.URL.createObjectURL = jest.fn().mockReturnValue('mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Performance APIのモック
if (!global.performance) {
  global.performance = {
    now: jest.fn(() => Date.now()),
  } as any;
}

// Console エラーを一時的に抑制 (テスト時の意図的なエラーの場合)
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
});

// テスト用のヘルパー関数
export const createMockFile = (
  name: string = 'test.jpg',
  type: string = 'image/jpeg',
  size: number = 1024
): File => {
  const content = 'a'.repeat(size);
  return new File([content], name, { type });
};

export const createMockFiles = (count: number): File[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockFile(`test${i}.jpg`, 'image/jpeg', 1024)
  );
};

export const mockFetch = (response: any, status: number = 200, ok: boolean = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => response,
  } as Response);
};

export const mockFetchError = (error: Error) => {
  global.fetch = jest.fn().mockRejectedValue(error);
};

// カスタムマッチャー
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidIngredient(): R;
      toHaveValidationError(expected: string): R;
    }
  }
}

expect.extend({
  toBeValidIngredient(received: any) {
    const isValid = received && 
                   typeof received.isValid === 'boolean' && 
                   Array.isArray(received.errors) &&
                   received.isValid === true &&
                   received.errors.length === 0;

    return {
      message: () =>
        `expected ${received} to be a valid ingredient validation result`,
      pass: isValid,
    };
  },

  toHaveValidationError(received: any, expected: string) {
    const hasError = received && 
                    Array.isArray(received.errors) &&
                    received.errors.includes(expected);

    return {
      message: () =>
        `expected validation result to have error "${expected}"`,
      pass: hasError,
    };
  },
});

// React Query テスト用ユーティリティ
export const createTestQueryClient = () => {
  const { QueryClient } = require('@tanstack/react-query');
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// テスト環境の設定確認
console.log('Test environment setup complete');
console.log(`Node environment: ${process.env.NODE_ENV}`);
console.log(`Test framework: Jest with Testing Library`);