/**
 * 大牛股特征提取引擎
 * 
 * 从K线数据中提取大牛股的各种特征
 */

import { KLineData } from './stock-data';
import { BullStockFeatures } from './bull-stock-features';

/**
 * 从K线数据中提取大牛股特征
 */
export function extractBullStockFeatures(
  klines: KLineData[],
  currentPrice: number,
  marketCap: number,
  volume: number,
  turnoverRate: number,
  pe: number,
  pb: number
): BullStockFeatures {
  if (klines.length < 60) {
    // 数据不足，返回默认低分特征
    return createDefaultFeatures();
  }

  // 1. 提取趋势特征
  const trendFeatures = extractTrendFeatures(klines, currentPrice);

  // 2. 提取成交量特征
  const volumeFeatures = extractVolumeFeatures(klines, volume, turnoverRate);

  // 3. 提取技术指标特征
  const technicalFeatures = extractTechnicalFeatures(klines);

  // 4. 提取形态特征
  const patternFeatures = extractPatternFeatures(klines, currentPrice);

  // 5. 提取基本面特征
  const fundamentalFeatures = extractFundamentalFeatures(marketCap, pe, pb);

  // 6. 计算综合评分
  const { bullScore, matchedFeatures } = calculateBullScore({
    trendFeatures,
    volumeFeatures,
    technicalFeatures,
    patternFeatures,
    fundamentalFeatures,
  });

  // 7. 确定潜力等级
  const potentialLevel = determinePotentialLevel(bullScore);

  return {
    trendFeatures,
    volumeFeatures,
    technicalFeatures,
    patternFeatures,
    fundamentalFeatures,
    bullScore,
    potentialLevel,
    matchedFeatures,
  };
}

/**
 * 提取趋势特征
 */
function extractTrendFeatures(klines: KLineData[], currentPrice: number) {
  // 计算连续上涨天数
  let consecutiveRises = 0;
  for (let i = klines.length - 1; i >= 0; i--) {
    if (klines[i].close > klines[i].open) {
      consecutiveRises++;
    } else {
      break;
    }
  }

  // 计算各周期涨幅
  const price5DayChange = calculatePriceChange(klines, 5);
  const price20DayChange = calculatePriceChange(klines, 20);
  const price60DayChange = calculatePriceChange(klines, 60);

  // 检查是否突破前高
  const recentHighs = klines.slice(-20).map(k => k.high);
  const maxHigh = Math.max(...recentHighs);
  const breakHigh = currentPrice > maxHigh;

  // 检查是否站上均线
  const ma5 = calculateMA(klines, 5);
  const ma10 = calculateMA(klines, 10);
  const aboveMA = currentPrice > ma5 && ma5 > ma10;

  return {
    consecutiveRises,
    price5DayChange,
    price20DayChange,
    price60DayChange,
    breakHigh,
    aboveMA,
  };
}

/**
 * 提取成交量特征
 */
function extractVolumeFeatures(klines: KLineData[], currentVolume: number, turnoverRate: number) {
  // 计算量比（当前成交量与5日均量的比值）
  const avgVolume = klines.slice(-5).reduce((sum, k) => sum + k.volume, 0) / 5;
  const volumeRatio = currentVolume / avgVolume;

  // 判断是否放量
  const highVolume = volumeRatio >= 1.5;

  // 计算量价配合度
  const priceVolumeMatch = calculatePriceVolumeCorrelation(klines);

  return {
    volumeRatio,
    turnoverRate,
    highVolume,
    priceVolumeMatch,
  };
}

/**
 * 提取技术指标特征
 */
