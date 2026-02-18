/**
 * 自动任务调度系统
 * 
 * 功能：
 * 1. 在交易时间自动启动分析和筛选任务
 * 2. 管理任务执行记录
 * 3. 提供任务状态查询
 */

import cron, { ScheduledTask } from 'node-cron';
import { isTradingTime, getTradingStatus } from './trading-time';

/**
 * 任务类型
 */
export enum TaskType {
  STOCK_ANALYSIS = 'stock_analysis', // 股票分析任务
  BULL_STOCK_SCAN = 'bull_stock_scan', // 大牛股扫描任务
  STRATEGY_UPDATE = 'strategy_update', // 策略更新任务
}

/**
 * 任务状态
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * 任务执行记录
 */
export interface TaskExecution {
  id: string;
  type: TaskType;
  status: TaskStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  result?: any;
  error?: string;
  metadata?: {
    tradingSession?: string;
    stocksAnalyzed?: number;
    strategiesRun?: string[];
  };
}

/**
 * 调度器状态
 */
export interface SchedulerStatus {
  running: boolean;
  scheduledTasks: TaskType[];
  recentExecutions: number;
  isTradingTime: boolean;
}

/**
 * 任务调度器
 */
export class TaskScheduler {
  private tasks: Map<TaskType, ScheduledTask> = new Map();
  private executions: TaskExecution[] = [];
  private maxExecutions = 100; // 最多保留100条执行记录

  /**
   * 启动调度器
   */
  start(): void {
    console.log('🚀 任务调度器启动中...');

    // 每分钟检查一次是否需要执行任务
    this.schedule(TaskType.STOCK_ANALYSIS, '* * * * *', async () => {
      await this.executeIfNeeded(TaskType.STOCK_ANALYSIS);
    });

    // 每10分钟执行一次大牛股扫描
    this.schedule(TaskType.BULL_STOCK_SCAN, '*/10 * * * *', async () => {
      await this.executeIfNeeded(TaskType.BULL_STOCK_SCAN);
    });

    // 每30分钟执行一次策略更新
    this.schedule(TaskType.STOCK_ANALYSIS, '*/30 * * * *', async () => {
      await this.executeIfNeeded(TaskType.STRATEGY_UPDATE);
    });

    console.log('✅ 任务调度器已启动');
    console.log('📅 当前交易状态:', getTradingStatus().description);
  }

  /**
   * 停止调度器
   */
  stop(): void {
    console.log('🛑 停止任务调度器...');
    this.tasks.forEach((task, type) => {
      task.stop();
      this.tasks.delete(type);
      console.log(`  - 已停止任务: ${type}`);
    });
    console.log('✅ 任务调度器已停止');
  }

  /**
   * 调度任务
   */
  private schedule(type: TaskType, cronExpression: string, callback: () => Promise<void>): void {
    if (this.tasks.has(type)) {
      console.log(`⚠️ 任务 ${type} 已存在，先停止`);
      this.tasks.get(type)?.stop();
    }

    const task = cron.schedule(cronExpression, callback, {
      timezone: 'Asia/Shanghai',
    });

    this.tasks.set(type, task);
    console.log(`✓ 已调度任务: ${type} (${cronExpression})`);
  }

  /**
   * 如果在交易时间，执行任务
   */
  private async executeIfNeeded(type: TaskType): Promise<void> {
    // 检查是否在交易时间
    if (!isTradingTime()) {
      return;
    }

    // 检查是否已有任务在运行
    const running = this.executions.find(
      e => e.type === type && e.status === TaskStatus.RUNNING
    );
    if (running) {
      console.log(`⚠️ 任务 ${type} 正在运行中，跳过本次执行`);
      return;
    }

    // 执行任务
    await this.executeTask(type);
  }

