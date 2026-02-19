"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, CheckCircle, Gift, Clock, Shield, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MobileRegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePhoneRegister = async () => {
    if (!phone || phone.length < 11) {
      alert("请输入有效的手机号");
      return;
    }

    setIsRegistering(true);

    try {
      // 先尝试登录
      const loginResponse = await fetch("/api/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const loginData = await loginResponse.json();

      if (loginData.success) {
        // 登录成功
        localStorage.setItem("userId", loginData.data.id);
        localStorage.setItem("userInfo", JSON.stringify(loginData.data));
        setShowSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 2000);
        return;
      }

      // 登录失败，尝试注册
      const registerResponse = await fetch("/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, username }),
      });

      const registerData = await registerResponse.json();

      if (registerData.success) {
        // 注册成功后自动登录
        const autoLoginResponse = await fetch("/api/user/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone }),
        });

        const autoLoginData = await autoLoginResponse.json();

        if (autoLoginData.success) {
          localStorage.setItem("userId", autoLoginData.data.id);
          localStorage.setItem("userInfo", JSON.stringify(autoLoginData.data));
          setShowSuccess(true);
          setTimeout(() => {
            router.push("/");
          }, 2000);
        }
      } else {
        alert(registerData.error || "注册失败");
      }
    } catch (error) {
      console.error("注册失败:", error);
      alert("注册失败，请重试");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900 p-4">
      <div className="container mx-auto max-w-md">
        {/* 头部 */}
        <div className="text-center mb-8 pt-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg mb-4">
            <Smartphone className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            手机号注册
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            快速注册，立即享受7天免费试用
          </p>
        </div>

        {/* 成功提示 */}
        {showSuccess && (
          <Card className="p-8 border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <div className="text-center">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                注册成功！
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                正在跳转到首页...
              </p>
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <Gift className="w-5 h-5" />
                <span className="font-medium">已获得7天免费试用</span>
              </div>
            </div>
          </Card>
        )}

        {/* 注册表单 */}
        {!showSuccess && (
          <Card className="p-6 border-2 border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">
                  手机号 *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={11}
                  className="mt-1 text-lg"
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="username" className="text-slate-700 dark:text-slate-300">
                  用户名（可选）
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  不填写则使用手机号作为用户名
                </p>
              </div>
            </div>

            {/* 注册按钮 */}
            <Button
              onClick={handlePhoneRegister}
              disabled={isRegistering || !phone || phone.length < 11}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-4 text-lg"
            >
              {isRegistering ? (
                "注册中..."
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  立即注册
                </>
              )}
            </Button>

            {/* 优惠信息 */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                <Gift className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-600 dark:text-green-400 text-sm">
                    新用户专享福利
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    注册即享7天免费试用
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                    免密登录
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    手机号即为账户，无需记忆密码
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                <Shield className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-purple-600 dark:text-purple-400 text-sm">
                    安全保障
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    数据加密存储，隐私安全保护
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 底部提示 */}
        {!showSuccess && (
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              注册即表示您同意我们的{" "}
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                用户协议
              </a>{" "}
              和{" "}
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                隐私政策
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
