/**
 * 龙头个股跟踪系统
 * 
 * 功能：
 * 1. 记录筛选出的龙头个股
 * 2. 跟踪T+1、T+3日的涨跌情况
 * 3. 评估是否达到预期
 * 4. 总结成功经验和复盘失败案例
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 筛选记录
 */
export interface TrackingRecord {
  id: number;
  stockCode: string;
  stockName: string;
  strategy: string;
  bullScore: number;
  potentialLevel: string;
  price: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  turnoverRate?: number;
  pe?: number;
  pb?: number;
  bullFeatures?: any;
  recommendedStrategies?: any;
  trackingStatus: string;
  expectedGain: number;
  t1Gain?: number;
  t3Gain?: number;
  maxGain?: number;
  result?: string;
  screenedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 观察记录
 */
export interface Observation {
  id: number;
  trackingRecordId: number;
  observationDay: number; // T+1, T+3
  price: number;
  changePercent: number;
  volume: number;
  turnoverRate?: number;
  limitUp?: boolean;
  limitDown?: boolean;
  notes?: string;
  observedAt: string;
  createdAt: string;
}

/**
 * 保存筛选记录
 */
export async function saveTrackingRecord(stock: any): Promise<number> {
  const client = getSupabaseClient();

  const record = {
    stock_code: stock.code,
    stock_name: stock.name,
    strategy: stock.strategy || 'leader',
    bull_score: stock.bullScore || 0,
    potential_level: stock.bullPotential || 'medium',
    price: stock.price,
    change_percent: stock.changePercent,
    volume: stock.volume,
    market_cap: stock.marketCap,
    turnover_rate: stock.turnoverRate,
    pe: stock.pe,
    pb: stock.pb,
    bull_features: stock.bullFeatures,
    recommended_strategies: stock.recommendedStrategies,
    tracking_status: 'pending',
    expected_gain: 10, // 默认预期涨幅10%
    screened_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('stock_tracking_records')
    .insert(record)
    .select('id')
    .single();

  if (error) {
    console.error('保存筛选记录失败:', error);
    throw error;
  }

  console.log(`✓ 保存筛选记录: ${stock.code} - ${stock.name} (ID: ${data.id})`);
  return data.id;
}

/**
 * 批量保存筛选记录
 */
export async function saveTrackingRecordsBatch(stocks: any[]): Promise<number[]> {
  const recordIds: number[] = [];

  for (const stock of stocks) {
    try {
      const id = await saveTrackingRecord(stock);
      recordIds.push(id);
    } catch (error) {
      console.error(`保存筛选记录失败: ${stock.code}`, error);
    }
  }

  return recordIds;
}

/**
 * 获取需要跟踪的记录
 */
export async function getPendingTrackingRecords(limit: number = 50): Promise<TrackingRecord[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('stock_tracking_records')
    .select('*')
    .eq('tracking_status', 'pending')
    .order('screened_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('获取待跟踪记录失败:', error);
    throw error;
  }

  return data || [];
}

/**
 * 获取需要观察的记录（T+1、T+3）
 */
export async function getRecordsForObservation(
  day: number, // 1 for T+1, 3 for T+3
  limit: number = 50
): Promise<TrackingRecord[]> {
  const client = getSupabaseClient();

  // 计算目标日期
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - day);

  // 获取筛选日期是目标日期的记录
  const { data, error } = await client
    .from('stock_tracking_records')
    .select('*')
    .eq('tracking_status', 'tracking')
    .gte('screened_at', new Date(targetDate.setHours(0, 0, 0, 0)).toISOString())
    .lt('screened_at', new Date(targetDate.setHours(23, 59, 59, 999)).toISOString())
    .limit(limit);

  if (error) {
    console.error('获取待观察记录失败:', error);
    throw error;
  }

  return data || [];
}

/**
 * 保存观察记录
 */
export async function saveObservation(
  trackingRecordId: number,
  day: number,
  currentPrice: number,
  changePercent: number,
  volume: number,
  turnoverRate?: number,
  isLimitUp: boolean = false,
  isLimitDown: boolean = false
): Promise<number> {
  const client = getSupabaseClient();

  const observation = {
    tracking_record_id: trackingRecordId,
    observation_day: day,
    price: currentPrice,
    change_percent: changePercent,
    volume: volume,
    turnover_rate: turnoverRate,
    limit_up: isLimitUp,
    limit_down: isLimitDown,
    observed_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('tracking_observations')
    .insert(observation)
    .select('id')
    .single();

  if (error) {
    console.error('保存观察记录失败:', error);
    throw error;
  }

  console.log(`✓ 保存观察记录: T+${day}日, ID: ${data.id}`);
  return data.id;
}

/**
 * 更新跟踪记录
 */
export async function updateTrackingRecord(
  id: number,
  updates: Partial<TrackingRecord>
): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('stock_tracking_records')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('更新跟踪记录失败:', error);
    throw error;
  }

