import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { validateFile } from "@/utils/validation";
import { toast } from "sonner";

export interface FileData {
  _id?: string;
  fileName: string;
  filePath?: string;
  fileType?: string;
  file?: File;
}

const BASE_URL: string =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

interface FileUploadProps {
  files: FileData[];
  setFiles: React.Dispatch<React.SetStateAction<FileData[]>>;
  showRemove?: boolean;
  className?: string;
}
const FileUpload: React.FC<FileUploadProps> = ({
  files,
  setFiles,
  showRemove = true,
  className = "",
}) => {
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const selectedFiles = Array.from(e.target.files || []);

      // التحقق من كل ملف
      selectedFiles.forEach((file) => {
        validateFile(file);
      });

      const newFiles: FileData[] = selectedFiles.map((file) => ({
        fileName: file.name,
        fileType: file.type,
        file,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      toast.success(t("common.success"), {
        description: `${selectedFiles.length} ${t("common.filesSelected")}`,
      });
    } catch (error) {
      handleError(error, "handleFileChange");
    }
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      {/* Previews */}
      <div className="mt-3 grid md:grid-cols-4 gap-3">
        {files.map((file, index) => {
          const isImage =
            file.fileType?.startsWith("image") ||
            (file.file && file.file.type?.startsWith("image"));
          const src = file.file
            ? URL.createObjectURL(file.file)
            : file.filePath
            ? `${BASE_URL}${file.filePath}`
            : "";
          return (
            <div
              key={index}
              className="relative glass-card p-2 flex flex-col items-center gap-2 border-none"
              style={{ minHeight: "120px", minWidth: "110px" }}
            >
              {isImage ? (
                <img
                  src={src}
                  alt={file.fileName}
                  className="w-24 h-24 object-cover rounded-xl glass-img"
                />
              ) : (
                <span className="text-xs text-center break-all glassy-text mt-4">
                  {file.fileName}
                </span>
              )}
              {showRemove && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="glass-btn"
                >
                  {t("common.delete")}
                </Button>
              )}
            </div>
          );
        })}
      </div>
      {/* File input */}
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="block w-full glass-input mt-3"
      />
    </div>
  );
};

export default FileUpload;
