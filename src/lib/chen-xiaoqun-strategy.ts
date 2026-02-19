/**
 * 陈小群选股策略分析模块
 * 
 * 陈小群游资核心策略：
 * 1. 龙头战法 - 追涨龙头股，强者恒强
 * 2. 题材炒作 - 紧跟市场热点和题材
 * 3. 连板妖股 - 关注连续涨停的妖股
 * 4. 市场情绪 - 把握市场情绪周期
 * 5. 资金流向 - 关注主力资金动向
 * 6. 打板策略 - 涨停板买入
 * 7. 高位接力 - 高位接力的勇气和判断
 * 8. 板块轮动 - 把握板块轮动节奏
 */

import { getKLineData, getStockList } from '@/lib/stock-data';
import { performTechnicalAnalysis } from '@/lib/indicators';

/**
 * 陈小群策略评分因子
 */
export interface ChenXiaoqunFactors {
  // 龙头战法因子
  dragon_head_score: number;  // 龙头评分（板块排名、市值、流通盘）
  is_dragon_head: boolean;  // 是否龙头股
  
  // 连板妖股因子
  consecutive_limit_up: number;  // 连续涨停天数
  is_monster_stock: boolean;  // 是否妖股（5连板以上）
  
  // 市场情绪因子
  market_sentiment_cycle: string;  // 市场情绪周期（上升期/高潮期/退潮期/冰点期）
  sentiment_alignment: number;  // 情绪契合度
  
  // 资金流向因子
  main_force_flow: number;  // 主力资金净流入
  fund_accumulation: number;  // 资金堆量程度
  
  // 打板策略因子
  limit_up_timing: string;  // 涨停时机（早盘/中盘/尾盘）
  limit_up_strong: boolean;  // 是否强势涨停（多次封板）
  
  // 高位接力因子
  position_risk: number;  // 高位风险评分
  relay_feasibility: number;  // 接力可行性评分
  
  // 板块轮动因子
  sector_heat: number;  // 板块热度
  sector_rotation_position: string;  // 板块轮动位置（启动期/发酵期/高潮期/分化期/退潮期）
  
  // 综合评分
  overall_score: number;  // 陈小群策略综合评分
  action_advice: string;  // 操作建议
}

/**
 * 分析股票的陈小群策略因子
 */
export async function analyzeChenXiaoqunFactors(code: string, industry?: string): Promise<ChenXiaoqunFactors> {
  try {
    // 获取K线数据
    const klines = await getKLineData(code, '101');
    
    // 进行技术分析
    const techAnalysis = performTechnicalAnalysis(klines, code);
    
    // 分析龙头战法因子
    const dragonHeadAnalysis = analyzeDragonHead(code, klines, industry);
    
    // 分析连板妖股因子
    const consecutiveLimitAnalysis = analyzeConsecutiveLimitUp(klines);
    
    // 分析市场情绪因子
    const marketSentimentAnalysis = analyzeMarketSentiment(klines, techAnalysis);
    
    // 分析资金流向因子（模拟）
    const capitalFlowAnalysis = analyzeCapitalFlow(code);
    
    // 分析打板策略因子
    const limitUpAnalysis = analyzeLimitUpTiming(klines, techAnalysis);
    
    // 分析高位接力因子
    const highPositionAnalysis = analyzeHighPosition(klines, techAnalysis);
    
    // 分析板块轮动因子
    const sectorRotationAnalysis = analyzeSectorRotation(code, industry);
    
    // 计算综合评分
    const overallScore = calculateChenXiaoqunScore(
      dragonHeadAnalysis,
      consecutiveLimitAnalysis,
      marketSentimentAnalysis,
      capitalFlowAnalysis,
      limitUpAnalysis,
      highPositionAnalysis,
      sectorRotationAnalysis
    );
    
    // 生成操作建议
    const actionAdvice = generateActionAdvice(overallScore, {
      dragon_head: dragonHeadAnalysis.score,
      consecutive_limit: consecutiveLimitAnalysis.score,
      sentiment: marketSentimentAnalysis.score,
      capital: capitalFlowAnalysis.score,
      limit_up: limitUpAnalysis.score,
      high_position: highPositionAnalysis.score,
      sector: sectorRotationAnalysis.score,
    });
    
    return {
      dragon_head_score: dragonHeadAnalysis.score,
      is_dragon_head: dragonHeadAnalysis.isDragonHead,
      consecutive_limit_up: consecutiveLimitAnalysis.consecutiveLimitUp,
      is_monster_stock: consecutiveLimitAnalysis.isMonsterStock,
      market_sentiment_cycle: marketSentimentAnalysis.cycle,
      sentiment_alignment: marketSentimentAnalysis.score,
      main_force_flow: capitalFlowAnalysis.mainForceFlow,
      fund_accumulation: capitalFlowAnalysis.fundAccumulation,
      limit_up_timing: limitUpAnalysis.timing,
      limit_up_strong: limitUpAnalysis.isStrong,
      position_risk: highPositionAnalysis.risk,
      relay_feasibility: highPositionAnalysis.feasibility,
      sector_heat: sectorRotationAnalysis.heat,
      sector_rotation_position: sectorRotationAnalysis.position,
      overall_score: overallScore,
      action_advice: actionAdvice,
    };
  } catch (error) {
    console.error(`分析股票 ${code} 的陈小群策略因子失败:`, error);
    throw error;
  }
}

