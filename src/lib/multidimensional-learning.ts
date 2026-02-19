/**
 * 同花顺策略多维度学习引擎
 * 
 * 功能：
 * 1. 分析股票的多维度因子（市场情绪、政策、资金、基本面、行业、技术指标）
 * 2. 生成学习评分
 * 3. 优化选股策略
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  analyzeMultiDimensionalFactors,
  getMarketSentimentFactor,
  getPolicyGuidanceFactor,
  getCapitalFlowFactor,
  getFundamentalMetricsFactor,
  getIndustryFactorsFactor,
} from '@/lib/multidimensional-analysis';
import { getKLineData } from '@/lib/stock-data';

/**
 * 多维度学习记录
 */
export interface MultiDimensionalLearningRecord {
  market_sentiment: any;
  policy_guidance: any;
  capital_flow: any;
  fundamental_metrics: any;
  industry_factors: any;
  advanced_indicators: any;
}

/**
 * 学习评分
 */
export interface LearningScore {
  overall_score: number;
  market_sentiment_score: number;
  policy_guidance_score: number;
  capital_flow_score: number;
  fundamental_metrics_score: number;
  industry_factors_score: number;
  technical_indicators_score: number;
}

/**
 * 执行多维度学习
 * @param stocks 股票列表
 * @param strategyType 策略类型
 * @returns 学习结果
 */
export async function performMultiDimensionalLearning(
  stocks: any[],
  strategyType: string
): Promise<{
  success: boolean;
  analyzedCount: number;
  factors: Record<string, MultiDimensionalLearningRecord>;
  avgScores: LearningScore;
  recommendations: string[];
}> {
  console.log(`开始多维度学习分析，股票数量: ${stocks.length}`);

  // 获取K线数据
  const klinesMap = new Map<string, any[]>();
  
  for (const stock of stocks) {
    try {
      const klines = await getKLineData(stock.stock_code, '101');
      klinesMap.set(stock.stock_code, klines);
      console.log(`获取股票 ${stock.stock_code} 的K线数据，数量: ${klines.length}`);
    } catch (error) {
      console.error(`获取股票 ${stock.stock_code} 的K线数据失败:`, error);
    }
  }

  // 分析多维度因子
  const factors = await analyzeMultiDimensionalFactors(stocks, klinesMap);
  const analyzedStocks = Object.keys(factors).length;

  console.log(`多维度分析完成，成功分析 ${analyzedStocks} 只股票`);

  // 计算平均评分
  const avgScores = calculateAverageScores(factors);

  // 生成优化建议
  const recommendations = generateMultiDimensionalRecommendations(avgScores, factors);

  // 保存学习记录
  await saveMultiDimensionalLearningRecords(stocks, factors, strategyType);

  return {
    success: true,
    analyzedCount: analyzedStocks,
    factors,
    avgScores,
    recommendations,
  };
}

/**
 * 计算平均评分
 */
