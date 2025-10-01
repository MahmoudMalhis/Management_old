import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authAPI } from "@/api/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { validateLoginForm } from "@/utils/validation";
interface User {
  _id: string;
  id: string;
  name: string;
  role: "manager" | "employee";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (name: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t } = useTranslation();
  const { handleError, clearError } = useErrorHandler();

  // Check if user is authenticated on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData.user);
        setIsAuthenticated(true);
      } catch (error) {
        handleError(error, "verifyToken");
        localStorage.removeItem("token");
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const login = async (name: string, password: string) => {
    try {
      setLoading(true);
      clearError();

      // التحقق من صحة البيانات
      validateLoginForm(name, password);

      const response = await authAPI.login(name, password);
      const { token: newToken, user: userData } = response;

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);

      toast.success(t("common.success"), {
        description: t("auth.loginSuccess") || "تم تسجيل الدخول بنجاح",
      });
    } catch (error) {
      handleError(error, "login");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const isManager = user?.role === "manager";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error: null,
        login,
        logout,
        isAuthenticated,
        isManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
