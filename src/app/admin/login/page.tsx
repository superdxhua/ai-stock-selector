"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
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
        // 保存登录信息到localStorage
        localStorage.setItem("admin_token", result.data.token);
        localStorage.setItem("admin_user", JSON.stringify(result.data.user));
        
        // 跳转到首页
        window.location.href = "/";
      } else {
        setError(result.error || "登录失败");
      }
    } catch (error) {
      console.error("登录错误:", error);
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            管理员登录
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            登录以访问管理后台
          </p>
        </div>

        {/* 登录卡片 */}
        <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-700">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                <Lock className="w-8 h-8" />
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl">欢迎回来</CardTitle>
              <CardDescription>
                请输入您的管理员账号和密码
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* 用户名 */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  用户名
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  密码
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
                  <AlertDescription className="text-red-900 dark:text-red-100">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* 登录按钮 */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    登录中...
                  </>
                ) : (
                  "登录"
                )}
              </Button>
            </form>

            {/* 提示信息 */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                <p className="mb-2">测试账号：</p>
                <p className="font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded inline-block">
                  admin / admin123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>© 2025 牛股选股智能体. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