function calculateAverageScores(factors: Record<string, MultiDimensionalLearningRecord>): LearningScore {
  const stockCodes = Object.keys(factors);
  
  if (stockCodes.length === 0) {
    return {
      overall_score: 0,
      market_sentiment_score: 0,
      policy_guidance_score: 0,
      capital_flow_score: 0,
      fundamental_metrics_score: 0,
      industry_factors_score: 0,
      technical_indicators_score: 0,
    };
  }

  let totalMarketSentiment = 0;
  let totalPolicyGuidance = 0;
  let totalCapitalFlow = 0;
  let totalFundamental = 0;
  let totalIndustry = 0;
  let totalTechnical = 0;

  let validMarketSentimentCount = 0;
  let validPolicyGuidanceCount = 0;
  let validCapitalFlowCount = 0;
  let validFundamentalCount = 0;
  let validIndustryCount = 0;
  let validTechnicalCount = 0;

  for (const code of stockCodes) {
    const factor = factors[code];
    
    if (factor?.market_sentiment?.overall_score !== undefined) {
      totalMarketSentiment += factor.market_sentiment.overall_score;
      validMarketSentimentCount++;
    }
    
    if (factor?.policy_guidance?.overall_score !== undefined) {
      totalPolicyGuidance += factor.policy_guidance.overall_score;
      validPolicyGuidanceCount++;
    }
    
    if (factor?.capital_flow?.capital_score !== undefined) {
      totalCapitalFlow += factor.capital_flow.capital_score;
      validCapitalFlowCount++;
    }
    
    if (factor?.fundamental_metrics?.fundamental_score !== undefined) {
      totalFundamental += factor.fundamental_metrics.fundamental_score;
      validFundamentalCount++;
    }
    
    if (factor?.industry_factors?.industry_score !== undefined) {
      totalIndustry += factor.industry_factors.industry_score;
      validIndustryCount++;
    }
    
    if (factor?.advanced_indicators) {
      // 简化技术指标评分计算
      let techScore = 50;
      if (factor.advanced_indicators.rsi > 30 && factor.advanced_indicators.rsi < 70) {
        techScore += 10;
      }
      if (factor.advanced_indicators.ma_cross === 'golden_cross') {
        techScore += 20;
      }
      totalTechnical += techScore;
      validTechnicalCount++;
    }
  }

  const avgMarketSentiment = validMarketSentimentCount > 0 ? totalMarketSentiment / validMarketSentimentCount : 0;
  const avgPolicyGuidance = validPolicyGuidanceCount > 0 ? totalPolicyGuidance / validPolicyGuidanceCount : 0;
  const avgCapitalFlow = validCapitalFlowCount > 0 ? totalCapitalFlow / validCapitalFlowCount : 0;
  const avgFundamental = validFundamentalCount > 0 ? totalFundamental / validFundamentalCount : 0;
  const avgIndustry = validIndustryCount > 0 ? totalIndustry / validIndustryCount : 0;
  const avgTechnical = validTechnicalCount > 0 ? totalTechnical / validTechnicalCount : 0;

  // 综合评分（加权平均）
  const overallScore = Math.floor(
    (avgMarketSentiment * 0.15) +
    (avgPolicyGuidance * 0.15) +
    (avgCapitalFlow * 0.25) +
    (avgFundamental * 0.20) +
    (avgIndustry * 0.15) +
    (avgTechnical * 0.10)
  );

  return {
    overall_score: overallScore,
    market_sentiment_score: Math.floor(avgMarketSentiment),
    policy_guidance_score: Math.floor(avgPolicyGuidance),
    capital_flow_score: Math.floor(avgCapitalFlow),
    fundamental_metrics_score: Math.floor(avgFundamental),
    industry_factors_score: Math.floor(avgIndustry),
    technical_indicators_score: Math.floor(avgTechnical),
  };
}

/**
 * 生成多维度优化建议
 */
function generateMultiDimensionalRecommendations(
  scores: LearningScore,
  factors: Record<string, MultiDimensionalLearningRecord>
): string[] {
  const recommendations: string[] = [];

  // 市场情绪建议
  if (scores.market_sentiment_score > 70) {
    recommendations.push('市场情绪活跃，重点关注高热度股票');
  } else if (scores.market_sentiment_score < 30) {
    recommendations.push('市场情绪低迷，建议谨慎操作');
  }

  // 政策指引建议
  if (scores.policy_guidance_score > 70) {
    recommendations.push('政策利好明显，重点关注政策相关板块');
  } else if (scores.policy_guidance_score < 30) {
    recommendations.push('缺乏政策支持，需注意政策风险');
  }

  // 资金流向建议
  if (scores.capital_flow_score > 70) {
    recommendations.push('主力资金大幅流入，可考虑跟随布局');
  } else if (scores.capital_flow_score < 30) {
    recommendations.push('资金流出严重，建议观望或减仓');
  }

  // 基本面建议
  if (scores.fundamental_metrics_score > 70) {
    recommendations.push('基本面优秀，可中长期持有');
  } else if (scores.fundamental_metrics_score < 30) {
    recommendations.push('基本面较弱，需注意估值风险');
  }

  // 行业建议
  if (scores.industry_factors_score > 70) {
    recommendations.push('行业景气度高，重点关注龙头股');
  } else if (scores.industry_factors_score < 30) {
    recommendations.push('行业景气度低，建议回避');
  }

  // 技术指标建议
  if (scores.technical_indicators_score > 70) {
    recommendations.push('技术面强势，可考虑逢低买入');
  } else if (scores.technical_indicators_score < 30) {
    recommendations.push('技术面弱势，建议等待企稳');
  }

  // 综合建议
  if (scores.overall_score > 70) {
    recommendations.push('综合评分优秀，建议积极配置');
  } else if (scores.overall_score < 40) {
    recommendations.push('综合评分较低，建议谨慎操作');
  }

  return recommendations;
}

