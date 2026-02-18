/**
 * 大牛股特征定义与分析模块
 * 
 * 功能：
 * 1. 定义大牛股的核心特征
 * 2. 提取股票的潜在大牛股特征
 * 3. 计算大牛股潜力评分
 * 4. 为三大策略提供特征增强
 */

/**
 * 大牛股核心特征定义
 */
export interface BullStockFeatures {
  // 趋势特征
  trendFeatures: {
    // 连续上涨天数
    consecutiveRises: number;
    // 5日涨幅
    price5DayChange: number;
    // 20日涨幅
    price20DayChange: number;
    // 60日涨幅
    price60DayChange: number;
    // 是否突破前高
    breakHigh: boolean;
    // 是否站上均线
    aboveMA: boolean;
  };

  // 成交量特征
  volumeFeatures: {
    // 量比
    volumeRatio: number;
    // 换手率
    turnoverRate: number;
    // 是否放量
    highVolume: boolean;
    // 量价配合度
    priceVolumeMatch: number; // 0-100
  };

  // 技术指标特征
  technicalFeatures: {
    // MACD金叉
    macdGoldenCross: boolean;
    // KDJ金叉
    kdjGoldenCross: boolean;
    // RSI超卖/超买
    rsiLevel: 'oversold' | 'normal' | 'overbought';
    // 布林带突破
    bollBreak: boolean;
  };

  // 形态特征
  patternFeatures: {
    // 是否有涨停
    hasLimitUp: boolean;
    // 近期涨停次数
    limitUpCount: number;
    // 是否形成多头排列
    bullishAlignment: boolean;
    // 是否有缺口
    hasGap: boolean;
  };

  // 基本面特征
  fundamentalFeatures: {
    // 市盈率
    pe: number;
    // 市净率
    pb: number;
    // 总市值（元）
    marketCap: number;
    // 行业热度
    sectorHot: boolean;
  };

  // 综合评分
  bullScore: number; // 0-100
  // 潜力等级
  potentialLevel: 'high' | 'medium' | 'low';
  // 命中的特征数量
  matchedFeatures: string[];
}

/**
 * 大牛股历史记录
 */
export interface BullStockHistory {
  id: string;
  code: string;
  name: string;
  startDate: string; // 启动日期
  peakDate: string; // 高点日期
  startDatePrice: number; // 启动时价格
  peakDatePrice: number; // 高点价格
  maxGain: number; // 最大涨幅（百分比）
  duration: number; // 持续天数
  features: BullStockFeatures; // 启动时的特征
  tags: string[]; // 标签（如：AI概念、新能源等）
  createdAt: Date;
}

/**
 * 特征权重配置
 */
export const BULL_FEATURE_WEIGHTS = {
  trend: 0.3, // 趋势权重30%
  volume: 0.25, // 成交量权重25%
  technical: 0.25, // 技术指标权重25%
  pattern: 0.15, // 形态权重15%
  fundamental: 0.05, // 基本面权重5%
};

/**
 * 大牛股特征评分标准
 */
export const BULL_FEATURE_SCORES = {
  // 趋势特征
  consecutiveRises: {
    excellent: 5, // 连续5天以上
    good: 3, // 连续3-4天
    normal: 1, // 连续1-2天
  },
  price5DayChange: {
    excellent: 20, // 涨幅>20%
    good: 10, // 涨幅10-20%
    normal: 5, // 涨幅5-10%
  },
  breakHigh: {
    yes: 10,
    no: 0,
  },
  aboveMA: {
    yes: 5,
    no: 0,
  },

  // 成交量特征
  volumeRatio: {
    excellent: 15, // 量比>2
    good: 10, // 量比1.5-2
    normal: 5, // 量比1-1.5
  },
  turnoverRate: {
    excellent: 10, // 换手率>10%
    good: 7, // 换手率5-10%
    normal: 3, // 换手率2-5%
  },
  priceVolumeMatch: {
    // 量价配合度（0-100）
    excellent: 15, // >80
    good: 10, // 60-80
    normal: 5, // 40-60
  },

  // 技术指标特征
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

  // 形态特征
  hasLimitUp: {
    yes: 10,
    no: 0,
  },
  limitUpCount: {
    excellent: 15, // 3次以上
    good: 10, // 1-2次
    normal: 5, // 0次
  },
  bullishAlignment: {
    yes: 10,
    no: 0,
  },
  hasGap: {
    yes: 5,
    no: 0,
  },

  // 基本面特征
  marketCap: {
    excellent: 5, // 50-200亿
    good: 3, // 200-500亿
    normal: 1, // 其他
  },
  sectorHot: {
    yes: 5,
    no: 0,
  },
};

/**
 * 大牛股潜在特征阈值配置
 */
export const BULL_POTENTIAL_THRESHOLDS = {
  bullScore: {
    high: 80, // 高潜力：评分>=80
    medium: 60, // 中等潜力：评分>=60
    low: 40, // 低潜力：评分>=40
  },
  // 必备特征（必须满足）
  requiredFeatures: [
    'consecutiveRises>=2', // 至少连续上涨2天
    'price5DayChange>=5', // 5日涨幅至少5%
    'volumeRatio>=1.2', // 量比至少1.2
  ],
};

/**
 * 检查股票是否符合大牛股潜力特征
 */
export function checkBullStockPotential(features: BullStockFeatures): {
  isPotential: boolean;
  level: 'high' | 'medium' | 'low';
  matchedFeatures: string[];
  missingFeatures: string[];
} {
  const { bullScore, matchedFeatures } = features;
  const level = determinePotentialLevel(bullScore);

  // 检查必备特征
  const missingRequired: string[] = [];
  for (const requirement of BULL_POTENTIAL_THRESHOLDS.requiredFeatures) {
    const [feature, operator, threshold] = requirement.split(/([>=]+)/);
    const featureValue = getFeatureValue(features, feature);
    const meetsRequirement = checkRequirement(featureValue, operator, parseFloat(threshold));

    if (!meetsRequirement) {
      missingRequired.push(requirement);
    }
  }

  return {
    isPotential: bullScore >= BULL_POTENTIAL_THRESHOLDS.bullScore.low && missingRequired.length === 0,
    level,
    matchedFeatures,
    missingFeatures: missingRequired,
  };
}

/**
 * 确定潜力等级
 */
function determinePotentialLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= BULL_POTENTIAL_THRESHOLDS.bullScore.high) return 'high';
  if (score >= BULL_POTENTIAL_THRESHOLDS.bullScore.medium) return 'medium';
  if (score >= BULL_POTENTIAL_THRESHOLDS.bullScore.low) return 'low';
  return 'low';
}

/**
 * 获取特征值
 */
function getFeatureValue(features: BullStockFeatures, featurePath: string): number {
  const paths = featurePath.split('.');
  let value: any = features;
  
  for (const path of paths) {
    value = value[path];
  }
  
  return value;
}

/**
 * 检查是否满足要求
 */
function checkRequirement(value: number, operator: string, threshold: number): boolean {
  if (operator === '>=') return value >= threshold;
  if (operator === '<=') return value <= threshold;
  if (operator === '>') return value > threshold;
  if (operator === '<') return value < threshold;
  return false;
}
