// utils/validation.ts
// دوال التحقق من صحة البيانات

import { ValidationError } from "@/types/errors";

// ===== ثوابت =====

export const VALIDATION_RULES = {
  // حدود النصوص
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 50,
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 5000,
  MIN_COMMENT_LENGTH: 1,
  MAX_COMMENT_LENGTH: 1000,

  // حدود الملفات
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_COUNT: 10,

  // أنواع الملفات المسموحة
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
};

// ===== دوال التحقق الأساسية =====

/**
 * التحقق من أن القيمة غير فارغة
 */
export function required(value: unknown, fieldName = "الحقل"): void {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} مطلوب`);
  }

  if (typeof value === "string" && !value.trim()) {
    throw new ValidationError(`${fieldName} مطلوب`);
  }

  if (Array.isArray(value) && value.length === 0) {
    throw new ValidationError(`${fieldName} مطلوب`);
  }
}

/**
 * التحقق من الحد الأدنى للطول
 */
export function minLength(
  value: string,
  min: number,
  fieldName = "الحقل"
): void {
  if (value.trim().length < min) {
    throw new ValidationError(`${fieldName} يجب أن يكون ${min} أحرف على الأقل`);
  }
}

/**
 * التحقق من الحد الأقصى للطول
 */
export function maxLength(
  value: string,
  max: number,
  fieldName = "الحقل"
): void {
  if (value.trim().length > max) {
    throw new ValidationError(`${fieldName} يجب أن لا يتجاوز ${max} حرف`);
  }
}

/**
 * التحقق من نطاق الطول
 */
export function lengthRange(
  value: string,
  min: number,
  max: number,
  fieldName = "الحقل"
): void {
  const length = value.trim().length;
  if (length < min || length > max) {
    throw new ValidationError(
      `${fieldName} يجب أن يكون بين ${min} و ${max} حرف`
    );
  }
}

/**
 * التحقق من البريد الإلكتروني
 */
export function isEmail(value: string, fieldName = "البريد الإلكتروني"): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new ValidationError(`${fieldName} غير صالح`);
  }
}

/**
 * التحقق من رقم الهاتف
 */
export function isPhoneNumber(value: string, fieldName = "رقم الهاتف"): void {
  // التحقق من أرقام سعودية (مثال)
  const phoneRegex = /^(05|5)[0-9]{8}$/;
  if (!phoneRegex.test(value.replace(/[\s-]/g, ""))) {
    throw new ValidationError(`${fieldName} غير صالح`);
  }
}

/**
 * التحقق من تطابق كلمتي المرور
 */
export function passwordsMatch(
  password: string,
  confirmPassword: string
): void {
  if (password !== confirmPassword) {
    throw new ValidationError("كلمتا المرور غير متطابقتين");
  }
}

/**
 * التحقق من قوة كلمة المرور
 */
export function isStrongPassword(password: string): void {
  if (password.length < VALIDATION_RULES.MIN_PASSWORD_LENGTH) {
    throw new ValidationError(
      `كلمة المرور يجب أن تكون ${VALIDATION_RULES.MIN_PASSWORD_LENGTH} أحرف على الأقل`
    );
  }

  // يمكن إضافة شروط أخرى للأمان
  // مثل: حرف كبير، حرف صغير، رقم، رمز خاص
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);

  if (!hasNumber || !hasLetter) {
    throw new ValidationError("كلمة المرور يجب أن تحتوي على أحرف وأرقام");
  }
}

/**
 * التحقق من التاريخ
 */
export function isValidDate(date: string, fieldName = "التاريخ"): void {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new ValidationError(`${fieldName} غير صالح`);
  }
}

/**
 * التحقق من أن التاريخ في المستقبل
 */
export function isFutureDate(date: string, fieldName = "التاريخ"): void {
  isValidDate(date, fieldName);
  const parsedDate = new Date(date);
  const now = new Date();

  if (parsedDate <= now) {
    throw new ValidationError(`${fieldName} يجب أن يكون في المستقبل`);
  }
}

/**
 * التحقق من أن التاريخ في الماضي
 */
export function isPastDate(date: string, fieldName = "التاريخ"): void {
  isValidDate(date, fieldName);
  const parsedDate = new Date(date);
  const now = new Date();

  if (parsedDate >= now) {
    throw new ValidationError(`${fieldName} يجب أن يكون في الماضي`);
  }
}

// ===== التحقق من الملفات =====

/**
 * التحقق من حجم الملف
 */
export function validateFileSize(file: File, maxSize?: number): void {
  const max = maxSize || VALIDATION_RULES.MAX_FILE_SIZE;

  if (file.size > max) {
    const maxMB = (max / (1024 * 1024)).toFixed(1);
    throw new ValidationError(
      `الملف "${file.name}" كبير جداً. الحد الأقصى ${maxMB} ميجابايت`
    );
  }
}

/**
 * التحقق من نوع الملف
 */
export function validateFileType(file: File, allowedTypes: string[]): void {
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError(`نوع الملف "${file.name}" غير مدعوم`);
  }
}

/**
 * التحقق من امتداد الملف
 */
export function validateFileExtension(
  file: File,
  allowedExtensions: string[]
): void {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !allowedExtensions.includes(extension)) {
    throw new ValidationError(`امتداد الملف "${file.name}" غير مدعوم`);
  }
}

/**
 * التحقق من ملف واحد (شامل)
 */
export function validateFile(file: File): void {
  // التحقق من الحجم
  validateFileSize(file);

  // التحقق من النوع
  const allAllowedTypes = [
    ...VALIDATION_RULES.ALLOWED_IMAGE_TYPES,
    ...VALIDATION_RULES.ALLOWED_DOCUMENT_TYPES,
  ];

  validateFileType(file, allAllowedTypes);
}

/**
 * التحقق من مجموعة ملفات
 */
export function validateFiles(files: File[]): void {
  // التحقق من العدد
  if (files.length > VALIDATION_RULES.MAX_FILES_COUNT) {
    throw new ValidationError(
      `لا يمكن رفع أكثر من ${VALIDATION_RULES.MAX_FILES_COUNT} ملفات`
    );
  }

  // التحقق من كل ملف
  files.forEach(validateFile);
}

/**
 * التحقق من ملف صورة
 */
export function validateImage(file: File): void {
  validateFileSize(file);
  validateFileType(file, VALIDATION_RULES.ALLOWED_IMAGE_TYPES);
}

/**
 * التحقق من ملف مستند
 */
export function validateDocument(file: File): void {
  validateFileSize(file);
  validateFileType(file, VALIDATION_RULES.ALLOWED_DOCUMENT_TYPES);
}

// ===== التحقق من نماذج كاملة =====

/**
 * التحقق من نموذج تسجيل الدخول
 */
export function validateLoginForm(name: string, password: string): void {
  required(name, "اسم المستخدم");
  required(password, "كلمة المرور");

  minLength(name, VALIDATION_RULES.MIN_NAME_LENGTH, "اسم المستخدم");
  minLength(password, VALIDATION_RULES.MIN_PASSWORD_LENGTH, "كلمة المرور");
}

/**
 * التحقق من نموذج إضافة موظف
 */
export function validateEmployeeForm(
  name: string,
  password: string,
  confirmPassword: string
): void {
  required(name, "اسم الموظف");
  required(password, "كلمة المرور");
  required(confirmPassword, "تأكيد كلمة المرور");

  lengthRange(
    name,
    VALIDATION_RULES.MIN_NAME_LENGTH,
    VALIDATION_RULES.MAX_NAME_LENGTH,
    "اسم الموظف"
  );

  isStrongPassword(password);
  passwordsMatch(password, confirmPassword);
}

/**
 * التحقق من نموذج إضافة إنجاز
 */
export function validateAccomplishmentForm(
  description: string,
  taskTitle: string,
  files?: File[]
): void {
  required(description, "وصف الإنجاز");
  required(taskTitle, "عنوان المهمة");

  lengthRange(
    description,
    VALIDATION_RULES.MIN_DESCRIPTION_LENGTH,
    VALIDATION_RULES.MAX_DESCRIPTION_LENGTH,
    "وصف الإنجاز"
  );

  if (files && files.length > 0) {
    validateFiles(files);
  }
}

/**
 * التحقق من نموذج التعليق
 */
export function validateCommentForm(text: string): void {
  required(text, "نص التعليق");

  lengthRange(
    text,
    VALIDATION_RULES.MIN_COMMENT_LENGTH,
    VALIDATION_RULES.MAX_COMMENT_LENGTH,
    "نص التعليق"
  );
}

/**
 * التحقق من نموذج عنوان المهمة
 */
export function validateTaskTitleForm(name: string): void {
  required(name, "اسم عنوان المهمة");

  lengthRange(
    name,
    VALIDATION_RULES.MIN_NAME_LENGTH,
    VALIDATION_RULES.MAX_NAME_LENGTH,
    "اسم عنوان المهمة"
  );
}

// ===== دوال مساعدة =====

/**
 * تنسيق حجم الملف
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 بايت";

  const k = 1024;
  const sizes = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * الحصول على امتداد الملف
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * التحقق من أن الملف صورة
 */
export function isImageFile(file: File): boolean {
  return VALIDATION_RULES.ALLOWED_IMAGE_TYPES.includes(file.type);
}

/**
 * التحقق من أن الملف مستند
 */
export function isDocumentFile(file: File): boolean {
  return VALIDATION_RULES.ALLOWED_DOCUMENT_TYPES.includes(file.type);
}