/**
 * 分析龙头战法因子
 */
function analyzeDragonHead(code: string, klines: any[], industry?: string): {
  score: number;
  isDragonHead: boolean;
  rank: number;
} {
  // 模拟龙头评分
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rank = (hash % 100) + 1;  // 板块排名 1-100
  
  // 龙头特征：
  // 1. 板块排名前3
  // 2. 流通盘适中（50-200亿）
  // 3. 近期涨幅领先
  const isTop3 = rank <= 3;
  
  // 简化评分：排名越高，评分越高
  let score = 0;
  if (isTop3) {
    score = 90 + (3 - rank) * 3;  // 90-99分
  } else if (rank <= 10) {
    score = 70 + (10 - rank) * 2;  // 70-89分
  } else if (rank <= 30) {
    score = 40 + (30 - rank);  // 40-69分
  } else {
    score = 40;  // 40分以下
  }
  
  return {
    score,
    isDragonHead: isTop3,
    rank,
  };
}

/**
 * 分析连板妖股因子
 */
function analyzeConsecutiveLimitUp(klines: any[]): {
  score: number;
  consecutiveLimitUp: number;
  isMonsterStock: boolean;
} {
  if (klines.length < 10) {
    return { score: 0, consecutiveLimitUp: 0, isMonsterStock: false };
  }
  
  let consecutiveLimitUp = 0;
  
  // 从最新开始往前数连续涨停
  for (let i = klines.length - 1; i >= Math.max(0, klines.length - 20); i--) {
    const k = klines[i];
    const change = ((parseFloat(k.close) - parseFloat(k.open)) / parseFloat(k.open)) * 100;
    
    // 涨停判断（简化：涨幅 >= 9.9%）
    if (change >= 9.9) {
      consecutiveLimitUp++;
    } else if (change >= 9) {
      // 接近涨停也算
      consecutiveLimitUp += 0.5;
    } else {
      break;
    }
  }
  
  // 妖股判断：5连板以上
  const isMonsterStock = consecutiveLimitUp >= 5;
  
  // 评分计算
  let score = 0;
  if (consecutiveLimitUp >= 7) {
    score = 99;  // 超级妖股
  } else if (consecutiveLimitUp >= 5) {
    score = 90 + (consecutiveLimitUp - 5) * 2;  // 妖股 90-98
  } else if (consecutiveLimitUp >= 3) {
    score = 70 + (consecutiveLimitUp - 3) * 10;  // 强势股 70-89
  } else if (consecutiveLimitUp >= 1) {
    score = 50 + consecutiveLimitUp * 10;  // 涨停股 60-79
  } else {
    score = consecutiveLimitUp * 30;  // 0-30
  }
  
  return {
    score: Math.min(100, score),
    consecutiveLimitUp,
    isMonsterStock,
  };
}

