/**
 * 结果评估和经验总结系统
 * 
 * 功能：
 * 1. 评估跟踪结果是否达到预期
 * 2. 自动总结成功案例特征
 * 3. 自动分析失败案例原因
 * 4. 生成经验库供后续参考
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import { type TrackingRecord } from './stock-tracking';

/**
 * 成功经验总结
 */
export interface ExperienceSummary {
  id: number;
  trackingRecordId: number;
  summary: string;
  keyFeatures: string[];
  t1Gain?: number;
  t3Gain?: number;
  maxGain?: number;
  attribution: {
    trend?: number; // 趋势贡献
    volume?: number; // 成交量贡献
    technical?: number; // 技术指标贡献
    pattern?: number; // 形态贡献
  };
  tags: string[];
  isVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 失败复盘
 */
export interface FailureReflection {
  id: number;
  trackingRecordId: number;
  reflection: string;
  failureReason: {
    type: string; // 失败类型
    description: string; // 描述
    factors: string[]; // 影响因素
  };
  t1Gain?: number;
  t3Gain?: number;
  maxGain?: number;
  issues: string[];
  suggestions: string[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * 评估结果并生成经验总结
 */
export async function evaluateAndSummarize(trackingRecord: TrackingRecord): Promise<void> {
  if (trackingRecord.result !== 'success') {
    // 失败案例，生成复盘
    await generateFailureReflection(trackingRecord);
  } else {
    // 成功案例，生成经验总结
    await generateExperienceSummary(trackingRecord);
  }
}

/**
 * 生成成功经验总结
 */
async function generateExperienceSummary(record: TrackingRecord): Promise<void> {
  const client = getSupabaseClient();

  // 1. 提取关键特征
  const keyFeatures = extractKeyFeatures(record);

  // 2. 生成总结文本
  const summary = generateSuccessSummary(record, keyFeatures);

  // 3. 归因分析
  const attribution = analyzeSuccessAttribution(record);

  // 4. 生成标签
  const tags = generateSuccessTags(record, keyFeatures);

  const experience = {
    tracking_record_id: record.id,
    summary: summary,
    key_features: keyFeatures,
    t1_gain: record.t1Gain,
    t3_gain: record.t3Gain,
    max_gain: record.maxGain,
    attribution: attribution,
    tags: tags,
    is_verified: false, // 待人工验证
  };

  const { data, error } = await client
    .from('experience_summaries')
    .insert(experience)
    .select('id')
    .single();

  if (error) {
    console.error('生成经验总结失败:', error);
    throw error;
  }

  console.log(`✓ 生成成功经验总结: ${record.stockCode} (ID: ${data.id})`);
}

/**
 * 生成失败复盘
 */
async function generateFailureReflection(record: TrackingRecord): Promise<void> {
  const client = getSupabaseClient();

  // 1. 分析失败原因
  const failureReason = analyzeFailureReason(record);

  // 2. 识别问题
  const issues = identifyIssues(record);

  // 3. 提供改进建议
  const suggestions = generateSuggestions(record, failureReason, issues);

  // 4. 生成复盘文本
  const reflection = generateFailureReflectionText(record, failureReason, issues, suggestions);

  const reflectionData = {
    tracking_record_id: record.id,
    reflection: reflection,
    failure_reason: failureReason,
    t1_gain: record.t1Gain,
    t3_gain: record.t3Gain,
    max_gain: record.maxGain,
    issues: issues,
    suggestions: suggestions,
  };

  const { data, error } = await client
    .from('failure_reflections')
    .insert(reflectionData)
    .select('id')
    .single();

  if (error) {
    console.error('生成失败复盘失败:', error);
    throw error;
  }

  console.log(`✓ 生成失败复盘: ${record.stockCode} (ID: ${data.id})`);
}

/**
 * 提取关键特征
 */
function extractKeyFeatures(record: TrackingRecord): string[] {
  const features: string[] = [];
  const bullFeatures = record.bullFeatures || {};

  // 趋势特征
  if (bullFeatures.trendFeatures?.consecutiveRises >= 3) {
    features.push(`连续${bullFeatures.trendFeatures.consecutiveRises}天上涨`);
  }
  if (bullFeatures.trendFeatures?.breakHigh) {
    features.push('突破前高');
  }
  if (bullFeatures.trendFeatures?.aboveMA) {
    features.push('站上均线');
  }
  if (bullFeatures.trendFeatures?.price5DayChange >= 10) {
    features.push('5日涨幅超过10%');
  }

  // 成交量特征
  if (bullFeatures.volumeFeatures?.volumeRatio >= 2) {
    features.push('量比大于2');
  }
  if (bullFeatures.volumeFeatures?.highVolume) {
    features.push('放量');
  }

  // 技术指标特征
  if (bullFeatures.technicalFeatures?.macdGoldenCross) {
    features.push('MACD金叉');
  }
  if (bullFeatures.technicalFeatures?.kdjGoldenCross) {
    features.push('KDJ金叉');
  }

  // 形态特征
  if (bullFeatures.patternFeatures?.hasLimitUp) {
    features.push('有涨停');
  }
  if (bullFeatures.patternFeatures?.limitUpCount > 0) {
    features.push(`近期涨停${bullFeatures.patternFeatures.limitUpCount}次`);
  }
  if (bullFeatures.patternFeatures?.bullishAlignment) {
    features.push('多头排列');
  }

  // 基本面特征
  if (record.turnoverRate && record.turnoverRate > 10) {
    features.push(`换手率${record.turnoverRate.toFixed(1)}%`);
  }
  if (record.pe && record.pe < 30) {
    features.push('低市盈率');
  }

  return features.slice(0, 8); // 最多8个特征
}

/**
 * 生成成功总结文本
 */
function generateSuccessSummary(record: TrackingRecord, keyFeatures: string[]): string {
  const t1Gain = record.t1Gain || 0;
  const t3Gain = record.t3Gain || 0;
  const maxGain = record.maxGain || 0;

  return `${record.stockName}(${record.stockCode})成功验证。T+1日涨幅${t1Gain.toFixed(2)}%，T+3日涨幅${t3Gain.toFixed(2)}%，最大涨幅${maxGain.toFixed(2)}%。核心特征：${keyFeatures.join('、')}。`;
}

/**
 * 归因分析
 */
function analyzeSuccessAttribution(record: TrackingRecord): any {
  const bullFeatures = record.bullFeatures || {};
  const attribution: any = {};

  // 简化的归因逻辑
  let totalScore = 0;

  // 趋势贡献
  if (bullFeatures.trendFeatures?.consecutiveRises >= 3) {
    attribution.trend = 0.3;
    totalScore += 0.3;
  }
  if (bullFeatures.trendFeatures?.breakHigh) {
    attribution.trend = (attribution.trend || 0) + 0.2;
    totalScore += 0.2;
  }

  // 成交量贡献
  if (bullFeatures.volumeFeatures?.volumeRatio >= 2) {
    attribution.volume = 0.25;
    totalScore += 0.25;
  }

  // 技术指标贡献
  if (bullFeatures.technicalFeatures?.macdGoldenCross) {
    attribution.technical = 0.2;
    totalScore += 0.2;
  }

  // 形态贡献
  if (bullFeatures.patternFeatures?.hasLimitUp) {
    attribution.pattern = 0.3;
    totalScore += 0.3;
  }

  // 归一化
  Object.keys(attribution).forEach(key => {
    attribution[key] = Math.round(attribution[key] / totalScore * 100);
  });

  return attribution;
}

/**
 * 生成成功标签
 */
function generateSuccessTags(record: TrackingRecord, keyFeatures: string[]): string[] {
  const tags: string[] = [];

  const t3Gain = record.t3Gain || 0;
  if (t3Gain >= 20) {
    tags.push('大涨');
  } else if (t3Gain >= 10) {
    tags.push('中涨');
  }

  if (record.potentialLevel === 'high') {
    tags.push('高潜力');
  }

  if (keyFeatures.some(f => f.includes('涨停'))) {
    tags.push('涨停启动');
  }

  if (keyFeatures.some(f => f.includes('MACD') || f.includes('KDJ'))) {
    tags.push('技术突破');
  }

  if (keyFeatures.some(f => f.includes('放量'))) {
    tags.push('量价配合');
  }

  return tags;
}

/**
 * 分析失败原因
 */
function analyzeFailureReason(record: TrackingRecord): any {
  const bullFeatures = record.bullFeatures || {};
  const t3Gain = record.t3Gain || 0;
  const maxGain = record.maxGain || 0;

  const reason: any = {
    type: '未达预期',
    description: `T+3日涨幅${t3Gain.toFixed(2)}%，未达到预期涨幅${record.expectedGain}%`,
    factors: [],
  };

  // 分析具体原因
  if (maxGain < 5) {
    reason.type = '缺乏动能';
    reason.description = '最大涨幅不足5%，缺乏上涨动能';
    reason.factors.push('量能不足');
  }

  if (!bullFeatures.trendFeatures?.consecutiveRises || bullFeatures.trendFeatures.consecutiveRises < 2) {
    reason.factors.push('趋势不明确');
  }

  if (!bullFeatures.volumeFeatures?.volumeRatio || bullFeatures.volumeFeatures.volumeRatio < 1.5) {
    reason.factors.push('成交量不足');
  }

  if (!bullFeatures.technicalFeatures?.macdGoldenCross && !bullFeatures.technicalFeatures?.kdjGoldenCross) {
    reason.factors.push('技术信号不明确');
  }

  if (t3Gain < 0) {
    reason.type = '下跌';
    reason.description = `T+3日下跌${Math.abs(t3Gain).toFixed(2)}%，未能上涨`;
    reason.factors.push('整体走弱');
  }

  return reason;
}

/**
 * 识别问题
 */
function identifyIssues(record: TrackingRecord): string[] {
  const issues: string[] = [];
  const bullFeatures = record.bullFeatures || {};

  if (!bullFeatures.trendFeatures?.breakHigh) {
    issues.push('未突破关键阻力位');
  }

  if (!bullFeatures.volumeFeatures?.highVolume) {
    issues.push('成交量未明显放大');
  }

  if (record.turnoverRate && record.turnoverRate < 3) {
    issues.push('换手率过低，市场关注不足');
  }

  if (bullFeatures.trendFeatures?.price5DayChange && bullFeatures.trendFeatures.price5DayChange > 15) {
    issues.push('短期涨幅过大，有回调风险');
  }

  return issues;
}

/**
 * 生成改进建议
 */
function generateSuggestions(record: TrackingRecord, failureReason: any, issues: string[]): string[] {
  const suggestions: string[] = [];

  if (failureReason.factors.includes('量能不足')) {
    suggestions.push('提高成交量筛选标准，要求量比大于2');
  }

  if (failureReason.factors.includes('趋势不明确')) {
    suggestions.push('增加连续上涨天数要求，至少3天');
  }

  if (failureReason.factors.includes('技术信号不明确')) {
    suggestions.push('增加技术指标筛选条件，要求MACD或KDJ金叉');
  }

  if (issues.some(i => i.includes('换手率过低'))) {
    suggestions.push('提高换手率要求，至少5%');
  }

  if (issues.some(i => i.includes('短期涨幅过大'))) {
    suggestions.push('设置短期涨幅上限，避免追高');
    suggestions.push('增加回调确认，等待回调后再入场');
  }

  return suggestions;
}

/**
 * 生成失败复盘文本
 */
function generateFailureReflectionText(
  record: TrackingRecord,
  failureReason: any,
  issues: string[],
  suggestions: string[]
): string {
  const t1Gain = record.t1Gain || 0;
  const t3Gain = record.t3Gain || 0;

  return `${record.stockName}(${record.stockCode})验证失败。T+1日涨幅${t1Gain.toFixed(2)}%，T+3日涨幅${t3Gain.toFixed(2)}%。
失败原因：${failureReason.description}。
主要问题：${issues.join('、')}。
改进建议：${suggestions.join('、')}。`;
}

/**
 * 获取所有成功经验
 */
export async function getExperienceSummaries(
  verified: boolean = false,
  limit: number = 50
): Promise<ExperienceSummary[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('experience_summaries')
    .select('*')
    .eq('is_verified', verified)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('获取成功经验失败:', error);
    throw error;
  }

  return data || [];
}

/**
 * 获取所有失败复盘
 */
export async function getFailureReflections(limit: number = 50): Promise<FailureReflection[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('failure_reflections')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('获取失败复盘失败:', error);
    throw error;
  }

