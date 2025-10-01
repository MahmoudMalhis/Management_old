import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authAPI } from "@/api/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormCard from "@/components/FormCard";
import {
  LucideArrowLeft,
  LucideUserPlus,
} from "lucide-react";
import FormActions from "@/components/FormActions";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { validateEmployeeForm } from "@/utils/validation";
import { ErrorAlert } from "@/components/ErrorDisplay";

const AddEmployee = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // use the toast function from sonner

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      clearError();

      // التحقق من صحة البيانات
      validateEmployeeForm(
        formData.name,
        formData.password,
        formData.confirmPassword
      );

      await authAPI.registerEmployee(formData.name, formData.password);

      toast.success(t("common.success"), {
        description: t("employees.addedSuccessfully"),
      });

      navigate("/employees");
    } catch (error) {
      handleError(error, "handleSubmit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-1 glass-btn"
        onClick={() => navigate("/employees")}
      >
        <LucideArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Button>

      <form onSubmit={handleSubmit}>
        <FormCard
          title={t("employees.add")}
          description={t("employees.create")}
          footer={
            <FormActions
              loading={loading}
              cancelLabel={t("common.cancel")}
              submitLabel={t("employees.create")}
              loadingLabel={t("common.loading")}
              onCancel={() => navigate("/employees")}
              submitIcon={<LucideUserPlus className="h-4 w-4" />}
            />
          }
        >
          {error && <ErrorAlert error={error} onDismiss={clearError} />}
          <div className="space-y-2">
            <Label htmlFor="name" className="glassy-text">
              {t("employees.name")}
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t("employees.name")}
              required
              className="glass-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="glassy-text">
              {t("employees.password")}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t("employees.password")}
              required
              className="glass-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="glassy-text">
              {t("employees.confirmPassword")}
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder={t("employees.confirmPassword")}
              required
              className="glass-input"
            />
          </div>
        </FormCard>
      </form>
    </div>
  );
};

export default AddEmployee;
