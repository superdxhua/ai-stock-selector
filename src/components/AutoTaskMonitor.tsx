"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Play, Pause, RefreshCw, Clock, CheckCircle2, AlertTriangle, TrendingUp, BarChart3, Settings, Zap, Activity, Globe, Calendar, Timer, Database, Brain, Target } from "lucide-react";

interface AutoTask {
  id: string;
  name: string;
  description: string;
  schedule: string;
  status: "active" | "paused" | "error";
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  successCount: number;
  failCount: number;
}

interface TaskStats {
  total: number;
  active: number;
  paused: number;
  error: number;
}

const TASK_CONFIG = {
  "hot-sector-watch": {
    icon: Globe,
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    bgColor: "from-blue-50/80 via-cyan-50/80 to-teal-50/80 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30",
    iconBg: "from-blue-500 to-cyan-500",
    label: "热点板块监控"
  },
  "bull-auto-analysis": {
    icon: Brain,
    gradient: "from-purple-500 via-indigo-500 to-violet-500",
    bgColor: "from-purple-50/80 via-indigo-50/80 to-violet-50/80 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-violet-950/30",
    iconBg: "from-purple-500 to-indigo-500",
    label: "大牛股分析"
  },
  "experience-generation": {
    icon: Database,
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    bgColor: "from-emerald-50/80 via-green-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30",
    iconBg: "from-emerald-500 to-green-500",
    label: "经验生成"
  },
  "t1-observation": {
    icon: Timer,
    gradient: "from-amber-500 via-orange-500 to-red-500",
    bgColor: "from-amber-50/80 via-orange-50/80 to-red-50/80 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30",
    iconBg: "from-amber-500 to-orange-500",
    label: "T+1 观察"
  },
  "t3-verification": {
    icon: Target,
    gradient: "from-rose-500 via-pink-500 to-red-500",
    bgColor: "from-rose-50/80 via-pink-50/80 to-red-50/80 dark:from-rose-950/30 dark:via-pink-950/30 dark:to-red-950/30",
    iconBg: "from-rose-500 to-pink-500",
    label: "T+3 验证"
  }
};

