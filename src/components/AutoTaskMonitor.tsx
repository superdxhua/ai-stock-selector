"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RotateCcw, Activity, CheckCircle, XCircle, Clock } from "lucide-react";

interface TaskStatus {
  name: string;
  cron: string;
  description: string;
  status: {
    lastRun: Date | null;
    lastSuccess: boolean;
    lastError: string | null;
  };
}

export default function AutoTaskMonitor() {
  const [tasks, setTasks] = useState<Record<string, TaskStatus>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  // 加载任务状态
  const loadTaskStatus = async () => {
    try {
      const response = await fetch("/api/auto-tasks?action=status");
      const result = await response.json();

      if (result.success) {
        setTasks(result.data);
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("加载任务状态失败:", error);
    }
  };

  // 初始化任务系统
  const initTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auto-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "init" }),
      });
      const result = await response.json();

      if (result.success) {
        await loadTaskStatus();
      }
    } catch (error) {
      console.error("初始化任务失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 启动所有任务
  const startTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auto-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "start" }),
      });
      const result = await response.json();

      if (result.success) {
        await loadTaskStatus();
      }
    } catch (error) {
      console.error("启动任务失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 停止所有任务
  const stopTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auto-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "stop" }),
      });
      const result = await response.json();

      if (result.success) {
        await loadTaskStatus();
      }
    } catch (error) {
      console.error("停止任务失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 手动触发任务
  const triggerTask = async (taskType: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auto-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "trigger", taskType }),
      });
      const result = await response.json();

      if (result.success) {
        await loadTaskStatus();
      }
    } catch (error) {
      console.error("触发任务失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadTaskStatus();

    // 每30秒刷新一次状态
    const interval = setInterval(() => {
      loadTaskStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // 分类任务
  const strategyTasks = Object.entries(tasks).filter(([key]) => key.startsWith("STRATEGY"));
  const bullAnalysisTasks = Object.entries(tasks).filter(([key]) => key.startsWith("BULL"));
  const trackingTasks = Object.entries(tasks).filter(([key]) =>
    key.startsWith("TRACKING") || key.startsWith("T1") || key.startsWith("T3")
  );
  const experienceTasks = Object.entries(tasks).filter(([key]) => key.startsWith("EXPERIENCE"));

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            自动任务控制中心
          </CardTitle>
          <CardDescription>
            管理所有自动执行的任务模块（策略、复盘、跟踪、经验）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {!isInitialized && (
              <Button onClick={initTasks} disabled={loading}>
                <RotateCcw className="w-4 h-4 mr-2" />
                初始化系统
              </Button>
            )}
            <Button onClick={startTasks} disabled={loading || !isInitialized} variant="default">
              <Play className="w-4 h-4 mr-2" />
              启动所有任务
            </Button>
            <Button onClick={stopTasks} disabled={loading || !isInitialized} variant="destructive">
              <Square className="w-4 h-4 mr-2" />
              停止所有任务
            </Button>
            <Button onClick={loadTaskStatus} disabled={loading} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              刷新状态
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 策略筛选任务 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 策略筛选任务</CardTitle>
          <CardDescription>自动执行5日趋势、5日容量、龙头精选策略</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {strategyTasks.map(([key, task]) => (
              <TaskItem key={key} taskType={key} task={task} onTrigger={() => triggerTask(key)} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 大牛股复盘任务 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📈 大牛股复盘任务</CardTitle>
          <CardDescription>自动执行大牛股潜力分析和特征提取</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bullAnalysisTasks.map(([key, task]) => (
              <TaskItem key={key} taskType={key} task={task} onTrigger={() => triggerTask(key)} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 跟踪观察任务 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">👁️ 跟踪观察任务</CardTitle>
          <CardDescription>自动执行跟踪初始化、T+1观察、T+3观察、跟踪验证</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trackingTasks.map(([key, task]) => (
              <TaskItem key={key} taskType={key} task={task} onTrigger={() => triggerTask(key)} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 经验生成任务 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 经验生成任务</CardTitle>
          <CardDescription>自动生成成功经验和失败复盘</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {experienceTasks.map(([key, task]) => (
              <TaskItem key={key} taskType={key} task={task} onTrigger={() => triggerTask(key)} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TaskItem({
  taskType,
  task,
  onTrigger,
}: {
  taskType: string;
  task: TaskStatus;
  onTrigger: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm">{task.name}</h4>
          <Badge variant="outline" className="text-xs">
            {task.cron}
          </Badge>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{task.description}</p>
        {task.status.lastRun && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400">
              上次运行: {new Date(task.status.lastRun).toLocaleString("zh-CN")}
            </span>
            {task.status.lastSuccess ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <XCircle className="w-3 h-3 text-red-500" />
            )}
          </div>
        )}
        {task.status.lastError && (
          <p className="mt-1 text-xs text-red-500">{task.status.lastError}</p>
        )}
      </div>
      <Button onClick={onTrigger} size="sm" variant="outline" className="ml-4">
        <Play className="w-3 h-3 mr-1" />
        立即执行
      </Button>
    </div>
  );
}
