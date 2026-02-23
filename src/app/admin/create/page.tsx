"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, User, Mail, Lock, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminCreatePage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ username: string; email: string } | null>(null);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    setCreatedUser(null);

    // 验证密码匹配
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      setLoading(false);
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      setError("密码至少6个字符");
      setLoading(false);
      return;
    }

    // 验证用户名长度
    if (username.length < 3) {
      setError("用户名至少3个字符");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          email: email || `${username}@admin.local`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setCreatedUser({
          username: result.data.username,
          email: result.data.email,
        });
      } else {
        setError(result.error || "创建管理员失败");
      }
    } catch (error) {
      console.error("创建管理员错误:", error);
      setError("创建管理员失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    window.location.href = "/admin/login";
  };

  if (success && createdUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* 成功提示 */}
          <Card className="shadow-2xl border-2 border-green-200 dark:border-green-700">
            <CardHeader className="space-y-4 text-center">
              <div className="flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-lg">
                  <CheckCircle className="w-10 h-10" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                  创建成功！
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
                  管理员账号已成功创建
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 创建的账号信息 */}
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                <AlertDescription className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">用户名:</span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {createdUser.username}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">邮箱:</span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {createdUser.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">密码:</span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {password}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>

              {/* 重要提示 */}
              <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  ⚠️ 请妥善保存账号密码，不要泄露给他人！
                </AlertDescription>
              </Alert>

              {/* 去登录按钮 */}
              <Button
                onClick={handleGoToLogin}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                去登录
              </Button>

              {/* 返回首页 */}
              <Link href="/">
                <Button variant="outline" className="w-full h-12">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回首页
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            创建管理员
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            创建管理员账号以访问管理后台
          </p>
        </div>

        {/* 创建卡片 */}
        <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-700">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                <UserPlus className="w-8 h-8" />
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl">创建新管理员</CardTitle>
              <CardDescription>
                填写以下信息创建管理员账号
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-6">
              {/* 用户名 */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  用户名 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名（至少3个字符）"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12"
                    required
                    minLength={3}
                  />
                </div>
              </div>

              {/* 邮箱（可选） */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  邮箱 <span className="text-slate-400">（可选）</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  密码 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码（至少6个字符）"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* 确认密码 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  确认密码 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="请再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
                  <AlertDescription className="text-red-600 dark:text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* 创建按钮 */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    创建管理员
                  </>
                )}
              </Button>

              {/* 返回首页 */}
              <Link href="/">
                <Button variant="outline" className="w-full h-12">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回首页
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