export default function AutoTaskMonitor() {
  const [tasks, setTasks] = useState<AutoTask[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, active: 0, paused: 0, error: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AutoTask | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auto-tasks');
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.data.tasks || []);
        setStats(data.data.stats || { total: 0, active: 0, paused: 0, error: 0 });
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // 每30秒刷新一次
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/auto-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          taskId
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchTasks();
      }
    } catch (error) {
      console.error('切换任务状态失败:', error);
    }
  };

  const handleRunTask = async (taskId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auto-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          taskId
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchTasks();
      }
    } catch (error) {
      console.error('执行任务失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 border-emerald-500/30 shadow-sm">
            <Activity className="w-3 h-3 mr-1" />
            运行中
          </Badge>
        );
      case 'paused':
        return (
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 border-slate-500/30 shadow-sm">
            <Pause className="w-3 h-3 mr-1" />
            已暂停
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 dark:bg-red-900/50 text-red-700 border-red-500/30 shadow-sm">
            <AlertTriangle className="w-3 h-3 mr-1" />
            错误
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSuccessRate = (task: AutoTask) => {
    if (task.runCount === 0) return '-';
    return ((task.successCount / task.runCount) * 100).toFixed(0) + '%';
  };

  const config = TASK_CONFIG as any;

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
          <div className="p-4 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100 mb-1">总任务数</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Settings className="w-10 h-10 opacity-20" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
          <div className="p-4 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-100 mb-1">运行中</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Activity className="w-10 h-10 opacity-20" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
          <div className="p-4 bg-gradient-to-br from-slate-500 via-gray-500 to-zinc-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-100 mb-1">已暂停</p>
                <p className="text-2xl font-bold">{stats.paused}</p>
              </div>
              <Pause className="w-10 h-10 opacity-20" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
          <div className="p-4 bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-100 mb-1">异常</p>
                <p className="text-2xl font-bold">{stats.error}</p>
              </div>
              <AlertTriangle className="w-10 h-10 opacity-20" />
            </div>
          </div>
        </Card>
      </div>

      {/* 控制面板 */}
      <Card className="shadow-2xl border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="relative overflow-hidden">
          {/* 顶部装饰条 */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 animate-gradient bg-[length:200%_100%]" />
          
          <div className="p-6 border-b bg-gradient-to-br from-blue-50/80 via-cyan-50/80 to-teal-50/80 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    自动任务管理
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    管理自动化的股票分析任务调度
                  </p>
                </div>
              </div>
              <Button
                onClick={fetchTasks}
                disabled={isLoading}
                variant="outline"
                className="shadow-md hover:shadow-lg transition-shadow"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    刷新中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    刷新
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading && tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">正在加载任务列表...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16">
              <Settings className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
              <p className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">暂无自动任务</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                自动任务系统尚未配置
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 任务卡片列表 */}
              {tasks.map((task) => {
                const taskConfig = config[task.id];
                const Icon = taskConfig?.icon || Settings;
                
                return (
                  <Card
                    key={task.id}
                    className={`overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-slate-200 dark:border-slate-700 ${
                      task.status === 'active' ? 'ring-2 ring-emerald-500/20' : ''
                    }`}
                  >
                    <div className="relative overflow-hidden">
                      {/* 顶部装饰条 */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${taskConfig?.gradient || 'from-slate-500 to-gray-500'}`} />
                      
                      {/* 背景装饰 */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${taskConfig?.bgColor || 'from-slate-50/80 to-gray-50/80'} opacity-50 -z-10`} />
                      
                      <div className="p-5">
                        {/* 头部 */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${taskConfig?.iconBg || 'from-slate-500 to-gray-500'} flex items-center justify-center text-white shadow-lg`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                                {taskConfig?.label || task.name}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {task.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(task.status)}
                          </div>
                        </div>

                        {/* 任务信息 */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span className="text-slate-600 dark:text-slate-400">
                              {task.schedule}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            <span className="text-slate-600 dark:text-slate-400">
                              运行 {task.runCount} 次
                            </span>
                          </div>
                          {task.lastRun && (
                            <div className="flex items-center gap-2 text-sm">
                              <RefreshCw className="w-4 h-4 text-purple-500" />
                              <span className="text-slate-600 dark:text-slate-400">
                                上次: {new Date(task.lastRun).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                          {task.nextRun && (
                            <div className="flex items-center gap-2 text-sm">
                              <Zap className="w-4 h-4 text-amber-500" />
                              <span className="text-slate-600 dark:text-slate-400">
                                下次: {new Date(task.nextRun).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 执行统计 */}
                        <div className="flex gap-3 mb-4">
                          <div className="flex-1 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-emerald-600 dark:text-emerald-400">成功</span>
                              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                {task.successCount}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                                style={{ width: `${(task.successCount / task.runCount) * 100}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex-1 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-red-600 dark:text-red-400">失败</span>
                              <span className="text-sm font-bold text-red-700 dark:text-red-300">
                                {task.failCount}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-red-200 dark:bg-red-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
                                style={{ width: `${(task.failCount / task.runCount) * 100}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex-1 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-blue-600 dark:text-blue-400">成功率</span>
                              <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                {getSuccessRate(task)}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                                style={{ width: task.runCount > 0 ? `${(task.successCount / task.runCount) * 100}%` : '0%' }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* 控制按钮 */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={task.status === 'active' ? 'outline' : 'default'}
                            className={`flex-1 shadow-md ${
                              task.status === 'active'
                                ? ''
                                : 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600'
                            }`}
                            onClick={() => handleToggleTask(task.id)}
                          >
                            {task.status === 'active' ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                暂停
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                启动
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shadow-md hover:shadow-lg transition-shadow"
                            onClick={() => handleRunTask(task.id)}
                            disabled={isLoading}
                          >
                            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                            立即执行
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