  console.log(`✓ 更新跟踪记录: ID ${id}`);
}

/**
 * 获取跟踪记录的观察数据
 */
export async function getObservations(trackingRecordId: number): Promise<Observation[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('tracking_observations')
    .select('*')
    .eq('tracking_record_id', trackingRecordId)
    .order('observation_day', { ascending: true });

  if (error) {
    console.error('获取观察记录失败:', error);
    throw error;
  }

  return data || [];
}

/**
 * 标记跟踪记录为跟踪中
 */
export async function markTracking(id: number): Promise<void> {
  await updateTrackingRecord(id, {
    trackingStatus: 'tracking',
  });
}

/**
 * 标记跟踪记录为完成
 */
export async function markCompleted(
  id: number,
  result: 'success' | 'failed',
  t1Gain: number,
  t3Gain: number,
  maxGain: number
): Promise<void> {
  await updateTrackingRecord(id, {
    trackingStatus: 'completed',
    result: result,
    t1Gain: t1Gain,
    t3Gain: t3Gain,
    maxGain: maxGain,
    completedAt: new Date().toISOString(),
  });
}

/**
 * 标记跟踪记录为失败
 */
export async function markFailed(id: number, reason: string): Promise<void> {
  await updateTrackingRecord(id, {
    trackingStatus: 'failed',
  });
}

/**
 * 获取所有跟踪记录
 */
export async function getAllTrackingRecords(
  status?: string,
  result?: string,
  limit: number = 50
): Promise<TrackingRecord[]> {
  const client = getSupabaseClient();

  let query = client
    .from('stock_tracking_records')
    .select('*')
    .order('screened_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('tracking_status', status);
  }

  if (result) {
    query = query.eq('result', result);
  }

  const { data, error } = await query;

  if (error) {
    console.error('获取跟踪记录失败:', error);
    throw error;
  }

  return data || [];
}

/**
 * 获取统计信息
 */
export async function getTrackingStatistics() {
  const client = getSupabaseClient();

  const [
    { count: total },
    { count: pending },
    { count: tracking },
    { count: completed },
    { count: success },
    { count: failed },
  ] = await Promise.all([
    client.from('stock_tracking_records').select('*', { count: 'exact', head: true }),
    client.from('stock_tracking_records').select('*', { count: 'exact', head: true }).eq('tracking_status', 'pending'),
    client.from('stock_tracking_records').select('*', { count: 'exact', head: true }).eq('tracking_status', 'tracking'),
    client.from('stock_tracking_records').select('*', { count: 'exact', head: true }).eq('tracking_status', 'completed'),
    client.from('stock_tracking_records').select('*', { count: 'exact', head: true }).eq('result', 'success'),
    client.from('stock_tracking_records').select('*', { count: 'exact', head: true }).eq('result', 'failed'),
  ]);

  return {
    total: total || 0,
    pending: pending || 0,
    tracking: tracking || 0,
    completed: completed || 0,
    success: success || 0,
    failed: failed || 0,
  };
}
