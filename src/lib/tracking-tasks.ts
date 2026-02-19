/**
 * 自动跟踪任务模块
 *
 * 功能：
 * 1. 每日检查需要跟踪的股票
 * 2. 获取T+1、T+3的实时数据
 * 3. 更新跟踪记录
 * 4. 评估是否达到预期
 */

import { getStockList, StockBasicInfo } from './stock-data';
import {
  getAllTrackingRecords,
  getPendingTrackingRecords,
  getRecordsForObservation,
  saveObservation,
  markTracking,
  markCompleted,
  markFailed,
  updateTrackingRecord,
  getObservations,
  type TrackingRecord,
} from './stock-tracking';

/**
 * 执行跟踪初始化任务
 * 将筛选出的龙头个股标记为跟踪状态
 */
export async function executeTrackingInitTask(): Promise<any> {
  console.log('📋 开始执行跟踪初始化任务');

  const pendingRecords = await getPendingTrackingRecords(100);
  console.log(`  → 找到 ${pendingRecords.length} 条待跟踪记录`);

  for (const record of pendingRecords) {
    try {
      await markTracking(record.id);
      console.log(`  ✓ 标记为跟踪中: ${record.stockCode} - ${record.stockName}`);
    } catch (error) {
      console.error(`  ✗ 标记失败: ${record.stockCode}`, error);
    }
  }

  return {
    success: true,
    processed: pendingRecords.length,
  };
}

/**
 * 执行T+1日观察任务
 */
export async function executeT1ObservationTask(): Promise<any> {
  console.log('📅 开始执行T+1日观察任务');

  // 获取需要T+1观察的记录
  const records = await getRecordsForObservation(1, 100);
  console.log(`  → 找到 ${records.length} 条需要T+1观察的记录`);

  let successCount = 0;
  let failCount = 0;

  for (const record of records) {
    try {
      // 获取实时数据
      const stockData = await getStockRealTimeData(record.stockCode);
      if (!stockData) {
        console.error(`  ✗ 获取实时数据失败: ${record.stockCode}`);
        failCount++;
        continue;
      }

      // 计算T+1日涨幅
      const t1Gain = ((stockData.f4 - record.price) / record.price) * 100;

      // 保存观察记录
      await saveObservation(
        record.id,
        1,
        stockData.f4,
        stockData.f3,
        stockData.f7 * 100,
        stockData.f18,
        checkLimitUp(stockData.f3),
        checkLimitDown(stockData.f3)
      );

      // 更新跟踪记录
      await updateTrackingRecord(record.id, {
        t1Gain: t1Gain,
      });

      console.log(`  ✓ T+1观察完成: ${record.stockCode} (${stockData.f4}, 涨幅: ${t1Gain.toFixed(2)}%)`);
      successCount++;
    } catch (error) {
      console.error(`  ✗ T+1观察失败: ${record.stockCode}`, error);
      failCount++;
    }
  }

  return {
    success: true,
    processed: records.length,
    successCount,
    failCount,
  };
}

/**
 * 执行T+3日观察任务
 */
