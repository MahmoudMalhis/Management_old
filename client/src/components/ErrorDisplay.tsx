// components/ErrorDisplay.tsx
// مكونات لعرض الأخطاء بشكل جميل

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  XCircle,
  AlertCircle,
  Wifi,
  ShieldAlert,
  FileX,
  ServerCrash,
  RefreshCw,
} from "lucide-react";
import { AppError, ErrorType } from "@/types/errors";

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

/**
 * عرض الخطأ كـ Alert
 */
export function ErrorAlert({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
}: ErrorDisplayProps) {
  const getIcon = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return <Wifi className="h-5 w-5" />;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return <ShieldAlert className="h-5 w-5" />;
      case ErrorType.VALIDATION:
        return <AlertTriangle className="h-5 w-5" />;
      case ErrorType.NOT_FOUND:
        return <FileX className="h-5 w-5" />;
      case ErrorType.SERVER:
        return <ServerCrash className="h-5 w-5" />;
      default:
        return <XCircle className="h-5 w-5" />;
    }
  };

  const getVariant = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return "default";
      case ErrorType.VALIDATION:
        return "default";
      default:
        return "destructive";
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
        return "حدث خطأ";
    }
  };

  return (
    <Alert variant={getVariant()} className="my-4">
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <AlertTitle className="mb-1">{getTitle()}</AlertTitle>
          <AlertDescription className="text-sm">
            {error.message}
          </AlertDescription>

          {showDetails && error.details && (
            <div className="mt-2 text-xs bg-black/5 rounded p-2">
              <pre className="overflow-auto">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </div>
          )}

          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="h-8"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  إعادة المحاولة
                </Button>
              )}
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className="h-8"
                >
                  إغلاق
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}

/**
 * عرض الخطأ كـ Card كامل
 */
export function ErrorCard({
  error,
  onRetry,
  showDetails = false,
}: ErrorDisplayProps) {
  const getIcon = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return <Wifi className="h-8 w-8 text-orange-500" />;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return <ShieldAlert className="h-8 w-8 text-red-500" />;
      case ErrorType.VALIDATION:
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case ErrorType.NOT_FOUND:
        return <FileX className="h-8 w-8 text-gray-500" />;
      case ErrorType.SERVER:
        return <ServerCrash className="h-8 w-8 text-red-600" />;
      default:
        return <XCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return "خطأ في الاتصال";
      case ErrorType.AUTHENTICATION:
        return "يجب تسجيل الدخول";
      case ErrorType.AUTHORIZATION:
        return "غير مصرح لك";
      case ErrorType.VALIDATION:
        return "بيانات غير صالحة";
      case ErrorType.NOT_FOUND:
        return "غير موجود";
      case ErrorType.SERVER:
        return "خطأ في الخادم";
      default:
        return "حدث خطأ";
    }
  };

  return (
    <Card className="max-w-md mx-auto my-8">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 rounded-full">{getIcon()}</div>
          <CardTitle>{getTitle()}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{error.message}</p>

        {showDetails && error.details && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">
              تفاصيل إضافية:
            </p>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          </div>
        )}

        {error.statusCode && (
          <p className="text-xs text-gray-500">رمز الخطأ: {error.statusCode}</p>
        )}

        {onRetry && (
          <Button onClick={onRetry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            إعادة المحاولة
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * عرض inline بسيط للخطأ
 */
export function ErrorInline({ error }: { error: AppError }) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{error.message}</span>
    </div>
  );
}

/**
 * عرض أخطاء التحقق (Validation Errors)
 */
export function ValidationErrors({ error }: { error: AppError }) {
  if (error.type !== ErrorType.VALIDATION || !error.details) {
    return <ErrorInline error={error} />;
  }

  const errors = error.details as Record<string, string[]>;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>بيانات غير صالحة</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 mt-2">
          {Object.entries(errors).map(([field, messages]) =>
            messages.map((message, index) => (
              <li key={`${field}-${index}`} className="text-sm">
                {message}
              </li>
            ))
          )}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

/**
 * صفحة خطأ كاملة
 */
export function ErrorPage({
  error,
  onRetry,
  onGoHome,
}: ErrorDisplayProps & { onGoHome?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-4 bg-red-100 rounded-full">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <CardTitle className="text-2xl">حدث خطأ</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">{error.message}</p>

          {error.statusCode && (
            <p className="text-center text-sm text-gray-500">
              رمز الخطأ: {error.statusCode}
            </p>
          )}

          <div className="flex gap-2">
            {onRetry && (
              <Button onClick={onRetry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                إعادة المحاولة
              </Button>
            )}
            {onGoHome && (
              <Button onClick={onGoHome} variant="outline" className="flex-1">
                الصفحة الرئيسية
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-gray-500">
            إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
