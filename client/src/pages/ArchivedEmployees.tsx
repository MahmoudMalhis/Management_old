import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { authAPI } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LucideUsers, LucideLoader, LucideRotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { ErrorCard } from "@/components/ErrorDisplay";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";

interface Employee {
  _id: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
}

const ArchivedEmployees = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { error, handleError, clearError } = useErrorHandler();

  const load = async () => {
    try {
      setLoading(true);
      clearError();
      const res = await authAPI.getEmployees({ status: "archived" });
      setEmployees(res.data || []);
    } catch (error) {
      handleError(error, "loadArchivedEmployees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRestore = async () => {
    if (!restoreConfirm) return;
    const { id, name } = restoreConfirm;

    try {
      setRestoringId(id);
      await authAPI.unarchiveEmployee(id);
      toast.success("تمت الاستعادة بنجاح");
      setEmployees((prev) => prev.filter((e) => e._id !== id));
      setRestoreConfirm(null); // إغلاق الـ dialog
    } catch (error) {
      handleError(error, "handleRestore");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold glassy-text">
            {t("employees.staffArchive")}
          </h1>
          <div className="flex gap-2">
            <Link to="/employees">
              <Button variant="outline" className="glass-btn">
                {t("employees.backToStaffList")}
              </Button>
            </Link>
          </div>
        </div>
        {loading && (
          <div className="flex justify-center p-8">
            <LucideLoader className="h-8 w-8 animate-spin" />
          </div>
        )}{" "}
        {error && <ErrorCard error={error} onRetry={load} />}
        {employees.length === 0 ? (
          <Card className="glass-card border-none">
            <CardContent className="py-8 text-center text-muted-foreground flex flex-col items-center gap-4">
              <LucideUsers className="h-10 w-10 opacity-30" />
              {t("employees.noArchivedEmployees")}
            </CardContent>
          </Card>
        ) : (
          !loading &&
          !error &&
          employees.length > 0 && (
            <Card className="glass-card border-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start glassy-text">
                      الاسم
                    </TableHead>
                    <TableHead className="text-start glassy-text">
                      الدور
                    </TableHead>
                    <TableHead className="text-start glassy-text">
                      الحالة
                    </TableHead>
                    <TableHead className="text-start glassy-text">
                      إجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp._id}>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell>
                        {emp.role === "employee" ? "موظف" : "مدير"}
                      </TableCell>
                      <TableCell>مؤرشف</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={restoringId === emp._id}
                          onClick={() =>
                            setRestoreConfirm({
                              id: emp._id,
                              name: emp.name,
                            })
                          }
                        >
                          {restoringId === emp._id ? (
                            <LucideLoader className="h-4 w-4 animate-spin" />
                          ) : (
                            <LucideRotateCcw className="h-4 w-4 mr-2" />
                          )}
                          استعادة
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )
        )}
      </div>
      <AlertDialog
        open={!!restoreConfirm}
        onOpenChange={(open) => !open && setRestoreConfirm(null)}
      >
        <AlertDialogContent className="glass-card !bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>استعادة الموظف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من استعادة الموظف
              {restoreConfirm ? ` "${restoreConfirm.name}"` : ""}؟ سيتمكن من
              تسجيل الدخول مرة أخرى.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass-btn ml-2">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              className="glass-btn"
              onClick={(e) => {
                e.preventDefault();
                handleRestore();
              }}
            >
              تأكيد الاستعادة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ArchivedEmployees;
