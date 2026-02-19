/**
 * 统一任务调度系统
 *
 * 功能：
 * 1. 策略筛选任务（5日趋势、5日容量、龙头精选）
 * 2. 大牛股复盘任务
 * 3. 跟踪初始化任务
 * 4. T+1观察任务
 * 5. T+3观察任务
 * 6. 跟踪验证任务
 * 7. 经验生成任务
 */

import cron from 'node-cron';
import { executeAllStrategies } from '@/lib/strategy-executor';
import { executeBullAnalysis } from '@/lib/bull-auto-analysis';
import { initializeTrackingTasks } from '@/lib/tracking-tasks';
import { generateBatchExperiences } from '@/lib/experience-generator';

// 任务状态
const taskStatus = new Map<string, {
  lastRun: Date | null;
  lastSuccess: boolean;
  lastError: string | null;
}>();

/**
 * 任务类型定义
 */
export enum AutoTaskType {
  // 策略筛选任务
  STRATEGY_MORNING_1 = 'STRATEGY_MORNING_1', // 9:35
  STRATEGY_MORNING_2 = 'STRATEGY_MORNING_2', // 10:35
  STRATEGY_MORNING_3 = 'STRATEGY_MORNING_3', // 11:35
  STRATEGY_AFTERNOON_1 = 'STRATEGY_AFTERNOON_1', // 13:35
  STRATEGY_AFTERNOON_2 = 'STRATEGY_AFTERNOON_2', // 14:35

  // 大牛股复盘任务
  BULL_ANALYSIS_MORNING = 'BULL_ANALYSIS_MORNING', // 10:00
  BULL_ANALYSIS_AFTERNOON = 'BULL_ANALYSIS_AFTERNOON', // 14:00

  // 同花顺策略学习任务
  TONGHUASHUN_LEARN_5DAY_TREND = 'TONGHUASHUN_LEARN_5DAY_TREND', // 15:40 - 学习5日趋势策略
  TONGHUASHUN_LEARN_5DAY_VOLUME = 'TONGHUASHUN_LEARN_5DAY_VOLUME', // 15:41 - 学习5日容量策略

  // 跟踪初始化任务（已实现）
  TRACKING_INIT = 'TRACKING_INIT', // 9:30

  // T+1观察任务（已实现）
  T1_OBSERVATION = 'T1_OBSERVATION', // 9:35

  // T+3观察任务（已实现）
  T3_OBSERVATION = 'T3_OBSERVATION', // 9:35

  // 跟踪验证任务（已实现）
  TRACKING_VERIFY = 'TRACKING_VERIFY', // 15:30

  // 经验生成任务
  EXPERIENCE_GENERATE = 'EXPERIENCE_GENERATE', // 15:35
}

/**
 * 任务配置
 */
