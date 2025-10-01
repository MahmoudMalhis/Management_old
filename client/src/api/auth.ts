// api/auth.ts
import { get, post } from "./client";
import { ErrorHandler } from "@/utils/errorHandler";

export interface AuthResponse {
  token: string;
  user: {
    _id: string;
    id: string;
    name: string;
    role: "manager" | "employee";
  };
}

export const authAPI = {
  async login(name: string, password: string): Promise<AuthResponse> {
    try {
      const response = await post<AuthResponse>("/auth/login", {
        name,
        password,
      });
      return response.data!;
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },

  async getCurrentUser(): Promise<{ user: AuthResponse["user"] }> {
    try {
      const response = await get<{ user: AuthResponse["user"] }>("/auth/me");
      return response.data!;
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },

  async logout(): Promise<void> {
    try {
      await post("/auth/logout");
    } catch (error) {
      throw ErrorHandler.handle(error);
    }
  },
};
