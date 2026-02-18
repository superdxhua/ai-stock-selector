"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock, Target, BarChart3, Eye } from "lucide-react";

interface TrackingRecord {
  id: number;
  stockCode: string;
  stockName: string;
  strategy: string;
  bullScore: number;
  potentialLevel: string;
  price: number;
  changePercent: number;
  trackingStatus: string;
  expectedGain: number;
  t1Gain?: number;
  t3Gain?: number;
  maxGain?: number;
  result?: string;
  screenedAt: string;
  completedAt?: string;
  createdAt: string;
}

interface TrackingStats {
  total: number;
  pending: number;
  tracking: number;
  completed: number;
  success: number;
  failed: number;
}

export default function StockTrackingManager() {
  const [records, setRecords] = useState<TrackingRecord[]>([]);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "tracking" | "completed" | "success" | "failed">("all");
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async (tab: string = activeTab) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'records',
        limit: '50',
      });

      if (tab !== 'all') {
        if (tab === 'success' || tab === 'failed') {
          params.append('result', tab);
        } else {
          params.append('status', tab);
        }
      }

      const response = await fetch(`/api/experience?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRecords(data.data || []);
      }
    } catch (error) {
      console.error('获取跟踪记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/experience?type=stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchStats();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value as any);
    fetchData(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'tracking':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'tracking':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPotentialColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getGainColor = (gain: number) => {
    if (gain > 0) return 'text-red-600';
    if (gain < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 border-2 text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">总记录</div>
          <div className="text-2xl font-bold">{stats?.total || 0}</div>
        </Card>
        <Card className="p-4 border-2 text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">待跟踪</div>
          <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
        </Card>
        <Card className="p-4 border-2 text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">跟踪中</div>
          <div className="text-2xl font-bold text-blue-600">{stats?.tracking || 0}</div>
        </Card>
        <Card className="p-4 border-2 text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">已完成</div>
          <div className="text-2xl font-bold text-gray-600">{stats?.completed || 0}</div>
        </Card>
        <Card className="p-4 border-2 text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">成功</div>
          <div className="text-2xl font-bold text-green-600">{stats?.success || 0}</div>
        </Card>
        <Card className="p-4 border-2 text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">失败</div>
          <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
        </Card>
      </div>

      {/* 跟踪记录列表 */}
      <Card className="p-6 border-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Eye className="w-5 h-5" />
            跟踪记录
          </h3>
          <Button
            onClick={() => fetchData()}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            刷新
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="pending">待跟踪</TabsTrigger>
            <TabsTrigger value="tracking">跟踪中</TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
            <TabsTrigger value="success">成功</TabsTrigger>
            <TabsTrigger value="failed">失败</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">股票</th>
                      <th className="text-left py-3 px-2">策略</th>
                      <th className="text-left py-3 px-2">评分</th>
                      <th className="text-left py-3 px-2">筛选日期</th>
                      <th className="text-left py-3 px-2">预期</th>
                      <th className="text-left py-3 px-2">T+1</th>
                      <th className="text-left py-3 px-2">T+3</th>
                      <th className="text-left py-3 px-2">最大</th>
                      <th className="text-left py-3 px-2">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-2">
                          <div className="font-medium">{record.stockName}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{record.stockCode}</div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline">{record.strategy}</Badge>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{record.bullScore}</span>
                            <Badge className={getPotentialColor(record.potentialLevel)}>
                              {record.potentialLevel}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {formatDate(record.screenedAt)}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4 text-gray-500" />
                            <span className={getGainColor(record.expectedGain)}>
                              {record.expectedGain}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {record.t1Gain !== undefined ? (
                            <span className={getGainColor(record.t1Gain)}>
                              {record.t1Gain.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {record.t3Gain !== undefined ? (
                            <span className={getGainColor(record.t3Gain)}>
                              {record.t3Gain.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {record.maxGain !== undefined ? (
                            <span className={getGainColor(record.maxGain)}>
                              {record.maxGain.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.result || record.trackingStatus)}
                            <Badge className={getStatusColor(record.result || record.trackingStatus)}>
                              {record.result === 'success' ? '成功' :
                               record.result === 'failed' ? '失败' :
                               record.trackingStatus === 'tracking' ? '跟踪中' :
                               record.trackingStatus === 'pending' ? '待跟踪' :
                               record.trackingStatus === 'completed' ? '已完成' : '-'}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  暂无{activeTab === 'all' ? '' : activeTab === 'success' ? '成功' : activeTab === 'failed' ? '失败' : ''}跟踪记录
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