export async function executeT3ObservationTask(): Promise<any> {
  console.log('📅 开始执行T+3日观察任务');

  // 获取需要T+3观察的记录
  const records = await getRecordsForObservation(3, 100);
  console.log(`  → 找到 ${records.length} 条需要T+3观察的记录`);

  let successCount = 0;
  let failCount = 0;

  for (const record of records) {
    try {
      // 获取实时数据
      const stockData = await getStockRealTimeData(record.stockCode);
      if (!stockData) {
        console.error(`  ✗ 获取实时数据失败: ${record.stockCode}`);
        failCount++;
        continue;
      }

      // 计算T+3日涨幅
      const t3Gain = ((stockData.f4 - record.price) / record.price) * 100;

      // 获取所有观察记录，计算最大涨幅
      const observations = await getObservations(record.id);
      const maxGain = Math.max(
        record.t1Gain || 0,
        ...observations.map(o => o.changePercent)
      );

      // 保存观察记录
      await saveObservation(
        record.id,
        3,
        stockData.f4,
        stockData.f3,
        stockData.f7 * 100,
        stockData.f18,
        checkLimitUp(stockData.f3),
        checkLimitDown(stockData.f3)
      );

      // 评估结果
      const result = evaluateResult(t3Gain, record.expectedGain || 10, maxGain);

      // 标记为完成
      await markCompleted(record.id, result, record.t1Gain || 0, t3Gain, maxGain);

      console.log(
        `  ✓ T+3观察完成: ${record.stockCode} (${stockData.f4}, ` +
        `T+1: ${(record.t1Gain || 0).toFixed(2)}%, ` +
        `T+3: ${t3Gain.toFixed(2)}%, ` +
        `最大: ${maxGain.toFixed(2)}%, ` +
        `结果: ${result})`
      );
      successCount++;
    } catch (error) {
      console.error(`  ✗ T+3观察失败: ${record.stockCode}`, error);
      failCount++;
    }
  }

  return {
    success: true,
    processed: records.length,
    successCount,
    failCount,
  };
}

/**
 * 执行跟踪验证任务
 * 检查所有跟踪中的记录，评估是否达到预期
 */
export async function executeTrackingValidationTask(): Promise<any> {
  console.log('🔍 开始执行跟踪验证任务');

  // 获取所有跟踪中的记录
  const trackingRecords = await getAllTrackingRecords('tracking');

  console.log(`  → 找到 ${trackingRecords.length} 条跟踪中的记录`);

  let completedCount = 0;
  let validatedCount = 0;

  for (const record of trackingRecords) {
    try {
      // 检查是否已完成跟踪（已有T+3观察记录）
      const observations = await getObservations(record.id);
      const hasT3 = observations.some(o => o.observationDay === 3);

      if (hasT3 && !record.completedAt) {
        // 已有T+3数据但未标记完成，补充完成
        const t3Observation = observations.find(o => o.observationDay === 3);
        const t3Gain = ((t3Observation!.price - record.price) / record.price) * 100;

        const allGains = [record.t1Gain || 0, ...observations.map(o => o.changePercent)];
        const maxGain = Math.max(...allGains);

        const result = evaluateResult(t3Gain, record.expectedGain || 10, maxGain);

        await markCompleted(record.id, result, record.t1Gain || 0, t3Gain, maxGain);
        completedCount++;

        console.log(`  ✓ 补充完成标记: ${record.stockCode} (${result})`);
      } else {
        validatedCount++;
      }
    } catch (error) {
      console.error(`  ✗ 验证失败: ${record.stockCode}`, error);
    }
  }

  return {
    success: true,
    completed: completedCount,
    validated: validatedCount,
  };
}

/**
 * 获取股票实时数据
 */
async function getStockRealTimeData(stockCode: string): Promise<StockBasicInfo | null> {
  try {
    const data = await getStockList();
    const stock = data.find((s: StockBasicInfo) => s.f12 === stockCode);
    return stock || null;
  } catch (error) {
    console.error('获取实时数据失败:', error);
    return null;
  }
}

/**
 * 检查是否涨停
 */
function checkLimitUp(changePercent: number): boolean {
  // 涨停约9.9%（考虑精度）
  return changePercent >= 9.8;
}

/**
 * 检查是否跌停
 */
function checkLimitDown(changePercent: number): boolean {
  // 跌停约-9.9%
  return changePercent <= -9.8;
}

/**
 * 评估结果
 * 判断是否达到预期
 */
function evaluateResult(
  t3Gain: number,
  expectedGain: number,
  maxGain: number
): 'success' | 'failed' {
  // T+3日涨幅达到预期
  if (t3Gain >= expectedGain) {
    return 'success';
  }

  // 最大涨幅达到预期的80%（放宽标准）
  if (maxGain >= expectedGain * 0.8) {
    return 'success';
  }

  // 否则失败
  return 'failed';
}

// 别名导出，兼容旧代码
export { executeTrackingInitTask as initializeTrackingTasks };