  /**
   * 执行任务（公共方法，支持手动触发）
   */
  public async executeTask(type: TaskType): Promise<void> {
    const execution: TaskExecution = {
      id: this.generateId(),
      type,
      status: TaskStatus.RUNNING,
      startTime: new Date(),
      metadata: {
        tradingSession: getTradingStatus().currentSession?.name,
      },
    };

    this.executions.push(execution);
    console.log(`\n📊 开始执行任务: ${type} (${execution.id})`);

    try {
      let result: any;

      switch (type) {
        case TaskType.STOCK_ANALYSIS:
          result = await this.executeStockAnalysis();
          break;
        case TaskType.BULL_STOCK_SCAN:
          result = await this.executeBullStockScan();
          break;
        case TaskType.STRATEGY_UPDATE:
          result = await this.executeStrategyUpdate();
          break;
      }

      // 更新执行记录
      execution.status = TaskStatus.COMPLETED;
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      execution.result = result;

      console.log(`✅ 任务执行完成: ${type}`);
      console.log(`   耗时: ${execution.duration}ms`);
      if (result) {
        console.log(`   结果:`, result);
      }
    } catch (error) {
      execution.status = TaskStatus.FAILED;
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      execution.error = error instanceof Error ? error.message : String(error);

      console.error(`❌ 任务执行失败: ${type}`);
      console.error(`   错误:`, execution.error);
    }

    // 清理旧记录
    this.cleanupOldExecutions();
  }

  /**
   * 执行股票分析任务
   */
  private async executeStockAnalysis(): Promise<any> {
    console.log('  → 执行股票分析任务');

    // 调用股票分析API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/stocks/real?strategy=5day-trend`);
    const result = await response.json();

    return {
      success: result.success,
      stockCount: result.count,
      strategy: result.strategy,
    };
  }

  /**
   * 执行大牛股扫描任务
   */
  private async executeBullStockScan(): Promise<any> {
    console.log('  → 执行大牛股扫描任务');

    // 调用大牛股分析API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/bull-analysis?minScore=40&limit=20`);
    const result = await response.json();

    return {
      success: result.success,
      bullStockCount: result.count,
      statistics: result.statistics,
    };
  }

  /**
   * 执行策略更新任务
   */
  private async executeStrategyUpdate(): Promise<any> {
    console.log('  → 执行策略更新任务');

    // 更新所有三个策略
    const strategies = ['5day-trend', '5day-volume', 'leader'];
    const results = [];

    for (const strategy of strategies) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/stocks/real?strategy=${strategy}`);
      const result = await response.json();
      results.push({
        strategy,
        count: result.count,
      });
    }

    return {
      strategies: results,
      totalStocks: results.reduce((sum, r) => sum + r.count, 0),
    };
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理旧记录
   */
  private cleanupOldExecutions(): void {
    if (this.executions.length > this.maxExecutions) {
      const removed = this.executions.splice(0, this.executions.length - this.maxExecutions);
      console.log(`🧹 清理了 ${removed.length} 条旧执行记录`);
    }
  }

  /**
   * 获取所有任务执行记录
   */
  getExecutions(limit: number = 20): TaskExecution[] {
    return this.executions.slice(-limit).reverse();
  }

  /**
   * 获取指定类型的执行记录
   */
  getExecutionsByType(type: TaskType, limit: number = 10): TaskExecution[] {
    return this.executions
      .filter(e => e.type === type)
      .slice(-limit)
      .reverse();
  }

  /**
   * 手动执行任务
   */
  async executeManually(taskType: TaskType): Promise<void> {
    console.log(`[${new Date().toISOString()}] 手动触发任务: ${taskType}`);
    await this.executeTask(taskType);
  }

  /**
   * 获取调度器状态
   */
  getStatus(): SchedulerStatus {
    return {
      running: this.tasks.size > 0,
      scheduledTasks: Array.from(this.tasks.keys()),
      recentExecutions: this.executions.length,
      isTradingTime: isTradingTime(),
    };
  }
}

// 全局调度器实例
let scheduler: TaskScheduler | null = null;

/**
 * 获取调度器实例
 */
export function getScheduler(): TaskScheduler {
  if (!scheduler) {
    scheduler = new TaskScheduler();
  }
  return scheduler;
}

/**
 * 启动调度器
 */
export function startScheduler(): void {
  const s = getScheduler();
  s.start();
}

/**
 * 停止调度器
 */
export function stopScheduler(): void {
  if (scheduler) {
    scheduler.stop();
    scheduler = null;
  }
}
