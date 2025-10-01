// components/ErrorBoundary.tsx

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { ErrorHandler } from "@/utils/errorHandler";
import { AppError } from "@/types/errors";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary لالتقاط الأخطاء في المكونات
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // تسجيل الخطأ
    console.error("Error Boundary caught:", error, errorInfo);

    // تحويل إلى AppError وتسجيله
    const appError = ErrorHandler.handle(error);
    ErrorHandler.log(appError, "ErrorBoundary");

    // إرسال إلى خدمة مراقبة الأخطاء في الإنتاج
    if (!import.meta.env.DEV) {
      // sendToErrorTracking(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  goHome = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // استخدام fallback مخصص إذا تم توفيره
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // الواجهة الافتراضية للخطأ
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">حدث خطأ غير متوقع</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  تفاصيل الخطأ:
                </p>
                <p className="text-sm text-red-600 font-mono">
                  {this.state.error.message}
                </p>
              </div>

              {import.meta.env.DEV && this.state.error.stack && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    عرض Stack Trace
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={this.resetError}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  إعادة المحاولة
                </Button>
                <Button
                  onClick={this.goHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  الصفحة الرئيسية
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * مكون wrapper بسيط للاستخدام
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error, reset: () => void) => ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
