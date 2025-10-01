/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api, { accomplishmentsAPI } from "@/api/api";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import FormCard from "@/components/FormCard";
import { LucideUpload, LucideArrowLeft, Plus } from "lucide-react";
import FileUpload, { FileData } from "@/components/FileUpload";
import SelectWithLabel from "@/components/SelectWithLabel";
import FormActions from "@/components/FormActions";
import { Input } from "@/components/ui/input";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { validateAccomplishmentForm } from "@/utils/validation";
import { ErrorAlert } from "@/components/ErrorDisplay";
import { ValidationError } from "@/types/errors";

const AddAccomplishment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const { sendNewAccomplishment } = useSocket();
  const [taskTitles, setTaskTitles] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [selectedTitle, setSelectedTitle] = useState("");
  const [employees, setEmployees] = useState<{ _id: string; name: string }[]>(
    []
  );
  const employeeFromURL = params.get("employee") || "";
  const [selectedEmployee, setSelectedEmployee] = useState(employeeFromURL);
  const [showAddTitle, setShowAddTitle] = useState(false);
  const [newTitleName, setNewTitleName] = useState("");
  const [addingTitle, setAddingTitle] = useState(false);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();

  useEffect(() => {
    if (user?.role === "manager") {
      api
        .get("/auth/employees")
        .then((res) => setEmployees(res.data?.data || []));
    }
  }, [user]);

  useEffect(() => {
    api.get("/task-titles").then((res) => setTaskTitles(res.data.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      clearError();

      // التحقق من صحة البيانات
      validateAccomplishmentForm(
        description,
        selectedTitle,
        files.map((f) => f.file).filter((file): file is File => !!file)
      );

      if (user?.role === "manager" && !selectedEmployee) {
        throw new ValidationError(t("common.selectEmployeeRequired"));
      }

      const formData = new FormData();
      formData.append("description", description.trim());
      formData.append("taskTitle", selectedTitle);

      files.forEach((fileData) => {
        if (fileData.file) {
          formData.append("files", fileData.file);
        }
      });

      if (user?.role === "manager") {
        formData.append("employee", selectedEmployee);
      }

      const response = await accomplishmentsAPI.createAccomplishment(formData);

      sendNewAccomplishment({
        _id: response.data._id,
        description: response.data.description,
        employee: {
          _id: user?.id,
          name: user?.name,
        },
        createdAt: response.data.createdAt,
      });

      toast.success(t("common.success"), {
        description: t("accomplishments.addedSuccessfully"),
      });

      navigate("/accomplishments");
    } catch (error) {
      handleError(error, "handleSubmit");
    } finally {
      setLoading(false);
    }
  };

  const quickAddTitle = async () => {
    const name = newTitleName.trim();
    if (!name) return;
    try {
      setAddingTitle(true);
      const res = await api.post("/task-titles", { name });
      const created = res.data?.data; // { _id, name }
      // ضيفه للقائمة وحدّث الاختيار
      setTaskTitles((prev) => [created, ...prev]);
      setSelectedTitle(created._id);
      // صفّر حالة الإضافة
      setNewTitleName("");
      setShowAddTitle(false);
      toast(t("common.success"));
    } catch (e: any) {
      toast(t("taskTitles.duplicateError"));
    } finally {
      setAddingTitle(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-1 glass-btn"
        onClick={() =>
          navigate(user?.role === "manager" ? "/employees" : "/accomplishments")
        }
      >
        <LucideArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Button>

      <form onSubmit={handleSubmit}>
        <FormCard
          title={t("accomplishments.add")}
          description={t("accomplishments.description")}
          footer={
            <FormActions
              loading={loading}
              cancelLabel={t("common.cancel")}
              submitLabel={t("accomplishments.submit")}
              loadingLabel={t("common.loading")}
              onCancel={() => navigate("/accomplishments")}
              submitIcon={<LucideUpload className="h-4 w-4" />}
            />
          }
        >
          {error && <ErrorAlert error={error} onDismiss={clearError} />}
          {user?.role === "manager" && (
            <SelectWithLabel
              label={`${t("common.selectEmployee")}:`}
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              options={employees.map((emp) => ({
                value: emp._id,
                label: emp.name,
              }))}
              required
            />
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SelectWithLabel
                  label={`${t("common.selectTaskTitle")}:`}
                  value={selectedTitle}
                  onChange={setSelectedTitle}
                  options={taskTitles.map((title) => ({
                    value: title._id,
                    label: title.name,
                  }))}
                  required
                />
              </div>

              {/* زر فتح/إغلاق إضافة عنوان جديد - مخصص (اختياري) للمدير */}
              {user?.role === "manager" && (
                <Button
                  type="button"
                  variant="outline"
                  className="glass-btn mt-4"
                  onClick={() => setShowAddTitle((v) => !v)}
                  title={t("taskTitles.add")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* فورم الإضافة السريع */}
            {user?.role === "manager" && showAddTitle && (
              <div className="flex items-center gap-2">
                <Input
                  value={newTitleName}
                  onChange={(e) => setNewTitleName(e.target.value)}
                  placeholder={t("taskTitles.newPlaceholder")}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") quickAddTitle();
                    if (e.key === "Escape") {
                      setShowAddTitle(false);
                      setNewTitleName("");
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={quickAddTitle}
                  disabled={!newTitleName.trim() || addingTitle}
                  className="glass-btn"
                >
                  {t("taskTitles.add")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddTitle(false);
                    setNewTitleName("");
                  }}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="glassy-text">
              {t("accomplishments.description")}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("accomplishments.description")}
              className="min-h-[100px] glass-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="files" className="glassy-text">
              {t("accomplishments.files")}
            </Label>
            <FileUpload files={files} setFiles={setFiles} />
          </div>
        </FormCard>
      </form>
    </div>
  );
};

export default AddAccomplishment;
