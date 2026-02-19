"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, RefreshCw, Filter, Download } from "lucide-react";

interface Order {
  id: string;
  orderNo: string;
  userId: string;
  packageName: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  expiredAt?: string;
  remark?: string;
}

interface AdminStats {
  total: number;
  pending: number;
  paid: number;
  cancelled: number;
  totalAmount: number;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    total: 0,
    pending: 0,
    paid: 0,
    cancelled: 0,
    totalAmount: 0,
  });
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('pending');
  const [loading, setLoading] = useState(false);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [filterStatus]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/orders${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data);
      } else {
        alert("加载订单失败");
      }
    } catch (error) {
      console.error("加载订单失败:", error);
      alert("加载订单失败");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/orders?status=pending");
      const result = await response.json();
      
      if (result.success) {
        const pendingCount = result.pagination?.total || 0;
        
        // 获取已支付订单数
        const paidResponse = await fetch("/api/admin/orders?status=paid");
        const paidResult = await paidResponse.json();
        const paidCount = paidResult.pagination?.total || 0;
        
        // 获取已取消订单数
        const cancelledResponse = await fetch("/api/admin/orders?status=cancelled");
        const cancelledResult = await cancelledResponse.json();
        const cancelledCount = cancelledResult.pagination?.total || 0;
        
        // 获取总订单数
        const allResponse = await fetch("/api/admin/orders");
        const allResult = await allResponse.json();
        const totalCount = allResult.pagination?.total || 0;
        
        // 计算总金额（从已支付订单中）
        const paidOrders = paidResult.data || [];
        const totalAmount = paidOrders.reduce((sum: number, order: any) => sum + order.amount, 0);
        
        setStats({
          pending: pendingCount,
          paid: paidCount,
          cancelled: cancelledCount,
          total: totalCount,
          totalAmount: totalAmount,
        });
      }
    } catch (error) {
      console.error("加载统计失败:", error);
    }
  };

  const approveOrder = async (orderId: string) => {
    if (!confirm("确认通过此订单？")) return;

    setProcessingOrder(orderId);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          orderId,
          adminToken: "admin-token-123456",
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("订单已通过");
        await loadOrders();
        await loadStats();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("审核订单失败:", error);
      alert("审核订单失败");
    } finally {
      setProcessingOrder(null);
    }
  };

  const rejectOrder = async (orderId: string) => {
    const reason = prompt("请输入拒绝原因：");
    if (!reason) return;

    setProcessingOrder(orderId);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          orderId,
          adminToken: "admin-token-123456",
          reason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("订单已拒绝");
        await loadOrders();
        await loadStats();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("拒绝订单失败:", error);
      alert("拒绝订单失败");
    } finally {
      setProcessingOrder(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "待支付", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      paid: { label: "已支付", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      cancelled: { label: "已取消", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
      expired: { label: "已过期", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentMethodName = (method: string) => {
    const names: Record<string, string> = {
      points: "积分兑换",
      shoukuiba: "收款吧",
      wangpu: "旺铺管家",
      "alipay-personal": "支付宝个人",
      "bank-transfer": "银行转账",
    };
    return names[method] || method;
  };

  const isOrderExpired = (order: Order) => {
    if (!order.expiredAt) return false;
    return new Date(order.expiredAt) < new Date();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">订单管理</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              管理和审核用户订单
            </p>
          </div>
          <Button
            onClick={loadOrders}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600 dark:text-slate-400">
                总订单
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600 dark:text-slate-400">
                待审核
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600 dark:text-slate-400">
                已支付
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600 dark:text-slate-400">
                已取消
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600 dark:text-slate-400">
                总金额
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ¥{stats.totalAmount.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 筛选按钮 */}
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
          >
            <Filter className="w-4 h-4 mr-2" />
            全部
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pending')}
          >
            待审核
          </Button>
          <Button
            variant={filterStatus === 'paid' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('paid')}
          >
            已支付
          </Button>
          <Button
            variant={filterStatus === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('cancelled')}
          >
            已取消
          </Button>
        </div>

        {/* 订单列表 */}
        <Card>
          <CardHeader>
            <CardTitle>订单列表</CardTitle>
            <CardDescription>
              当前显示：<strong>{filterStatus === 'all' ? '全部' : filterStatus === 'pending' ? '待审核' : filterStatus === 'paid' ? '已支付' : '已取消'}</strong>
              订单，共 <strong>{orders.length}</strong> 条
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                暂无订单
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单号</TableHead>
                      <TableHead>套餐</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>支付方式</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.orderNo}
                        </TableCell>
                        <TableCell>{order.packageName}</TableCell>
                        <TableCell>¥{order.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          {getPaymentMethodName(order.paymentMethod)}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(order.createdAt).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          {order.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => approveOrder(order.id)}
                                disabled={processingOrder === order.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => rejectOrder(order.id)}
                                disabled={processingOrder === order.id}
                                variant="destructive"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          {order.status === 'paid' && (
                            <span className="text-sm text-green-600">
                              已开通
                            </span>
                          )}
                          {order.status === 'cancelled' && (
                            <span className="text-sm text-slate-500">
                              {order.remark}
                            </span>
                          )}
                          {isOrderExpired(order) && order.status === 'pending' && (
                            <Alert className="mt-2">
                              <span className="text-sm text-red-600">
                                订单已过期
                              </span>
                            </Alert>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