const taskConfigs: Record<AutoTaskType, {
  cron: string;
  name: string;
  description: string;
  handler: () => Promise<any>;
}> = {
  // 策略筛选任务
  [AutoTaskType.STRATEGY_MORNING_1]: {
    cron: '35 9 * * 1-5',
    name: '早盘策略筛选',
    description: '9:35 执行所有策略筛选',
    handler: executeAllStrategies,
  },
  [AutoTaskType.STRATEGY_MORNING_2]: {
    cron: '35 10 * * 1-5',
    name: '早盘二次筛选',
    description: '10:35 执行所有策略筛选',
    handler: executeAllStrategies,
  },
  [AutoTaskType.STRATEGY_MORNING_3]: {
    cron: '35 11 * * 1-5',
    name: '早盘三次筛选',
    description: '11:35 执行所有策略筛选',
    handler: executeAllStrategies,
  },
  [AutoTaskType.STRATEGY_AFTERNOON_1]: {
    cron: '35 13 * * 1-5',
    name: '午盘策略筛选',
    description: '13:35 执行所有策略筛选',
    handler: executeAllStrategies,
  },
  [AutoTaskType.STRATEGY_AFTERNOON_2]: {
    cron: '35 14 * * 1-5',
    name: '尾盘策略筛选',
    description: '14:35 执行所有策略筛选',
    handler: executeAllStrategies,
  },

  // 大牛股复盘任务
  [AutoTaskType.BULL_ANALYSIS_MORNING]: {
    cron: '0 10 * * 1-5',
    name: '早盘大牛股复盘',
    description: '10:00 执行大牛股复盘分析',
    handler: executeBullAnalysis,
  },
  [AutoTaskType.BULL_ANALYSIS_AFTERNOON]: {
    cron: '0 14 * * 1-5',
    name: '午盘大牛股复盘',
    description: '14:00 执行大牛股复盘分析',
    handler: executeBullAnalysis,
  },

  // 跟踪初始化任务
  [AutoTaskType.TRACKING_INIT]: {
    cron: '30 9 * * 1-5',
    name: '跟踪初始化',
    description: '9:30 初始化跟踪任务',
    handler: initializeTrackingTasks,
  },

  // T+1观察任务
  [AutoTaskType.T1_OBSERVATION]: {
    cron: '35 9 * * 1-5',
    name: 'T+1观察',
    description: '9:35 执行T+1观察',
    handler: () => executeObservationTask('T1'),
  },

  // T+3观察任务
  [AutoTaskType.T3_OBSERVATION]: {
    cron: '35 9 * * 1-5',
    name: 'T+3观察',
    description: '9:35 执行T+3观察',
    handler: () => executeObservationTask('T3'),
  },

  // 跟踪验证任务
  [AutoTaskType.TRACKING_VERIFY]: {
    cron: '30 15 * * 1-5',
    name: '跟踪验证',
    description: '15:30 执行跟踪验证',
    handler: () => executeVerificationTask(),
  },

  // 经验生成任务
  [AutoTaskType.EXPERIENCE_GENERATE]: {
    cron: '35 15 * * 1-5',
    name: '经验生成',
    description: '15:35 批量生成经验',
    handler: generateBatchExperiences,
  },

  // 同花顺策略学习任务
  [AutoTaskType.TONGHUASHUN_LEARN_5DAY_TREND]: {
    cron: '40 15 * * 1-5',
    name: '同花顺5日趋势学习',
    description: '15:40 学习同花顺5日趋势策略',
    handler: () => executeTonghuashunLearning('5day-trend'),
  },
  [AutoTaskType.TONGHUASHUN_LEARN_5DAY_VOLUME]: {
    cron: '41 15 * * 1-5',
    name: '同花顺5日容量学习',
    description: '15:41 学习同花顺5日容量策略',
    handler: () => executeTonghuashunLearning('5day-volume'),
  },
};

/**
 * 执行观察任务（T+1/T+3）
 */
