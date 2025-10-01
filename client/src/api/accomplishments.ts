// api/accomplishments.ts
// API للإنجازات مع أنواع صحيحة ومعالجة أخطاء محسّنة

import { get, post, put, del, uploadFile } from "./client";
import { ErrorHandler } from "@/utils/errorHandler";

// ===== الأنواع =====

export interface TaskTitle {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  _id: string;
  name: string;
  role: "employee" | "manager";
  status?: "active" | "archived";
  createdAt?: string;
}

export interface FileAttachment {
  _id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  size?: number;
}

export interface Comment {
  _id: string;
  text: string;
  createdAt: string;
  commentedBy: {
    _id: string;
    name: string;
    role: string;
  };
  replies?: Reply[];
}

export interface Reply {
  _id: string;
  text: string;
  createdAt: string;
  repliedBy: {
    _id: string;
    name: string;
    role: string;
  };
}

export interface Accomplishment {
  _id: string;
  description: string;
  originalDescription?: string;
  status: "pending" | "reviewed" | "needs_modification";
  isReviewed: boolean;
  createdAt: string;
  updatedAt?: string;
  employee: Employee;
  employeeInfo?: Employee;
  taskTitle: TaskTitle;
  taskTitleInfo?: TaskTitle;
  files: FileAttachment[];
  comments: Comment[];
  previousVersions?: AccomplishmentVersion[];
}

export interface AccomplishmentVersion {
  description: string;
  files: FileAttachment[];
  modifiedAt: string;
}

export interface CreateAccomplishmentData {
  description: string;
  taskTitle: string;
  employee?: string;
  files?: File[];
}

export interface UpdateAccomplishmentData {
  description?: string;
  taskTitle?: string;
  files?: File[];
}

export interface AccomplishmentFilters {
  employee?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  taskTitle?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | undefined;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

// ===== API Functions =====

export const accomplishmentsAPI = {
  /**
   * جلب جميع الإنجازات مع الفلاتر
   */
  async getAccomplishments(
    filters?: AccomplishmentFilters
  ): Promise<Accomplishment[]> {
    // ✅ ليس PaginatedResponse
    try {
      const response = await get<PaginatedResponse<Accomplishment>>(
        "/accomplishments",
        filters
      );
      return response.data?.data || []; // ✅ ارجع المصفوفة مباشرة
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },

  /**
   * جلب إنجاز واحد بالـ ID
   */
  async getAccomplishment(id: string): Promise<Accomplishment> {
    try {
      if (!id) {
        throw new Error("معرّف الإنجاز مطلوب");
      }

      const response = await get<Accomplishment>(`/accomplishments/${id}`);
      return response.data!;
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },

  /**
   * إنشاء إنجاز جديد
   */
  async createAccomplishment(
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<Accomplishment> {
    try {
      // التحقق من وجود الحقول المطلوبة
      if (!formData.get("description")) {
        throw new Error("وصف الإنجاز مطلوب");
      }
      if (!formData.get("taskTitle")) {
        throw new Error("عنوان المهمة مطلوب");
      }

      const response = await uploadFile<Accomplishment>(
        "/accomplishments",
        formData,
        onProgress
      );
      return response.data;
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },

  /**
   * تحديث إنجاز (تعديل)
   */
  async modifyAccomplishment(
    id: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<Accomplishment> {
    try {
      if (!id) {
        throw new Error("معرّف الإنجاز مطلوب");
      }

      const response = await uploadFile<Accomplishment>(
        `/accomplishments/${id}/modify`,
        formData,
        onProgress
      );
      return response.data!;
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },

  /**
   * بدء العمل على إنجاز يحتاج تعديل
   */
  async startAccomplishment(
    id: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<Accomplishment> {
    try {
      if (!id) {
        throw new Error("معرّف الإنجاز مطلوب");
      }

      const response = await uploadFile<Accomplishment>(
        `/accomplishments/${id}/start`,
        formData,
        onProgress
      );
      return response.data!;
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },

  /**
   * مراجعة إنجاز (للمدير فقط)
   */
  async reviewAccomplishment(
    id: string,
    status: "reviewed" | "needs_modification"
  ): Promise<Accomplishment> {
    try {
      if (!id) {
        throw new Error("معرّف الإنجاز مطلوب");
      }
      if (!status) {
        throw new Error("حالة المراجعة مطلوبة");
      }

      const response = await put<Accomplishment>(
        `/accomplishments/${id}/review`,
        { status }
      );
      return response.data!;
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },

  /**
   * إضافة تعليق
   */
  async addComment(id: string, text: string): Promise<Comment> {
    try {
      if (!id) {
        throw new Error("معرّف الإنجاز مطلوب");
      }
      if (!text || !text.trim()) {
        throw new Error("نص التعليق مطلوب");
      }

      const response = await post<Comment>(`/accomplishments/${id}/comments`, {
        text: text.trim(),
      });
      return response.data!;
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },

  /**
   * إضافة رد على تعليق
   */
  async addReply(
    accomplishmentId: string,
    commentId: string,
    text: string
  ): Promise<Reply> {
    try {
      if (!accomplishmentId) {
        throw new Error("معرّف الإنجاز مطلوب");
      }
      if (!commentId) {
        throw new Error("معرّف التعليق مطلوب");
      }
      if (!text || !text.trim()) {
        throw new Error("نص الرد مطلوب");
      }

      const response = await post<Reply>(
        `/accomplishments/${accomplishmentId}/comments/${commentId}/reply`,
        { text: text.trim() }
      );
      return response.data!;
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },

  /**
   * حذف إنجاز
   */
  async deleteAccomplishment(id: string): Promise<void> {
    try {
      if (!id) {
        throw new Error("معرّف الإنجاز مطلوب");
      }

      await del(`/accomplishments/${id}`);
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },

  /**
   * تصدير الإنجازات إلى Excel
   */
  async exportAccomplishments(filters?: AccomplishmentFilters): Promise<Blob> {
    try {
      const response = await get<Blob>("/accomplishments/export", filters);
      return response.data!;
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },

  /**
   * جلب عناوين المهام
   */
  async getTaskTitles(): Promise<TaskTitle[]> {
    try {
      const response = await get<TaskTitle[]>("/task-titles");
      return response.data || [];
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },

  /**
   * جلب الموظفين
   */
  async getEmployees(filters?: {
    status?: "active" | "archived";
  }): Promise<Employee[]> {
    try {
      const response = await get<Employee[]>("/auth/employees", filters);
      return response.data || [];
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },
};
