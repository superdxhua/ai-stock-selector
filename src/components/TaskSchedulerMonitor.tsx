"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RefreshCw, Clock, CheckCircle2, XCircle, Loader2, Calendar, TrendingUp, Flame, Crown } from "lucide-react";

interface SchedulerStatus {
  running: boolean;
  scheduledTasks: string[];
  recentExecutions: number;
  isTradingTime: boolean;
}

interface TradingStatus {
  isTrading: boolean;
  isTradingDay: boolean;
  currentSession: { name: string; type: string } | null;
  countdown: number;
  countdownText: string;
  description: string;
}

interface TaskExecution {
  id: string;
  type: string;
  status: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  result?: any;
  error?: string;
  metadata?: {
    tradingSession?: string;
    stocksAnalyzed?: number;
    strategiesRun?: string[];
  };
}

export default function TaskSchedulerMonitor() {
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [tradingStatus, setTradingStatus] = useState<TradingStatus | null>(null);
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scheduler/status');
      const data = await response.json();

      if (data.success) {
        setSchedulerStatus(data.scheduler);
        setTradingStatus(data.trading);
        setExecutions(data.recentExecutions || []);
      }
    } catch (error) {
      console.error('获取调度器状态失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startScheduler = async () => {
    try {
      const response = await fetch('/api/scheduler/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      const data = await response.json();

      if (data.success) {
        fetchStatus();
      }
    } catch (error) {
      console.error('启动调度器失败:', error);
    }
  };

  const stopScheduler = async () => {
    try {
      const response = await fetch('/api/scheduler/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
      const data = await response.json();

      if (data.success) {
        fetchStatus();
      }
    } catch (error) {
      console.error('停止调度器失败:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // 每10秒刷新一次
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'running':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'stock_analysis':
        return <TrendingUp className="w-4 h-4" />;
      case 'bull_stock_scan':
        return <Flame className="w-4 h-4" />;
      case 'strategy_update':
        return <Crown className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTaskName = (type: string) => {
    switch (type) {
      case 'stock_analysis':
        return '股票分析';
      case 'bull_stock_scan':
        return '大牛股扫描';
      case 'strategy_update':
        return '策略更新';
      default:
        return type;
    }
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* 标题和控制栏 */}
      <Card className="p-6 border-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg shadow-md">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                自动任务调度器
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                交易时间自动启动分析和筛选任务
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={schedulerStatus?.running ? stopScheduler : startScheduler}
              disabled={isLoading}
              variant={schedulerStatus?.running ? 'destructive' : 'default'}
            >
              {schedulerStatus?.running ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  停止调度器
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  启动调度器
                </>
              )}
            </Button>
            <Button
              onClick={fetchStatus}
              disabled={isLoading}
              variant="outline"
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* 调度器状态 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              调度器状态
            </div>
            <Badge className={schedulerStatus?.running ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
              {schedulerStatus?.running ? '运行中' : '已停止'}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">已调度任务</span>
              <span className="font-medium">{schedulerStatus?.scheduledTasks.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">执行记录</span>
              <span className="font-medium">{schedulerStatus?.recentExecutions || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              交易时间状态
            </div>
            <Badge className={tradingStatus?.isTrading ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
              {tradingStatus?.isTrading ? '交易中' : '休市中'}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">交易日</span>
              <span className="font-medium">{tradingStatus?.isTradingDay ? '是' : '否'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">当前时段</span>
              <span className="font-medium">{tradingStatus?.currentSession?.name || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">倒计时</span>
              <span className="font-medium">{tradingStatus?.countdownText || '-'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 交易时间描述 */}
      {tradingStatus && (
        <Card className="p-4 border-2 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {tradingStatus.description}
            </p>
          </div>
        </Card>
      )}

      {/* 任务执行记录 */}
      <Card className="p-6 border-2">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          最近执行记录
        </h3>

        {executions.length > 0 ? (
          <div className="space-y-3">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTaskIcon(execution.type)}
                    <span className="font-medium">{getTaskName(execution.type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(execution.status)}
                    <Badge className={getStatusColor(execution.status)}>
                      {execution.status === 'completed' ? '已完成' :
                       execution.status === 'failed' ? '失败' :
                       execution.status === 'running' ? '执行中' : '等待中'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">开始时间</div>
                    <div className="font-medium">{formatTime(execution.startTime)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">结束时间</div>
                    <div className="font-medium">{execution.endTime ? formatTime(execution.endTime) : '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">执行耗时</div>
                    <div className="font-medium">{formatDuration(execution.duration)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">交易时段</div>
                    <div className="font-medium">{execution.metadata?.tradingSession || '-'}</div>
                  </div>
                </div>

                {execution.result && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {execution.result.stockCount !== undefined && `分析股票: ${execution.result.stockCount}只`}
                      {execution.result.bullStockCount !== undefined && `大牛股: ${execution.result.bullStockCount}只`}
                      {execution.result.totalStocks !== undefined && `总股票: ${execution.result.totalStocks}只`}
                    </div>
                  </div>
                )}

                {execution.error && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                    <div className="text-sm text-red-700 dark:text-red-300">
                      错误: {execution.error}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              暂无执行记录
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