/**
 * 分析市场情绪因子
 */
function analyzeMarketSentiment(klines: any[], techAnalysis: any): {
  score: number;
  cycle: string;
} {
  // 根据技术指标判断市场情绪
  const { price5DayChange, consecutiveRises, volumeRatio } = techAnalysis;
  
  let cycle = 'neutral';
  let score = 50;
  
  if (consecutiveRises >= 3 && price5DayChange > 10 && volumeRatio > 1.5) {
    cycle = '高潮期';  // 高潮期
    score = 85;
  } else if (consecutiveRises >= 2 && price5DayChange > 5 && volumeRatio > 1.2) {
    cycle = '上升期';  // 上升期
    score = 75;
  } else if (price5DayChange < -5 || consecutiveRises <= -2) {
    cycle = '退潮期';  // 退潮期
    score = 25;
  } else if (price5DayChange < -10) {
    cycle = '冰点期';  // 冰点期
    score = 10;
  }
  
  return { score, cycle };
}

/**
 * 分析资金流向因子（模拟）
 */
function analyzeCapitalFlow(code: string): {
  score: number;
  mainForceFlow: number;  // 万元
  fundAccumulation: number;
} {
  // 模拟数据
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const mainForceFlow = Math.floor((Math.sin(hash) * 0.5 + 0.5) * 50000 - 25000);  // -25000 到 25000 万元
  const fundAccumulation = Math.floor((Math.sin(hash + 1) * 0.5 + 0.5) * 100);  // 0-100
  
  // 资金流入越多，评分越高
  const score = Math.min(100, Math.max(0, (mainForceFlow + 25000) / 50000 * 100));
  
  return {
    score,
    mainForceFlow,
    fundAccumulation,
  };
}

/**
 * 分析打板策略因子
 */
function analyzeLimitUpTiming(klines: any[], techAnalysis: any): {
  score: number;
  timing: string;
  isStrong: boolean;
} {
  if (!techAnalysis.hasLimitUp) {
    return { score: 30, timing: '未涨停', isStrong: false };
  }
  
  // 模拟涨停时机
  const hash = klines.length;
  const timingHour = Math.floor(Math.sin(hash) * 4 + 10);  // 9-13点
  
  let timing = '早盘';
  let score = 70;
  
  if (timingHour < 10) {
    timing = '早盘';
    score = 90;  // 早盘涨停最强势
  } else if (timingHour < 11) {
    timing = '中盘早';
    score = 80;
  } else if (timingHour < 13) {
    timing = '午后';
    score = 60;
  } else {
    timing = '尾盘';
    score = 50;  // 尾盘涨停相对较弱
  }
  
  // 强势涨停判断
  const isStrong = score >= 80;
  
  return { score, timing, isStrong };
}

/**
 * 分析高位接力因子
 */
function analyzeHighPosition(klines: any[], techAnalysis: any): {
  score: number;
  risk: number;  // 风险评分
  feasibility: number;  // 接力可行性
} {
  if (klines.length < 20) {
    return { score: 50, risk: 50, feasibility: 50 };
  }
  
  const close = parseFloat(klines[klines.length - 1].close);
  const ma20 = klines.slice(-20).reduce((sum, k) => sum + parseFloat(k.close), 0) / 20;
  
  // 计算偏离度
  const deviation = ((close - ma20) / ma20) * 100;
  
  // 偏离度越高，风险越大
  let risk = 0;
  if (deviation > 50) {
    risk = 90;
  } else if (deviation > 30) {
    risk = 70;
  } else if (deviation > 10) {
    risk = 40;
  } else {
    risk = 20;
  }
  
  // 接力可行性：风险低且技术面强势
  const feasibility = Math.max(0, 100 - risk + (techAnalysis.price5DayChange > 5 ? 20 : 0));
  
  // 综合评分
  const score = (feasibility * 0.6) + ((100 - risk) * 0.4);
  
  return {
    score: Math.min(100, Math.max(0, score)),
    risk,
    feasibility: Math.min(100, feasibility),
  };
}

