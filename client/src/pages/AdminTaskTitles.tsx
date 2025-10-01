import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/api";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { validateTaskTitleForm } from "@/utils/validation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminTaskTitles() {
  const [titles, setTitles] = useState<{ _id: string; name: string }[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const { isManager } = useAuth();
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    fetchTitles();
  }, []);

  const fetchTitles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/task-titles");
      setTitles(res.data.data);
    } catch (error) {
      handleError(error, "fetchTitles");
    } finally {
      setLoading(false);
    }
  };

  const addTitle = async () => {
    try {
      validateTaskTitleForm(newTitle);

      await api.post("/task-titles", { name: newTitle.trim() });
      setNewTitle("");
      fetchTitles();
      toast.success(t("common.success"));
    } catch (error) {
      handleError(error, "addTitle");
    }
  };

  const saveEdit = async () => {
    try {
      if (!editing || !editing.name.trim()) return;

      validateTaskTitleForm(editing.name);

      await api.put(`/task-titles/${editing.id}`, {
        name: editing.name.trim(),
      });
      setEditing(null);
      fetchTitles();
      toast.success(t("common.success"));
    } catch (error) {
      handleError(error, "saveEdit");
    }
  };

  const removeTitle = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;

    try {
      await api.delete(`/task-titles/${id}`);
      fetchTitles();
      toast.success(t("common.success"));
      setDeleteConfirm(null);
    } catch (error) {
      handleError(error, "removeTitle");
    }
  };

  if (!isManager) return <div>{t("taskTitles.noAccess")}</div>;

  return (
    <div className="max-w-xl mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>{t("taskTitles.manage")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t("taskTitles.newPlaceholder")}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") addTitle();
              }}
            />
            <Button onClick={addTitle} disabled={!newTitle.trim() || loading}>
              {t("taskTitles.add")}
            </Button>
          </div>
          <ul className="space-y-3">
            {titles.map((title) => (
              <li key={title._id} className="flex items-center gap-2">
                {editing && editing.id === title._id ? (
                  <>
                    <Input
                      value={editing.name}
                      onChange={(e) =>
                        setEditing((old) =>
                          old ? { ...old, name: e.target.value } : old
                        )
                      }
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                      }}
                    />
                    <Button onClick={saveEdit} size="sm">
                      {t("common.save")}
                    </Button>
                    <Button
                      onClick={() => setEditing(null)}
                      variant="outline"
                      size="sm"
                    >
                      {t("common.cancel")}
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{title.name}</span>
                    <Button
                      onClick={() =>
                        setEditing({ id: title._id, name: title.name })
                      }
                      variant="outline"
                      size="sm"
                    >
                      {t("common.edit")}
                    </Button>
                    <Button
                      onClick={() =>
                        setDeleteConfirm({ id: title._id, name: title.name })
                      }
                      variant="destructive"
                      size="sm"
                    >
                      {t("common.delete")}
                    </Button>
                  </>
                )}
              </li>
            ))}
            {titles.length === 0 && (
              <li className="text-gray-400 text-center">
                {t("taskTitles.noTitles")}
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent className="glass-card !bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف عنوان المهمة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف عنوان المهمة
              {deleteConfirm ? ` "${deleteConfirm.name}"` : ""}؟ لا يمكن التراجع
              عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass-btn">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="glass-btn bg-red-600 hover:bg-red-700 text-white"
              onClick={(e) => {
                e.preventDefault();
                removeTitle();
              }}
            >
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