  return data || [];
}

/**
 * 验证经验总结
 */
export async function verifyExperienceSummary(id: number): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('experience_summaries')
    .update({ is_verified: true })
    .eq('id', id);

  if (error) {
    console.error('验证经验总结失败:', error);
    throw error;
  }

  console.log(`✓ 经验总结已验证: ID ${id}`);
}

/**
 * 批量评估已完成跟踪的记录
 */
export async function batchEvaluateCompletedRecords(limit: number = 100): Promise<any> {
  const client = getSupabaseClient();

  // 获取已完成但未生成总结的记录
  const { data: records, error } = await client
    .from('stock_tracking_records')
    .select('*, experience_summaries(id), failure_reflections(id)')
    .eq('tracking_status', 'completed')
    .limit(limit);

  if (error) {
    console.error('获取已完成记录失败:', error);
    throw error;
  }

  if (!records) {
    return { processed: 0 };
  }

  // 过滤出已生成总结的记录
  const pendingRecords = records.filter(r => !r.experience_summaries?.[0] && !r.failure_reflections?.[0]);

  console.log(`找到 ${pendingRecords.length} 条待评估记录`);

  let successCount = 0;
  let failureCount = 0;

  for (const record of pendingRecords) {
    try {
      await evaluateAndSummarize(record);
      if (record.result === 'success') {
        successCount++;
      } else {
        failureCount++;
      }
    } catch (error) {
      console.error(`评估记录失败: ${record.stockCode}`, error);
    }
  }

  return {
    processed: pendingRecords.length,
    successCount,
    failureCount,
  };
}
