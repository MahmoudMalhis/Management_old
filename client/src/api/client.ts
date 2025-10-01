// api/client.ts

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ErrorHandler } from '@/utils/errorHandler';

// إعدادات API
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;
const TIMEOUT = 30000; // 30 ثانية

/**
 * إنشاء Axios instance مع إعدادات مخصصة
 */
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * يضيف التوكن تلقائياً لكل طلب
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // إضافة التوكن إذا كان موجوداً
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // تسجيل الطلب في بيئة التطوير
    if (import.meta.env.DEV) {
      console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    // معالجة أخطاء إعداد الطلب
    return Promise.reject(ErrorHandler.handle(error));
  }
);

/**
 * Response Interceptor
 * يعالج الأخطاء تلقائياً
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // تسجيل الاستجابة الناجحة في بيئة التطوير
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    }
    return response;
  },
  (error) => {
    // معالجة الأخطاء وتحويلها إلى AppError
    const appError = ErrorHandler.handle(error);
    
    // تسجيل الخطأ
    ErrorHandler.log(appError, error.config?.url);

    // إعادة توجيه إلى صفحة تسجيل الدخول عند انتهاء الجلسة
    if (appError.statusCode === 401) {
      // تأخير بسيط لعرض رسالة الخطأ أولاً
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }

    return Promise.reject(appError);
  }
);

/**
 * دوال مساعدة مع معالجة أفضل للأخطاء
 */

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * دالة GET مع معالجة الأخطاء
 */
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
  try {
    const response = await api.get<ApiResponse<T>>(url, { params });
    return response.data;
  } catch (error) {
    throw ErrorHandler.handle(error);
  }
}

/**
 * دالة POST مع معالجة الأخطاء
 */
export async function post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  try {
    const response = await api.post<ApiResponse<T>>(url, data);
    return response.data;
  } catch (error) {
    throw ErrorHandler.handle(error);
  }
}

/**
 * دالة PUT مع معالجة الأخطاء
 */
export async function put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  try {
    const response = await api.put<ApiResponse<T>>(url, data);
    return response.data;
  } catch (error) {
    throw ErrorHandler.handle(error);
  }
}

/**
 * دالة DELETE مع معالجة الأخطاء
 */
export async function del<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
  try {
    const response = await api.delete<ApiResponse<T>>(url, { params });
    return response.data;
  } catch (error) {
    throw ErrorHandler.handle(error);
  }
}

/**
 * دالة لرفع الملفات مع معالجة الأخطاء
 */
export async function uploadFile<T>(
  url: string,
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<T>> {
  try {
    const response = await api.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  } catch (error) {
    throw ErrorHandler.handle(error);
  }
}

export default api;