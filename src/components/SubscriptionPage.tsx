"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, Crown, Sparkles, ArrowRight, Copy, RefreshCw, Lock } from "lucide-react";

interface MembershipPackage {
  id: string;
  name: string;
  price: number;
  days: number;
  description: string;
  features: string[];
  isTrial?: boolean;
}

export default function SubscriptionPage() {
  const [packages, setPackages] = useState<Record<string, MembershipPackage>>({});
  const [selectedPackage, setSelectedPackage] = useState<MembershipPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [membership, setMembership] = useState<any>(null);

  useEffect(() => {
    loadPackages();
    loadMembershipStatus();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await fetch("/api/packages");
      const result = await response.json();
      
      if (result.success) {
        // 只显示付费套餐
        const paidPackages: Record<string, MembershipPackage> = {};
        Object.entries(result.data).forEach(([key, pkg]) => {
          const p = pkg as MembershipPackage;
          if (!p.isTrial) {
            paidPackages[key] = p;
          }
        });
        setPackages(paidPackages);
      }
    } catch (error) {
      console.error("加载套餐失败:", error);
    }
  };

  const loadMembershipStatus = async () => {
    try {
      const response = await fetch("/api/user/membership", {
        headers: {
          "x-user-id": "demo-user-id",
        },
      });
      const result = await response.json();
      
      if (result.success) {
        setMembership(result.data);
      }
    } catch (error) {
      console.error("加载会员状态失败:", error);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            订阅会员服务
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            解锁完整功能，畅享专业策略
          </p>
        </div>

        {/* 会员状态卡片 */}
        {membership && (
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">当前状态</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {membership.isMember ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          {membership.isTrial ? '试用会员' : '付费会员'}
                        </span>
                      ) : (
                        <span className="text-slate-500">免费用户</span>
                      )}
                    </p>
                  </div>
                </div>
                {membership.expireAt && (
                  <div className="text-right">
                    <p className="text-sm text-slate-600 dark:text-slate-400">过期时间</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {formatDate(membership.expireAt)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 套餐选择 */}
        {!orderInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.values(packages).map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl cursor-pointer border-2 ${
                  selectedPackage?.id === pkg.id
                    ? "border-blue-500 shadow-2xl scale-105"
                    : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
                }`}
                onClick={() => setSelectedPackage(pkg)}
              >
                {pkg.id === 'monthly' && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 text-xs font-bold">
                    超值推荐
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                    <Sparkles className="w-6 h-6 text-purple-500" />
                  </div>
                  <CardDescription>{pkg.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                      ¥{pkg.price}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 ml-2">/{pkg.days}天</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-4"
                    variant={selectedPackage?.id === pkg.id ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPackage(pkg);
                    }}
                  >
                    {selectedPackage?.id === pkg.id ? '已选择' : '选择此套餐'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 支付方式 */}
        {selectedPackage && !orderInfo && (
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle>选择支付方式</CardTitle>
              <CardDescription>请选择您偏好的支付方式完成支付</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant={paymentMethod === 'wechat' ? 'default' : 'outline'}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => createOrder('wechat')}
                >
                  <span className="text-2xl">💚</span>
                  <span>微信支付</span>
                </Button>
                <Button
                  variant={paymentMethod === 'alipay' ? 'default' : 'outline'}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => createOrder('alipay')}
                >
                  <span className="text-2xl">💙</span>
                  <span>支付宝</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 订单信息 */}
        {orderInfo && (
          <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                订单已创建
              </CardTitle>
              <CardDescription>请按照以下步骤完成支付</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <AlertDescription>
                  <strong>订单号：</strong>{orderInfo.orderNo}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={copyOrderNo}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </AlertDescription>
              </Alert>

              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <AlertDescription>
                  <strong>支付金额：</strong>¥{orderInfo.amount}
                </AlertDescription>
              </Alert>
              
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <AlertDescription>
                  <strong>支付方式：</strong>
                  {paymentMethod === 'wechat' ? '微信支付' : '支付宝'}
                </AlertDescription>
              </Alert>

              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <AlertDescription>
                  <strong>支付步骤：</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫描下方二维码</li>
                    <li>支付 <strong>¥{orderInfo.amount} 元</strong></li>
                    <li>支付完成后截图保存</li>
                    <li>添加客服微信：<strong>xxx</strong></li>
                    <li>发送订单号和支付截图，客服会为您开通会员</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex justify-center py-6">
                <div className="w-48 h-48 bg-white rounded-lg shadow-lg flex items-center justify-center border-2 border-slate-200">
                  <div className="text-center">
                    <div className="text-6xl mb-2">
                      {paymentMethod === 'wechat' ? '💚' : '💙'}
                    </div>
                    <p className="text-sm text-slate-600">
                      {paymentMethod === 'wechat' ? '微信' : '支付宝'}支付码
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOrderInfo(null);
                    setPaymentMethod('');
                  }}
                >
                  取消订单
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新页面
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 新用户提示 */}
        {membership && membership.isMember && membership.isTrial && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <Crown className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <div>
                <p className="font-semibold">您正在使用7天免费试用</p>
                <p className="text-sm mt-1">
                  试用剩余 <strong>{membership.daysLeft}</strong> 天，试用结束后需要订阅才能继续查看完整策略
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