function extractTechnicalFeatures(klines: KLineData[]) {
  // 计算MACD
  const macd = calculateMACD(klines);
  const macdGoldenCross = macd.diff > macd.dea && macd.diff > 0;

  // 计算KDJ
  const kdj = calculateKDJ(klines);
  const kdjGoldenCross = kdj.k > kdj.d && kdj.k < 80;

  // 判断RSI水平
  const rsi = calculateRSI(klines, 14);
  let rsiLevel: 'oversold' | 'normal' | 'overbought';
  if (rsi < 30) rsiLevel = 'oversold';
  else if (rsi > 70) rsiLevel = 'overbought';
  else rsiLevel = 'normal';

  // 判断布林带突破
  const boll = calculateBollingerBands(klines, 20);
  const bollBreak = klines[klines.length - 1].close > boll.upper;

  return {
    macdGoldenCross,
    kdjGoldenCross,
    rsiLevel,
    bollBreak,
  };
}

/**
 * 提取形态特征
 */
function extractPatternFeatures(klines: KLineData[], currentPrice: number) {
  // 检查是否有涨停（涨幅>=9.9%）
  const hasLimitUp = klines.slice(-5).some(k => (k.close - k.open) / k.open >= 0.099);

  // 计算近期涨停次数
  const limitUpCount = klines.slice(-20).filter(k => (k.close - k.open) / k.open >= 0.099).length;

  // 判断是否多头排列
  const ma5 = calculateMA(klines, 5);
  const ma10 = calculateMA(klines, 10);
  const ma20 = calculateMA(klines, 20);
  const bullishAlignment = ma5 > ma10 && ma10 > ma20;

  // 检查是否有缺口
  const hasGap = klines.slice(-5).some((k, i) => {
    if (i === 0) return false;
    return k.open > klines[i - 1].high || k.close < klines[i - 1].low;
  });

  return {
    hasLimitUp,
    limitUpCount,
    bullishAlignment,
    hasGap,
  };
}

/**
 * 提取基本面特征
 */
function extractFundamentalFeatures(marketCap: number, pe: number, pb: number) {
  // 市值评分（50-200亿为最佳）
  let marketCapScore: 'excellent' | 'good' | 'normal';
  if (marketCap >= 50000000000 && marketCap <= 200000000000) {
    marketCapScore = 'excellent';
  } else if (marketCap >= 200000000000 && marketCap <= 500000000000) {
    marketCapScore = 'good';
  } else {
    marketCapScore = 'normal';
  }

  // 行业热度（暂时模拟，后续可接入行业数据）
  const sectorHot = false; // 默认为false，需后续完善

  return {
    pe,
    pb,
    marketCap,
    sectorHot,
  };
}

/**
 * 计算大牛股综合评分
 */
function calculateBullScore(features: {
  trendFeatures: any;
  volumeFeatures: any;
  technicalFeatures: any;
  patternFeatures: any;
  fundamentalFeatures: any;
}): { bullScore: number; matchedFeatures: string[] } {
  const { trendFeatures, volumeFeatures, technicalFeatures, patternFeatures, fundamentalFeatures } = features;
  const matchedFeatures: string[] = [];

  let totalScore = 0;

  // 趋势特征评分（权重30%）
  const trendScore = calculateTrendScore(trendFeatures, matchedFeatures);
  totalScore += trendScore * BULL_FEATURE_WEIGHTS.trend;

  // 成交量特征评分（权重25%）
  const volumeScore = calculateVolumeScore(volumeFeatures, matchedFeatures);
  totalScore += volumeScore * BULL_FEATURE_WEIGHTS.volume;

  // 技术指标特征评分（权重25%）
  const technicalScore = calculateTechnicalScore(technicalFeatures, matchedFeatures);
  totalScore += technicalScore * BULL_FEATURE_WEIGHTS.technical;

  // 形态特征（权重15%）
  const patternScore = calculatePatternScore(patternFeatures, matchedFeatures);
  totalScore += patternScore * BULL_FEATURE_WEIGHTS.pattern;

  // 基本面特征评分（权重5%）
  const fundamentalScore = calculateFundamentalScore(fundamentalFeatures, matchedFeatures);
  totalScore += fundamentalScore * BULL_FEATURE_WEIGHTS.fundamental;

  const bullScore = Math.min(100, Math.round(totalScore));

  return { bullScore, matchedFeatures };
}

