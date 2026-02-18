/**
 * 大牛股特征集成模块
 * 
 * 将大牛股特征分析集成到现有的选股策略中
 */

import { KLineData, StockBasicInfo } from './stock-data';
import { TechnicalAnalysis, performTechnicalAnalysis } from './indicators';
import { extractBullStockFeatures, BullStockFeatures } from './feature-extractor';

/**
 * 增强的技术分析结果，包含大牛股评分
 */
export interface EnhancedTechnicalAnalysis extends TechnicalAnalysis {
  // 大牛股特征
  bullFeatures: BullStockFeatures;
  // 是否符合大牛股潜力
  isBullPotential: boolean;
  // 建议纳入的策略
  recommendedStrategies: ('5day-trend' | '5day-volume' | 'leader')[];
}

/**
 * 进行增强的技术分析（包含大牛股特征）
 */
export function performEnhancedTechnicalAnalysis(
  klines: KLineData[],
  stockData: StockBasicInfo
): EnhancedTechnicalAnalysis {
  // 执行基础技术分析
  const baseAnalysis = performTechnicalAnalysis(klines);

  // 提取大牛股特征
  const bullFeatures = extractBullStockFeatures(
    klines,
    stockData.f4, // 当前价格
    stockData.f20, // 市值
    stockData.f7 * 100, // 成交量（股）
    stockData.f18, // 换手率
    stockData.f22, // 市盈率
    stockData.f23 // 市净率
  );

  // 判断是否符合大牛股潜力
  const isBullPotential = checkBullPotential(bullFeatures);

  // 推荐纳入的策略
  const recommendedStrategies = recommendStrategies(bullFeatures, baseAnalysis);

  return {
    ...baseAnalysis,
    bullFeatures,
    bullScore: bullFeatures.bullScore,
    bullPotential: bullFeatures.potentialLevel,
    bullFeaturesList: bullFeatures.matchedFeatures,
    isBullPotential,
    recommendedStrategies,
  };
}

/**
 * 检查是否符合大牛股潜力
 */
function checkBullPotential(features: BullStockFeatures): boolean {
  // 必备条件
  if (features.bullScore < 40) return false;
  if (features.trendFeatures.consecutiveRises < 2) return false;
  if (features.trendFeatures.price5DayChange < 5) return false;
  if (features.volumeFeatures.volumeRatio < 1.2) return false;

  return true;
}

/**
 * 推荐纳入的策略
 */
function recommendStrategies(
  bullFeatures: BullStockFeatures,
  baseAnalysis: TechnicalAnalysis
): ('5day-trend' | '5day-volume' | 'leader')[] {
  const strategies: ('5day-trend' | '5day-volume' | 'leader')[] = [];

  // 根据大牛股评分决定是否推荐
  if (bullFeatures.bullScore >= 80) {
    // 高潜力股票，推荐所有策略
    strategies.push('5day-trend', '5day-volume', 'leader');
  } else if (bullFeatures.bullScore >= 60) {
    // 中等潜力股票，推荐趋势和容量策略
    if (baseAnalysis.trendScore >= 50) strategies.push('5day-trend');
    if (baseAnalysis.volumeScore >= 50) strategies.push('5day-volume');
  } else if (bullFeatures.bullScore >= 40) {
    // 低潜力股票，根据单项评分推荐
    if (baseAnalysis.trendScore >= 60) strategies.push('5day-trend');
    if (baseAnalysis.volumeScore >= 60) strategies.push('5day-volume');
  }

  // 如果是高潜力且具备龙头特征，推荐龙头策略
  if (bullFeatures.bullScore >= 70 &&
      (bullFeatures.patternFeatures.hasLimitUp || bullFeatures.patternFeatures.limitUpCount >= 2)) {
    strategies.push('leader');
  }

  return strategies;
}

/**
 * 策略评分增强
 * 根据大牛股特征调整策略评分
 */
