import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AIGenerationError } from '../../modules/ai/types/recipe.types';

@Catch()
export class AiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception);
    
    this.logger.error('AI Service Exception', {
      path: request.url,
      method: request.method,
      error: errorResponse,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(errorResponse.statusCode).json({
      success: false,
      error: {
        code: errorResponse.code,
        message: errorResponse.message,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private buildErrorResponse(exception: unknown): {
    statusCode: number;
    code: string;
    message: string;
  } {
    // AIGenerationError の処理
    if (this.isAIGenerationError(exception)) {
      switch (exception.code) {
        case 'VALIDATION_ERROR':
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            code: 'INVALID_REQUEST',
            message: `入力データが不正です: ${exception.message}`,
          };
        case 'PARSING_ERROR':
          return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            code: 'AI_RESPONSE_ERROR',
            message: 'AIからの応答を処理できませんでした。再試行してください。',
          };
        case 'AI_API_ERROR':
          return {
            statusCode: HttpStatus.BAD_GATEWAY,
            code: 'AI_SERVICE_UNAVAILABLE',
            message: 'AI サービスに接続できません。しばらく待ってから再試行してください。',
          };
        default:
          return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            code: 'AI_SERVICE_ERROR',
            message: 'AI サービスでエラーが発生しました。',
          };
      }
    }

    // HTTP例外の処理
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        statusCode: status,
        code: this.getErrorCodeFromStatus(status),
        message: exception.message,
      };
    }

    // 一般的なエラーの処理
    if (exception instanceof Error) {
      // 特定のエラーメッセージパターンの処理
      if (exception.message.includes('API key')) {
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'CONFIGURATION_ERROR',
          message: 'サービス設定に問題があります。',
        };
      }

      if (exception.message.includes('timeout') || exception.message.includes('TIMEOUT')) {
        return {
          statusCode: HttpStatus.REQUEST_TIMEOUT,
          code: 'REQUEST_TIMEOUT',
          message: 'リクエストがタイムアウトしました。再試行してください。',
        };
      }

      if (exception.message.includes('rate limit') || exception.message.includes('quota')) {
        return {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
        };
      }
    }

    // デフォルトのサーバーエラー
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: '内部サーバーエラーが発生しました。',
    };
  }

  private isAIGenerationError(exception: unknown): exception is AIGenerationError {
    return (
      exception instanceof Error &&
      'code' in exception &&
      typeof (exception as any).code === 'string' &&
      ['AI_API_ERROR', 'PARSING_ERROR', 'VALIDATION_ERROR'].includes((exception as any).code)
    );
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.REQUEST_TIMEOUT:
        return 'REQUEST_TIMEOUT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';
      case HttpStatus.BAD_GATEWAY:
        return 'BAD_GATEWAY';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'HTTP_ERROR';
    }
  }
}