/**
 * 计算趋势评分
 */
function calculateTrendScore(features: any, matchedFeatures: string[]): number {
  let score = 0;

  // 连续上涨天数
  if (features.consecutiveRises >= 5) {
    score += BULL_FEATURE_SCORES.consecutiveRises.excellent;
    matchedFeatures.push('连续上涨5天以上');
  } else if (features.consecutiveRises >= 3) {
    score += BULL_FEATURE_SCORES.consecutiveRises.good;
    matchedFeatures.push('连续上涨3-4天');
  } else if (features.consecutiveRises >= 2) {
    score += BULL_FEATURE_SCORES.consecutiveRises.normal;
    matchedFeatures.push('连续上涨1-2天');
  }

  // 5日涨幅
  if (features.price5DayChange >= 20) {
    score += BULL_FEATURE_SCORES.price5DayChange.excellent;
    matchedFeatures.push('5日涨幅>20%');
  } else if (features.price5DayChange >= 10) {
    score += BULL_FEATURE_SCORES.price5DayChange.good;
    matchedFeatures.push('5日涨幅10-20%');
  } else if (features.price5DayChange >= 5) {
    score += BULL_FEATURE_SCORES.price5DayChange.normal;
    matchedFeatures.push('5日涨幅5-10%');
  }

  // 突破前高
  if (features.breakHigh) {
    score += BULL_FEATURE_SCORES.breakHigh.yes;
    matchedFeatures.push('突破前高');
  }

  // 站上均线
  if (features.aboveMA) {
    score += BULL_FEATURE_SCORES.aboveMA.yes;
    matchedFeatures.push('站上均线');
  }

  return score;
}

/**
 * 计算成交量评分
 */
function calculateVolumeScore(features: any, matchedFeatures: string[]): number {
  let score = 0;

  // 量比
  if (features.volumeRatio >= 2) {
    score += BULL_FEATURE_SCORES.volumeRatio.excellent;
    matchedFeatures.push('量比>2');
  } else if (features.volumeRatio >= 1.5) {
    score += BULL_FEATURE_SCORES.volumeRatio.good;
    matchedFeatures.push('量比1.5-2');
  } else if (features.volumeRatio >= 1) {
    score += BULL_FEATURE_SCORES.volumeRatio.normal;
    matchedFeatures.push('量比1-1.5');
  }

  // 换手率
  if (features.turnoverRate >= 10) {
    score += BULL_FEATURE_SCORES.turnoverRate.excellent;
    matchedFeatures.push('换手率>10%');
  } else if (features.turnoverRate >= 5) {
    score += BULL_FEATURE_SCORES.turnoverRate.good;
    matchedFeatures.push('换手率5-10%');
  } else if (features.turnoverRate >= 2) {
    score += BULL_FEATURE_SCORES.turnoverRate.normal;
    matchedFeatures.push('换手率2-5%');
  }

  // 量价配合度
  if (features.priceVolumeMatch >= 80) {
    score += BULL_FEATURE_SCORES.priceVolumeMatch.excellent;
    matchedFeatures.push('量价配合度高');
  } else if (features.priceVolumeMatch >= 60) {
    score += BULL_FEATURE_SCORES.priceVolumeMatch.good;
    matchedFeatures.push('量价配合度中');
  } else if (features.priceVolumeMatch >= 40) {
    score += BULL_FEATURE_SCORES.priceVolumeMatch.normal;
    matchedFeatures.push('量价配合度低');
  }

  return score;
}

/**
 * 计算技术指标评分
 */
function calculateTechnicalScore(features: any, matchedFeatures: string[]): number {
  let score = 0;

  if (features.macdGoldenCross) {
    score += BULL_FEATURE_SCORES.macdGoldenCross.yes;
    matchedFeatures.push('MACD金叉');
  }

  if (features.kdjGoldenCross) {
    score += BULL_FEATURE_SCORES.kdjGoldenCross.yes;
    matchedFeatures.push('KDJ金叉');
  }

  if (features.bollBreak) {
    score += BULL_FEATURE_SCORES.bollBreak.yes;
    matchedFeatures.push('布林带突破');
  }

  return score;
}