/**
 * 分析板块轮动因子
 */
function analyzeSectorRotation(code: string, industry?: string): {
  score: number;
  heat: number;
  position: string;
} {
  // 模拟板块热度
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const heat = Math.floor((Math.sin(hash) * 0.5 + 0.5) * 100);
  
  let position = '启动期';
  let score = 60;
  
  if (heat > 80) {
    position = '高潮期';
    score = 85;
  } else if (heat > 60) {
    position = '发酵期';
    score = 75;
  } else if (heat > 40) {
    position = '启动期';
    score = 60;
  } else if (heat > 20) {
    position = '分化期';
    score = 45;
  } else {
    position = '退潮期';
    score = 30;
  }
  
  return { score, heat, position };
}

/**
 * 计算陈小群策略综合评分
 */
function calculateChenXiaoqunScore(
  dragon: any,
  consecutive: any,
  sentiment: any,
  capital: any,
  limitUp: any,
  highPosition: any,
  sector: any
): number {
  // 陈小群策略权重：
  // - 龙头战法：20%
  // - 连板妖股：25%
  // - 市场情绪：15%
  // - 资金流向：15%
  // - 打板策略：15%
  // - 高位接力：5%
  // - 板块轮动：5%
  
  const overallScore = Math.floor(
    (dragon.score * 0.20) +
    (consecutive.score * 0.25) +
    (sentiment.score * 0.15) +
    (capital.score * 0.15) +
    (limitUp.score * 0.15) +
    (highPosition.score * 0.05) +
    (sector.score * 0.05)
  );
  
  return overallScore;
}

/**
 * 生成操作建议
 */
function generateActionAdvice(
  overallScore: number,
  scores: any
): string {
  if (overallScore >= 80) {
    return '强烈推荐：龙头+妖股，符合陈小群核心策略，建议打板买入';
  } else if (overallScore >= 70) {
    return '推荐：具备龙头潜力，可考虑分仓买入';
  } else if (overallScore >= 60) {
    return '关注：有涨停潜力，等待确认信号';
  } else if (overallScore >= 50) {
    return '观望：特征不明显，暂不介入';
  } else {
    return '回避：不符合陈小群策略，建议放弃';
  }
}

/**
 * 批量分析陈小群策略因子
 */
export async function batchAnalyzeChenXiaoqunFactors(stocks: any[]): Promise<Record<string, ChenXiaoqunFactors>> {
  const results: Record<string, ChenXiaoqunFactors> = {};
  
  for (const stock of stocks) {
    try {
      const factors = await analyzeChenXiaoqunFactors(stock.stock_code, stock.industry);
      results[stock.stock_code] = factors;
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`分析股票 ${stock.stock_code} 的陈小群策略因子失败:`, error);
      results[stock.stock_code] = {
        dragon_head_score: 0,
        is_dragon_head: false,
        consecutive_limit_up: 0,
        is_monster_stock: false,
        market_sentiment_cycle: '未知',
        sentiment_alignment: 0,
        main_force_flow: 0,
        fund_accumulation: 0,
        limit_up_timing: '未知',
        limit_up_strong: false,
        position_risk: 0,
        relay_feasibility: 0,
        sector_heat: 0,
        sector_rotation_position: '未知',
        overall_score: 0,
        action_advice: '分析失败',
      };
    }
  }
  
  return results;
}
