"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AdminAuthContextType {
  isAdminLoggedIn: boolean;
  adminUser: AdminUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // 检查本地存储的登录状态
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const userStr = localStorage.getItem("admin_user");
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsAdminLoggedIn(true);
        setAdminUser(user);
      } catch (error) {
        console.error("解析用户信息失败:", error);
        // 清除无效的存储
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // 保存到localStorage
      localStorage.setItem("admin_token", result.data.token);
      localStorage.setItem("admin_user", JSON.stringify(result.data.user));
      
      // 更新状态
      setIsAdminLoggedIn(true);
      setAdminUser(result.data.user);
    } else {
      throw new Error(result.error || "登录失败");
    }
  };

  const logout = () => {
    // 清除本地存储
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    
    // 更新状态
    setIsAdminLoggedIn(false);
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAdminLoggedIn,
        adminUser,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
