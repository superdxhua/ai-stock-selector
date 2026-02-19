"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, Crown, Star, Zap, ArrowRight, Copy, RefreshCw } from "lucide-react";

interface MembershipPackage {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  duration: number;
  dailyQuota: number;
  features: string[];
  paymentMethods?: string[];
  pointsCost?: number;
}

export default function PaymentPage() {
  const [packages, setPackages] = useState<Record<string, MembershipPackage>>({});
  const [selectedPackage, setSelectedPackage] = useState<MembershipPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [membership, setMembership] = useState<any>(null);
  const [checkInInfo, setCheckInInfo] = useState<any>(null);

  useEffect(() => {
    loadPackages();
    loadUserInfo();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await fetch("/api/packages");
      const result = await response.json();
      
      if (result.success) {
        setPackages(result.data);
      }
    } catch (error) {
      console.error("加载套餐失败:", error);
    }
  };

  const loadUserInfo = async () => {
    try {
      const response = await fetch("/api/user/info", {
        headers: {
          "x-user-id": "demo-user-id",
        },
      });
      const result = await response.json();
      
      if (result.success) {
        setUserPoints(result.data.points);
        setMembership(result.data.membership);
        setCheckInInfo(result.data.checkInInfo);
      }
    } catch (error) {
      console.error("加载用户信息失败:", error);
    }
  };

  const createOrder = async (paymentMethod: string) => {
    if (!selectedPackage) return;

    setLoading(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "demo-user-id",
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          paymentMethod,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOrderInfo(result.data);
        setPaymentMethod(paymentMethod);
        
        if (paymentMethod === 'points') {
          alert(result.message);
          await loadUserInfo();
        }
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("创建订单失败:", error);
      alert("创建订单失败");
    } finally {
      setLoading(false);
    }
  };

  const copyOrderNo = () => {
    if (orderInfo?.orderNo) {
      navigator.clipboard.writeText(orderInfo.orderNo);
      alert("订单号已复制");
    }
  };

  const handleCheckIn = async () => {
    if (checkInInfo?.hasCheckedIn) {
      alert("今日已签到");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "demo-user-id",
        },
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        await loadUserInfo();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("签到失败:", error);
      alert("签到失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-950 dark:to-purple-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 头部 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            升级会员
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            解锁更多功能，享受更好的服务
          </p>
        </div>

        {/* 用户信息卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-600" />
                我的积分
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{userPoints}</div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                可用于兑换会员
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-blue-600" />
                当前会员
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {membership?.level === 'free' ? '免费版' : membership?.level === 'silver' ? '白银' : membership?.level === 'gold' ? '黄金' : '铂金'}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {membership?.isExpired ? '已过期' : membership?.remainingDays > 0 ? `剩余${membership.remainingDays}天` : '永久'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                每日签到
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCheckIn}
                disabled={loading || checkInInfo?.hasCheckedIn}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {checkInInfo?.hasCheckedIn ? '已签到' : '立即签到'}
              </Button>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                {checkInInfo?.hasCheckedIn ? `连续${checkInInfo.consecutiveDays}天` : `连续${checkInInfo?.consecutiveDays || 0}天`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 套餐列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(packages).map((pkg) => (
            <Card
              key={pkg.id}
              className={`cursor-pointer transition-all ${
                selectedPackage?.id === pkg.id
                  ? "ring-4 ring-blue-500 shadow-xl"
                  : "hover:shadow-lg"
              } ${pkg.id === 'yearly' ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-2 border-purple-500' : ''}`}
              onClick={() => setSelectedPackage(pkg)}
            >
              {pkg.id === 'yearly' && (
                <div className="bg-purple-600 text-white text-center py-1 text-sm font-semibold">
                  最受欢迎
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl">{pkg.name}</span>
                  {pkg.id !== 'free' && pkg.originalPrice && (
                    <span className="text-sm text-slate-500 line-through">
                      ¥{pkg.originalPrice}
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {pkg.price === 0 ? '免费' : `¥${pkg.price}`}
                  {pkg.duration > 0 && (
                    <span className="text-sm font-normal text-slate-600 dark:text-slate-400">
                      /{pkg.duration === 365 ? '年' : pkg.duration === 90 ? '季' : pkg.duration === 30 ? '月' : pkg.duration === 7 ? '周' : pkg.duration + '天'}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {pkg.pointsCost && (
                  <div className="bg-amber-50 dark:bg-amber-950 p-2 rounded border border-amber-200 dark:border-amber-800">
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <span className="font-semibold">积分兑换：</span>{pkg.pointsCost}积分
                    </div>
                  </div>
                )}
                
                <Button
                  className="w-full"
                  variant={selectedPackage?.id === pkg.id ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPackage(pkg);
                  }}
                >
                  {selectedPackage?.id === pkg.id ? '已选择' : '选择套餐'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 支付方式选择 */}
        {selectedPackage && selectedPackage.id !== 'free' && !orderInfo && (
          <Card>
            <CardHeader>
              <CardTitle>选择支付方式</CardTitle>
              <CardDescription>
                您选择的套餐：{selectedPackage.name}，金额：¥{selectedPackage.price}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPackage.paymentMethods?.map((method) => (
                <div
                  key={method}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    paymentMethod === method
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                  onClick={() => setPaymentMethod(method)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {method === 'points' && <Star className="w-6 h-6 text-amber-500" />}
                      {method === 'shoukuiba' && <RefreshCw className="w-6 h-6 text-blue-500" />}
                      {method === 'wangpu' && <Zap className="w-6 h-6 text-green-500" />}
                      <div>
                        <div className="font-semibold">
                          {method === 'points' ? '积分兑换' : 
                           method === 'shoukuiba' ? '收款吧支付' :
                           method === 'wangpu' ? '旺铺管家支付' :
                           method === 'alipay-personal' ? '支付宝个人' :
                           method === 'bank-transfer' ? '银行转账' : method}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {method === 'points' && `${selectedPackage.pointsCost}积分`}
                          {method === 'shoukuiba' && '支持微信、支付宝扫码'}
                          {method === 'wangpu' && '支持微信、支付宝扫码'}
                        </div>
                      </div>
                    </div>
                    {paymentMethod === method && <Check className="w-5 h-5 text-blue-500" />}
                  </div>
                </div>
              ))}
              
              {paymentMethod && (
                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={() => createOrder(paymentMethod)}
                    disabled={loading}
                  >
                    {loading ? '处理中...' : '确认支付'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 支付信息展示 */}
        {orderInfo && paymentMethod !== 'points' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                订单创建成功
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>订单号：</strong>{orderInfo.orderNo}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyOrderNo}
                    className="ml-2"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertDescription>
                  <strong>支付金额：</strong>¥{orderInfo.amount}
                </AlertDescription>
              </Alert>
              
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>支付步骤：</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>扫描下方二维码支付 ¥{orderInfo.amount} 元</li>
                    <li>支付完成后截图</li>
                    <li>添加客服微信：xxx</li>
                    <li>发送截图和订单号，等待开通（通常5-10分钟）</li>
                  </ol>
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <div className="inline-block p-4 bg-white dark:bg-slate-800 rounded-lg border">
                  <div className="w-48 h-48 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <span className="text-slate-500 dark:text-slate-400">
                      {paymentMethod === 'shoukuiba' ? '收款吧收款码' : '旺铺管家收款码'}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  setOrderInfo(null);
                  setPaymentMethod('');
                }}
              >
                返回重新选择
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
