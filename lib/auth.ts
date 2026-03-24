// Simple authentication utilities
import { apiRequest } from "@/lib/api-client";

export interface User {
  username: string;
  id: string;
}

export const isAuthenticated = (): boolean => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    return !!token;
  }
  return false;
};

export const getUser = (): User | null => {
  if (typeof window !== "undefined") {
    const userJson = localStorage.getItem("user");
    return userJson ? JSON.parse(userJson) : null;
  }
  return null;
};

export const login = async (username: string, password: string): Promise<boolean> => {
  try {
    const data = await apiRequest<{
      username?: string;
      id?: string;
      token?: string;
    }>("login.php", {
      method: "POST",
      body: {
        user: username,
        pass: password,
      },
    });

    const user: User = {
      username: data.username || username,
      id: data.id || Math.random().toString(36).slice(2, 11),
    };
    const token = data.token || "token_" + Date.now();

    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(user));

    if (typeof window !== "undefined") {
      document.cookie = `authToken=${token}; path=/; max-age=86400; SameSite=Strict`;
    }
    return true;
  } catch (error) {
    console.error("Login error:", error);
    return false;
  }
};

export const logout = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    // Remove cookie for middleware
    document.cookie = "authToken=; path=/; max-age=0; SameSite=Strict";
  }
};