/**
 * 保存多维度学习记录
 */
async function saveMultiDimensionalLearningRecords(
  stocks: any[],
  factors: Record<string, MultiDimensionalLearningRecord>,
  strategyType: string
): Promise<void> {
  const client = getSupabaseClient();

  for (const stock of stocks) {
    const code = stock.stock_code;
    const factor = factors[code];

    if (!factor) continue;

    try {
      // 更新 tonghuashun_strategies 表
      await client
        .from('tonghuashun_strategies')
        .update({
          market_sentiment: factor.market_sentiment,
          policy_guidance: factor.policy_guidance,
          capital_flow: factor.capital_flow,
          fundamental_metrics: factor.fundamental_metrics,
          industry_factors: factor.industry_factors,
          advanced_indicators: factor.advanced_indicators,
          updated_at: new Date().toISOString(),
        })
        .eq('stock_code', code);

      console.log(`已保存股票 ${code} 的多维度学习记录`);
    } catch (error) {
      console.error(`保存股票 ${code} 的学习记录失败:`, error);
    }
  }

  // 保存整体学习记录
  try {
    const scores = calculateAverageScores(factors);
    const recommendations = generateMultiDimensionalRecommendations(scores, factors);

    await client
      .from('tonghuashun_learning_records')
      .insert({
        strategy_type: strategyType,
        analyze_date: new Date().toISOString(),
        stock_count: Object.keys(factors).length,
        market_sentiment: scores.market_sentiment_score,
        policy_guidance: scores.policy_guidance_score,
        capital_flow: scores.capital_flow_score,
        fundamental_metrics: scores.fundamental_metrics_score,
        industry_factors: scores.industry_factors_score,
        advanced_indicators: scores.technical_indicators_score,
        learning_score: scores.overall_score,
        recommendations,
        is_applied: false,
      });

    console.log('整体学习记录已保存');
  } catch (error) {
    console.error('保存整体学习记录失败:', error);
  }
}

/**
 * 获取股票的多维度学习记录
 */
export async function getMultiDimensionalLearningRecord(code: string): Promise<MultiDimensionalLearningRecord | null> {
  const client = getSupabaseClient();

  try {
    const { data, error } = await client
      .from('tonghuashun_strategies')
      .select('*')
      .eq('stock_code', code)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      market_sentiment: data.market_sentiment,
      policy_guidance: data.policy_guidance,
      capital_flow: data.capital_flow,
      fundamental_metrics: data.fundamental_metrics,
      industry_factors: data.industry_factors,
      advanced_indicators: data.advanced_indicators,
    };
  } catch (error) {
    console.error(`获取股票 ${code} 的学习记录失败:`, error);
    return null;
  }
}

/**
 * 实时更新多维度因子
 */
export async function updateMultiDimensionalFactors(code: string): Promise<MultiDimensionalLearningRecord | null> {
  try {
    const factors: MultiDimensionalLearningRecord = {
      market_sentiment: await getMarketSentimentFactor(code),
      policy_guidance: await getPolicyGuidanceFactor(code),
      capital_flow: await getCapitalFlowFactor(code),
      fundamental_metrics: await getFundamentalMetricsFactor(code),
      industry_factors: await getIndustryFactorsFactor(code),
      advanced_indicators: null,
    };

    // 获取K线数据计算技术指标
    const klines = await getKLineData(code, '101');
    const { getAdvancedIndicatorsFactor } = await import('@/lib/multidimensional-analysis');
    factors.advanced_indicators = await getAdvancedIndicatorsFactor(klines);

    return factors;
  } catch (error) {
    console.error(`更新股票 ${code} 的多维度因子失败:`, error);
    return null;
  }
}
