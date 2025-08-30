'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // サーバー状態は5分間新しいデータとして扱う
            staleTime: 5 * 60 * 1000, // 5 minutes
            // キャッシュは10分間保持
            gcTime: 10 * 60 * 1000, // 10 minutes (旧cacheTime)
            // エラー時のリトライ設定
            retry: (failureCount, error) => {
              // 4xx エラーはリトライしない
              if (error instanceof Error && 'status' in error) {
                const status = (error as any).status;
                if (status >= 400 && status < 500) return false;
              }
              // 最大3回までリトライ
              return failureCount < 3;
            },
            // リトライ間隔（指数バックオフ）
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // ミューテーションのリトライ設定
            retry: (failureCount, error) => {
              // 4xx エラーはリトライしない
              if (error instanceof Error && 'status' in error) {
                const status = (error as any).status;
                if (status >= 400 && status < 500) return false;
              }
              // 最大1回までリトライ
              return failureCount < 1;
            },
            retryDelay: 3000, // 3秒待機
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 開発環境でのみReact Query Devtoolsを表示 */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}