async function executeObservationTask(type: 'T1' | 'T3'): Promise<any> {
  console.log(`📊 执行${type}观察任务`);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  try {
    const response = await fetch(`${baseUrl}/api/tracking/observation?type=${type}`);
    const result = await response.json();

    if (result.success) {
      console.log(`  ✓ ${type}观察完成，处理了 ${result.count} 条记录`);
      return {
        success: true,
        count: result.count,
      };
    } else {
      console.error(`  ✗ ${type}观察失败:`, result.error);
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error(`  ✗ ${type}观察失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '执行失败',
    };
  }
}

/**
 * 执行验证任务
 */
async function executeVerificationTask(): Promise<any> {
  console.log('✅ 执行跟踪验证任务');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  try {
    const response = await fetch(`${baseUrl}/api/tracking/verify`);
    const result = await response.json();

    if (result.success) {
      console.log(`  ✓ 验证完成，标记了 ${result.count} 条记录`);
      return {
        success: true,
        count: result.count,
      };
    } else {
      console.error(`  ✗ 验证失败:`, result.error);
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error(`  ✗ 验证失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '执行失败',
    };
  }
}

/**
 * 执行同花顺策略学习任务
 */
async function executeTonghuashunLearning(strategyType: '5day-trend' | '5day-volume'): Promise<any> {
  const strategyName = strategyType === '5day-trend' ? '5日趋势' : '5日容量';
  console.log(`🎓 执行同花顺${strategyName}策略学习`);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  try {
    const response = await fetch(`${baseUrl}/api/tonghuashun/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ strategyType }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`  ✓ 学习完成，分析了 ${result.data.analyzedCount} 只股票`);
      console.log(`  - 学习评分: ${result.data.learningScore}分`);
      console.log(`  - 共同特征: ${result.data.features.commonFeatures.join(', ') || '无'}`);
      console.log(`  - 优化建议: ${result.data.recommendations.length} 条`);
      return {
        success: true,
        analyzedCount: result.data.analyzedCount,
        learningScore: result.data.learningScore,
      };
    } else {
      console.error(`  ✗ 学习失败:`, result.error);
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error(`  ✗ 学习失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '执行失败',
    };
  }
}

// 存储所有定时任务
const scheduledTasks = new Map<AutoTaskType, cron.ScheduledTask>();

/**
 * 初始化所有自动任务
 */
export function initializeAllAutoTasks(): void {
  console.log('🚀 初始化自动任务系统\n');

  Object.entries(taskConfigs).forEach(([taskType, config]) => {
    const type = taskType as AutoTaskType;

    console.log(`⏰ 注册任务: ${config.name} (${config.cron})`);

    try {
      const task = cron.schedule(config.cron, async () => {
        await runTask(type);
      }, {
        scheduled: false, // 等待手动启动
        timezone: 'Asia/Shanghai',
      });

      scheduledTasks.set(type, task);

      // 初始化任务状态
      taskStatus.set(type, {
        lastRun: null,
        lastSuccess: false,
        lastError: null,
      });
    } catch (error) {
      console.error(`  ✗ 任务注册失败: ${config.name}`, error);
    }
  });

  console.log(`\n✓ 共注册 ${scheduledTasks.size} 个自动任务\n`);
}

/**
 * 启动所有自动任务
 */
export function startAllAutoTasks(): void {
  console.log('▶️ 启动所有自动任务\n');

  scheduledTasks.forEach((task, type) => {
    try {
      task.start();
      console.log(`  ✓ 已启动: ${taskConfigs[type].name}`);
    } catch (error) {
      console.error(`  ✗ 启动失败: ${taskConfigs[type].name}`, error);
    }
  });

  console.log();
}

/**
 * 停止所有自动任务
 */
export function stopAllAutoTasks(): void {
  console.log('⏸️ 停止所有自动任务\n');

  scheduledTasks.forEach((task, type) => {
    try {
      task.stop();
      console.log(`  ✓ 已停止: ${taskConfigs[type].name}`);
    } catch (error) {
      console.error(`  ✗ 停止失败: ${taskConfigs[type].name}`, error);
    }
  });

  console.log();
}

/**
 * 运行指定任务
 */
export async function runTask(taskType: AutoTaskType): Promise<void> {
  const config = taskConfigs[taskType];
  const status = taskStatus.get(taskType)!;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`⏰ [${new Date().toLocaleString('zh-CN')}] 执行任务: ${config.name}`);
  console.log(`${'='.repeat(60)}`);

  status.lastRun = new Date();

  try {
    const result = await config.handler();

    status.lastSuccess = result.success || false;
    status.lastError = result.success ? null : (result.error || '未知错误');

    if (result.success) {
      console.log(`\n✅ 任务执行成功: ${config.name}`);
    } else {
      console.error(`\n❌ 任务执行失败: ${config.name}`, status.lastError);
    }
  } catch (error) {
    status.lastSuccess = false;
    status.lastError = error instanceof Error ? error.message : '未知错误';
    console.error(`\n❌ 任务执行失败: ${config.name}`, error);
  }

  console.log(`${'='.repeat(60)}\n`);
}

/**
 * 获取所有任务状态
 */
export function getAllTaskStatus(): Record<string, any> {
  const result: Record<string, any> = {};

  scheduledTasks.forEach((_, type) => {
    const config = taskConfigs[type];
    const status = taskStatus.get(type)!;

    result[type] = {
      name: config.name,
      cron: config.cron,
      description: config.description,
      status: status,
    };
  });

  return result;
}

/**
 * 手动触发指定任务
 */
export async function triggerTask(taskType: AutoTaskType): Promise<any> {
  console.log(`🎯 手动触发任务: ${taskConfigs[taskType].name}`);

  await runTask(taskType);

  return taskStatus.get(taskType);
}