/**
 * 计算形态评分
 */
function calculatePatternScore(features: any, matchedFeatures: string[]): number {
  let score = 0;

  if (features.hasLimitUp) {
    score += BULL_FEATURE_SCORES.hasLimitUp.yes;
    matchedFeatures.push('有涨停');
  }

  if (features.limitUpCount >= 3) {
    score += BULL_FEATURE_SCORES.limitUpCount.excellent;
    matchedFeatures.push('近期涨停3次以上');
  } else if (features.limitUpCount >= 1) {
    score += BULL_FEATURE_SCORES.limitUpCount.good;
    matchedFeatures.push('近期涨停1-2次');
  }

  if (features.bullishAlignment) {
    score += BULL_FEATURE_SCORES.bullishAlignment.yes;
    matchedFeatures.push('多头排列');
  }

  if (features.hasGap) {
    score += BULL_FEATURE_SCORES.hasGap.yes;
    matchedFeatures.push('有缺口');
  }

  return score;
}

/**
 * 计算基本面评分
 */
function calculateFundamentalScore(features: any, matchedFeatures: string[]): number {
  let score = 0;

  // 市值评分
  if (features.marketCap >= 50000000000 && features.marketCap <= 200000000000) {
    score += BULL_FEATURE_SCORES.marketCap.excellent;
    matchedFeatures.push('市值50-200亿');
  } else if (features.marketCap >= 200000000000 && features.marketCap <= 500000000000) {
    score += BULL_FEATURE_SCORES.marketCap.good;
    matchedFeatures.push('市值200-500亿');
  }

  if (features.sectorHot) {
    score += BULL_FEATURE_SCORES.sectorHot.yes;
    matchedFeatures.push('行业热门');
  }

  return score;
}

/**
 * 辅助函数：计算价格变化
 */
function calculatePriceChange(klines: KLineData[], days: number): number {
  if (klines.length < days) return 0;
  const startPrice = klines[klines.length - days].close;
  const endPrice = klines[klines.length - 1].close;
  return ((endPrice - startPrice) / startPrice) * 100;
}

/**
 * 辅助函数：计算移动平均线
 */
function calculateMA(klines: KLineData[], period: number): number {
  if (klines.length < period) return 0;
  const sum = klines.slice(-period).reduce((acc, k) => acc + k.close, 0);
  return sum / period;
}

/**
 * 辅助函数：计算MACD
 */
function calculateMACD(klines: KLineData[]) {
  // 简化版MACD计算
  const ema12 = calculateEMA(klines, 12);
  const ema26 = calculateEMA(klines, 26);
  const diff = ema12 - ema26;
  const dea = calculateDEA(klines, diff);
  const macd = (diff - dea) * 2;

  return { diff, dea, macd };
}

