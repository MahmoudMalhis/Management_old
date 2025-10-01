// utils/errorHandler.ts

import { AxiosError } from 'axios';
import {
  AppError,
  ErrorType,
  NetworkError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ServerError,
  ApiErrorResponse,
} from '@/types/errors';

/**
 * معالج الأخطاء الرئيسي
 * يحول الأخطاء المختلفة إلى أخطاء مخصصة للتطبيق
 */
export class ErrorHandler {
  /**
   * معالجة أخطاء Axios
   */
  static handleAxiosError(error: AxiosError<ApiErrorResponse>): AppError {
    // خطأ في الشبكة (لا يوجد اتصال)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return new NetworkError('انتهت مهلة الاتصال');
      }
      if (error.code === 'ERR_NETWORK') {
        return new NetworkError('فشل الاتصال بالخادم. تحقق من اتصال الإنترنت');
      }
      return new NetworkError();
    }

    const { status, data } = error.response;
    const message = data?.message || this.getDefaultMessage(status);

    // معالجة الأخطاء حسب status code
    switch (status) {
      case 400:
        if (data?.errors) {
          return new ValidationError(message, data.errors);
        }
        return new ValidationError(message);

      case 401:
        // حذف التوكن عند انتهاء الجلسة
        localStorage.removeItem('token');
        return new AuthenticationError(message);

      case 403:
        return new AuthorizationError(message);

      case 404:
        return new NotFoundError(message);

      case 413:
        return new ValidationError('الملف كبير جداً. الحد الأقصى 10 ميجابايت');

      case 422:
        return new ValidationError(message, data?.errors);

      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError(message);

      default:
        return new AppError(message, ErrorType.UNKNOWN, status);
    }
  }

  /**
   * معالجة أي نوع من الأخطاء
   */
  static handle(error: unknown): AppError {
    // إذا كان خطأ مخصص بالفعل
    if (error instanceof AppError) {
      return error;
    }

    // إذا كان خطأ Axios
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error);
    }

    // إذا كان خطأ JavaScript عادي
    if (error instanceof Error) {
      return new AppError(error.message, ErrorType.UNKNOWN);
    }

    // أي شيء آخر
    if (typeof error === 'string') {
      return new AppError(error, ErrorType.UNKNOWN);
    }

    return new AppError('حدث خطأ غير متوقع', ErrorType.UNKNOWN);
  }

  /**
   * التحقق من نوع الخطأ
   */
  private static isAxiosError(error: unknown): error is AxiosError<ApiErrorResponse> {
    return (
      typeof error === 'object' &&
      error !== null &&
      'isAxiosError' in error &&
      error.isAxiosError === true
    );
  }

  /**
   * رسائل افتراضية حسب status code
   */
  private static getDefaultMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'طلب غير صالح',
      401: 'يجب تسجيل الدخول',
      403: 'ليس لديك صلاحية',
      404: 'المورد غير موجود',
      413: 'الملف كبير جداً',
      422: 'بيانات غير صالحة',
      500: 'خطأ في الخادم',
      502: 'الخادم غير متاح',
      503: 'الخدمة غير متاحة',
      504: 'انتهت مهلة الخادم',
    };

    return messages[status] || 'حدث خطأ غير متوقع';
  }

  /**
   * تسجيل الأخطاء (للتطوير والإنتاج)
   */
  static log(error: AppError, context?: string): void {
    const isDevelopment = import.meta.env.DEV;

    if (isDevelopment) {
      console.group(`🔴 Error ${context ? `in ${context}` : ''}`);
      console.error('Type:', error.type);
      console.error('Message:', error.message);
      console.error('Status:', error.statusCode);
      if (error.details) {
        console.error('Details:', error.details);
      }
      console.error('Stack:', error.stack);
      console.groupEnd();
    } else {
      // في الإنتاج: إرسال الخطأ إلى خدمة مراقبة (مثل Sentry)
      // sendToErrorTracking(error);
      console.error(`[${error.type}]`, error.message);
    }
  }
}

/**
 * دالة مساعدة لمعالجة الأخطاء في try/catch
 */
export function handleError(error: unknown, context?: string): AppError {
  const appError = ErrorHandler.handle(error);
  ErrorHandler.log(appError, context);
  return appError;
}

/**
 * دالة مساعدة للتحقق من نوع الخطأ
 */
export function isErrorType(error: unknown, type: ErrorType): boolean {
  return error instanceof AppError && error.type === type;
}