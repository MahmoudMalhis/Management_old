// hooks/useErrorHandler.ts

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { AlertTriangle, XCircle, AlertCircle } from "lucide-react";
import { AppError, ErrorType } from "@/types/errors";
import { ErrorHandler } from "@/utils/errorHandler";

interface UseErrorHandlerReturn {
  error: AppError | null;
  setError: (error: AppError | null) => void;
  showErrorToast: (error: AppError) => void;
  handleError: (error: unknown, context?: string) => void;
  clearError: () => void;
}

/**
 * Hook لمعالجة الأخطاء بشكل موحد
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<AppError | null>(null);

  /**
   * معالجة الخطأ وعرض toast
   */
  const handleError = useCallback((error: unknown, context?: string) => {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.log(appError, context);
    setError(appError);
    showErrorToast(appError);
  }, []);

  /**
   * مسح الخطأ
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * عرض toast حسب نوع الخطأ
   */
  const showErrorToast = useCallback((error: AppError) => {
    const getIcon = () => {
        switch (error.type) {
          case ErrorType.NETWORK:
            return <AlertCircle className="text-orange-500" />;
          case ErrorType.AUTHENTICATION:
          case ErrorType.AUTHORIZATION:
            return <XCircle className="text-red-500" />;
          case ErrorType.VALIDATION:
            return <AlertTriangle className="text-yellow-500" />;
          default:
            return <AlertTriangle className="text-red-500" />;
        }
    };

    const getTitle = () => {
      switch (error.type) {
        case ErrorType.NETWORK:
          return "خطأ في الاتصال";
        case ErrorType.AUTHENTICATION:
          return "خطأ في المصادقة";
        case ErrorType.AUTHORIZATION:
          return "غير مصرح";
        case ErrorType.VALIDATION:
          return "بيانات غير صالحة";
        case ErrorType.NOT_FOUND:
          return "غير موجود";
        case ErrorType.SERVER:
          return "خطأ في الخادم";
        case ErrorType.FILE_UPLOAD:
          return "خطأ في رفع الملف";
        default:
          return "خطأ";
      }
    };

    toast.error(getTitle(), {
      description: error.message,
        icon: getIcon(),
      duration: 5000,
    });
  }, []);

  return {
    error,
    setError,
    handleError,
    clearError,
    showErrorToast,
  };
}

/**
 * Hook لتنفيذ عمليات async مع معالجة الأخطاء
 */
export function useAsyncError() {
  const { handleError } = useErrorHandler();

  /**
   * تنفيذ دالة async مع معالجة تلقائية للأخطاء
   */
  const executeAsync = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      context?: string
    ): Promise<T | null> => {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error, context);
        return null;
      }
    },
    [handleError]
  );

  return { executeAsync };
}

/**
 * Hook لإدارة حالة التحميل مع معالجة الأخطاء
 */
export function useAsyncState<T>(initialState: T | null = null): {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  execute: (asyncFn: () => Promise<T>, context?: string) => Promise<void>;
  reset: () => void;
} {
  const [data, setData] = useState<T | null>(initialState);
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();

  const execute = useCallback(
    async (asyncFn: () => Promise<T>, context?: string) => {
      try {
        setLoading(true);
        clearError();
        const result = await asyncFn();
        setData(result);
      } catch (err) {
        handleError(err, context);
      } finally {
        setLoading(false);
      }
    },
    [handleError, clearError]
  );

  const reset = useCallback(() => {
    setData(initialState);
    setLoading(false);
    clearError();
  }, [initialState, clearError]);

  return { data, loading, error, execute, reset };
}

/**
 * Hook للتحقق من صحة البيانات
 */
export function useValidation() {
  const { handleError } = useErrorHandler();

  const validate = useCallback(
    <T extends Record<string, unknown>>(
      data: T,
      rules: Record<keyof T, (value: unknown) => string | null>
    ): boolean => {
      const errors: Record<string, string[]> = {};

      for (const [field, rule] of Object.entries(rules)) {
        const error = rule(data[field as keyof T]);
        if (error) {
          errors[field] = [error];
        }
      }

      if (Object.keys(errors).length > 0) {
        handleError(
          new AppError("بيانات غير صالحة", ErrorType.VALIDATION, 400, errors),
          "validation"
        );
        return false;
      }

      return true;
    },
    [handleError]
  );

  return { validate };
}
