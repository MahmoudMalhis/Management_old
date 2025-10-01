import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { accomplishmentsAPI } from "@/api/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LucideLoader } from "lucide-react";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { validateAccomplishmentForm } from "@/utils/validation";
import FileUpload, { FileData } from "@/components/FileUpload";

interface ModifyFormProps {
  accomplishmentId: string;
  oldDescription: string;
  oldFiles?: FileData[];
  onModified: () => void;
  mode?: "modify" | "start";
}

const ModifyForm: React.FC<ModifyFormProps> = ({
  accomplishmentId,
  oldDescription,
  oldFiles = [],
  onModified,
  mode = "modify",
}) => {
  const { t } = useTranslation();
  const [description, setDescription] = useState(oldDescription);
  const [files, setFiles] = useState<FileData[]>(oldFiles);
  const [loading, setLoading] = useState(false);
  const { handleError } = useErrorHandler();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // التحقق من صحة البيانات
      const newFilesForUpload = files.filter((f) => f.file);
      validateAccomplishmentForm(
        description,
        accomplishmentId,
        newFilesForUpload.map((f) => f.file!)
      );

      const formData = new FormData();
      formData.append("description", description.trim());

      newFilesForUpload.forEach((f) => {
        if (f.file) {
          formData.append("files", f.file);
        }
      });

      if (mode === "start") {
        await accomplishmentsAPI.startAccomplishment(
          accomplishmentId,
          formData
        );
      } else {
        await accomplishmentsAPI.modifyAccomplishment(
          accomplishmentId,
          formData
        );
      }

      toast.success(t("common.success"), {
        description: t("common.editedSuccessfully"),
      });
      onModified();
    } catch (error) {
      handleError(error, "handleSubmit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 mt-6 glass-card p-6 border-none"
    >
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder={t("common.enterNewDescription")}
        className="glass-input"
      />

      {/* File upload section: uses the shared FileUpload component to
          encapsulate preview, selection and removal of files */}
      <FileUpload files={files} setFiles={setFiles} />

      <Button type="submit" disabled={loading} className="glass-btn w-full">
        {loading ? (
          <>
            <LucideLoader className="h-4 w-4 animate-spin" />
            {t("common.updating")}
          </>
        ) : (
          t("common.saveChanges")
        )}
      </Button>
    </form>
  );
};

export default ModifyForm;