export function enhanceStrategyScores(
  baseAnalysis: TechnicalAnalysis,
  bullFeatures: BullStockFeatures
): {
  trendScore: number;
  volumeScore: number;
  leaderScore: number;
} {
  let enhancedTrend = baseAnalysis.trendScore;
  let enhancedVolume = baseAnalysis.volumeScore;
  let enhancedLeader = baseAnalysis.leaderScore;

  // 根据大牛股评分进行调整
  const bullFactor = bullFeatures.bullScore / 100;

  // 趋势评分增强
  if (bullFeatures.trendFeatures.consecutiveRises >= 3) {
    enhancedTrend += 5;
  }
  if (bullFeatures.trendFeatures.breakHigh) {
    enhancedTrend += 5;
  }
  if (bullFeatures.technicalFeatures.macdGoldenCross) {
    enhancedTrend += 5;
  }

  // 容量评分增强
  if (bullFeatures.volumeFeatures.highVolume) {
    enhancedVolume += 5;
  }
  if (bullFeatures.volumeFeatures.priceVolumeMatch > 60) {
    enhancedVolume += 5;
  }
  if (bullFeatures.patternFeatures.limitUpCount >= 2) {
    enhancedVolume += 5;
  }

  // 龙头评分增强
  if (bullFeatures.bullScore >= 80) {
    enhancedLeader += 10;
  } else if (bullFeatures.bullScore >= 60) {
    enhancedLeader += 5;
  }
  if (bullFeatures.patternFeatures.hasLimitUp) {
    enhancedLeader += 5;
  }
  if (bullFeatures.patternFeatures.bullishAlignment) {
    enhancedLeader += 5;
  }

  // 确保评分不超过100
  return {
    trendScore: Math.min(100, Math.round(enhancedTrend + bullFactor * 10)),
    volumeScore: Math.min(100, Math.round(enhancedVolume + bullFactor * 10)),
    leaderScore: Math.min(100, Math.round(enhancedLeader + bullFactor * 10)),
  };
}

/**
 * 大牛股潜力股票筛选器
 */
export function filterBullPotentialStocks(
  stocks: Array<{
    code: string;
    name: string;
    enhancedAnalysis: EnhancedTechnicalAnalysis;
  }>,
  minScore: number = 60
): Array<{
  code: string;
  name: string;
  bullScore: number;
  recommendedStrategies: string[];
}> {
  return stocks
    .filter(s => s.enhancedAnalysis.bullScore >= minScore && s.enhancedAnalysis.isBullPotential)
    .map(s => ({
      code: s.code,
      name: s.name,
      bullScore: s.enhancedAnalysis.bullScore || 0,
      recommendedStrategies: s.enhancedAnalysis.recommendedStrategies,
    }))
    .sort((a, b) => b.bullScore - a.bullScore);
}

/**
 * 大牛股特征摘要生成
 */
export function generateBullFeatureSummary(features: BullStockFeatures): string {
  const summary: string[] = [];

  // 趋势特征
  if (features.trendFeatures.consecutiveRises >= 3) {
    summary.push(`连续上涨${features.trendFeatures.consecutiveRises}天`);
  }
  if (features.trendFeatures.price5DayChange >= 10) {
    summary.push(`5日涨幅${features.trendFeatures.price5DayChange.toFixed(1)}%`);
  }
  if (features.trendFeatures.breakHigh) {
    summary.push('突破前高');
  }

  // 成交量特征
  if (features.volumeFeatures.volumeRatio >= 2) {
    summary.push(`量比${features.volumeFeatures.volumeRatio.toFixed(1)}`);
  }
  if (features.volumeFeatures.turnoverRate >= 5) {
    summary.push(`换手率${features.volumeFeatures.turnoverRate.toFixed(1)}%`);
  }

  // 技术指标特征
  if (features.technicalFeatures.macdGoldenCross) {
    summary.push('MACD金叉');
  }
  if (features.patternFeatures.hasLimitUp) {
    summary.push('近期涨停');
  }
  if (features.patternFeatures.limitUpCount >= 2) {
    summary.push(`近期涨停${features.patternFeatures.limitUpCount}次`);
  }

  return summary.join('，') || '无明显大牛股特征';
}