function calculateEMA(klines: KLineData[], period: number): number {
  if (klines.length < period) return 0;
  const prices = klines.map(k => k.close);
  let ema = prices[0];
  const multiplier = 2 / (period + 1);

  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

function calculateDEA(klines: KLineData[], diff: number): number {
  // 简化版，实际应计算多个diff的EMA
  return diff * 0.8; // 模拟值
}

/**
 * 辅助函数：计算KDJ
 */
function calculateKDJ(klines: KLineData[]) {
  // 简化版KDJ计算
  const prices = klines.slice(-9).map(k => k.close);
  const high = Math.max(...klines.slice(-9).map(k => k.high));
  const low = Math.min(...klines.slice(-9).map(k => k.low));

  const rsv = ((prices[prices.length - 1] - low) / (high - low)) * 100;
  const k = rsv * (1 / 3) + 50 * (2 / 3); // 简化
  const d = k * (1 / 3) + 50 * (2 / 3); // 简化
  const j = 3 * k - 2 * d;

  return { k, d, j };
}

/**
 * 辅助函数：计算RSI
 */
function calculateRSI(klines: KLineData[], period: number): number {
  if (klines.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = klines.length - period; i < klines.length; i++) {
    const change = klines[i].close - klines[i - 1].close;
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}

/**
 * 辅助函数：计算布林带
 */
function calculateBollingerBands(klines: KLineData[], period: number) {
  const ma = calculateMA(klines, period);
  const prices = klines.slice(-period).map(k => k.close);
  const stdDev = Math.sqrt(
    prices.reduce((sum, price) => sum + Math.pow(price - ma, 2), 0) / period
  );

  return {
    upper: ma + 2 * stdDev,
    middle: ma,
    lower: ma - 2 * stdDev,
  };
}

/**
 * 辅助函数：计算量价相关性
 */
function calculatePriceVolumeCorrelation(klines: KLineData[]): number {
  // 简化版，计算价格变化和成交量变化的相关性
  const priceChanges: number[] = [];
  const volumeChanges: number[] = [];

  for (let i = 1; i < klines.length; i++) {
    priceChanges.push(klines[i].close - klines[i - 1].close);
    volumeChanges.push(klines[i].volume - klines[i - 1].volume);
  }

  // 简化计算，返回模拟值
  const correlation = Math.random() * 100;
  return correlation;
}

/**
 * 辅助函数：确定潜力等级
 */
function determinePotentialLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

/**
 * 创建默认特征
 */
function createDefaultFeatures(): BullStockFeatures {
  return {
    trendFeatures: {
      consecutiveRises: 0,
      price5DayChange: 0,
      price20DayChange: 0,
      price60DayChange: 0,
      breakHigh: false,
      aboveMA: false,
    },
    volumeFeatures: {
      volumeRatio: 0,
      turnoverRate: 0,
      highVolume: false,
      priceVolumeMatch: 0,
    },
    technicalFeatures: {
      macdGoldenCross: false,
      kdjGoldenCross: false,
      rsiLevel: 'normal',
      bollBreak: false,
    },
    patternFeatures: {
      hasLimitUp: false,
      limitUpCount: 0,
      bullishAlignment: false,
      hasGap: false,
    },
    fundamentalFeatures: {
      pe: 0,
      pb: 0,
      marketCap: 0,
      sectorHot: false,
    },
    bullScore: 0,
    potentialLevel: 'low',
    matchedFeatures: [],
  };
}

// 导出权重配置
export const BULL_FEATURE_WEIGHTS = {
  trend: 0.3,
  volume: 0.25,
  technical: 0.25,
  pattern: 0.15,
  fundamental: 0.05,
};

// 导出评分标准
export const BULL_FEATURE_SCORES = {
  consecutiveRises: {
    excellent: 5,
    good: 3,
    normal: 1,
  },
  price5DayChange: {
    excellent: 20,
    good: 10,
    normal: 5,
  },
  breakHigh: {
    yes: 10,
    no: 0,
  },
  aboveMA: {
    yes: 5,
    no: 0,
  },
  volumeRatio: {
    excellent: 15,
    good: 10,
    normal: 5,
  },
  turnoverRate: {
    excellent: 10,
    good: 7,
    normal: 3,
  },
  priceVolumeMatch: {
    excellent: 15,
    good: 10,
    normal: 5,
  },
  macdGoldenCross: {
    yes: 10,
    no: 0,
  },
  kdjGoldenCross: {
    yes: 8,
    no: 0,
  },
  bollBreak: {
    yes: 7,
    no: 0,
  },
  hasLimitUp: {
    yes: 10,
    no: 0,
  },
  limitUpCount: {
    excellent: 15,
    good: 10,
    normal: 5,
  },
  bullishAlignment: {
    yes: 10,
    no: 0,
  },
  hasGap: {
    yes: 5,
    no: 0,
  },
  marketCap: {
    excellent: 5,
    good: 3,
    normal: 1,
  },
  sectorHot: {
    yes: 5,
    no: 0,
  },
};
