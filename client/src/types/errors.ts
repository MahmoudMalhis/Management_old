// types/errors.ts

/**
 * أنواع الأخطاء المخصصة للتطبيق
 */

export enum ErrorType {
  NETWORK = "NETWORK_ERROR",
  VALIDATION = "VALIDATION_ERROR",
  AUTHENTICATION = "AUTHENTICATION_ERROR",
  AUTHORIZATION = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND_ERROR",
  SERVER = "SERVER_ERROR",
  FILE_UPLOAD = "FILE_UPLOAD_ERROR",
  UNKNOWN = "UNKNOWN_ERROR",
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

export class AppError extends Error {
  type: ErrorType;
  statusCode?: number;
  details?: unknown;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    statusCode?: number,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;

    // للحفاظ على stack trace في V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export class NetworkError extends AppError {
  constructor(message = "فشل الاتصال بالخادم") {
    super(message, ErrorType.NETWORK);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(message, ErrorType.VALIDATION, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "يجب تسجيل الدخول أولاً") {
    super(message, ErrorType.AUTHENTICATION, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "ليس لديك صلاحية للوصول") {
    super(message, ErrorType.AUTHORIZATION, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "المورد غير موجود") {
    super(message, ErrorType.NOT_FOUND, 404);
  }
}

export class ServerError extends AppError {
  constructor(message = "خطأ في الخادم") {
    super(message, ErrorType.SERVER, 500);
  }
}

export class FileUploadError extends AppError {
  constructor(message: string) {
    super(message, ErrorType.FILE_UPLOAD, 400);
  }
}
