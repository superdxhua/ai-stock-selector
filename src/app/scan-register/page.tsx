"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Smartphone, CheckCircle, ArrowLeft, Sparkles, Gift, Clock, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ScanRegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registerUrl, setRegisterUrl] = useState("");

  // 生成注册链接二维码
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 使用当前域名生成注册链接
      const baseUrl = window.location.origin;
      setRegisterUrl(`${baseUrl}/register-mobile`);
    }
  }, []);

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

  const handleScanComplete = async (scannedPhone: string) => {
    setIsScanning(false);
    setPhone(scannedPhone);
    handlePhoneRegister();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              扫码注册
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              快速注册，立即享受7天免费试用
            </p>
          </div>
        </div>

        {/* 成功提示 */}
        {showSuccess && (
          <Card className="max-w-md mx-auto p-8 border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
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

        {/* 扫码注册卡片 */}
        {!showSuccess && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* 左侧：二维码 */}
            <Card className="p-8 border-2 border-blue-200 dark:border-blue-800 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg">
                    <QrCode className="w-8 h-8" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-100">
                  扫码快速注册
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  使用手机扫描下方二维码，在手机上完成注册
                </p>

                {/* 二维码 */}
                {registerUrl && (
                  <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-lg">
                    <QRCodeSVG
                      value={registerUrl}
                      size={256}
                      level="H"
                      includeMargin={true}
                      className="w-64 h-64"
                    />
                  </div>
                )}

                {/* 使用说明 */}
                <div className="text-left space-y-3 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
                  <h3 className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    注册步骤
                  </h3>
                  <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <span>使用手机微信或其他扫码工具扫描二维码</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <span>在打开的页面中输入手机号完成注册</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <span>注册成功后自动登录，享受7天免费试用</span>
                    </li>
                  </ol>
                </div>
              </div>
            </Card>

            {/* 右侧：直接输入手机号注册 */}
            <Card className="p-8 border-2 border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <div>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg">
                    <Smartphone className="w-8 h-8" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-100 text-center">
                  手机号注册
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 text-center">
                  直接输入手机号完成注册，无需设置密码
                </p>

                {/* 表单 */}
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
                      className="mt-1"
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
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 text-lg"
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
                    <Gift className="w-6 h-6 text-green-500 flex-shrink-0" />
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
                    <Clock className="w-6 h-6 text-blue-500 flex-shrink-0" />
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
                    <Shield className="w-6 h-6 text-purple-500 flex-shrink-0" />
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
              </div>
            </Card>
          </div>
        )}

        {/* 底部提示 */}
        {!showSuccess && (
          <div className="max-w-6xl mx-auto mt-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
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
