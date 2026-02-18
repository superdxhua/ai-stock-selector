/**
 * 同花顺策略逆向分析与自学习
 * 
 * 功能：
 * 1. 分析同花顺策略中的股票特征
 * 2. 逆向推导选股逻辑
 * 3. 优化自身策略评分标准
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getKLineData, getStockList } from '@/lib/stock-data';
import { performTechnicalAnalysis } from '@/lib/indicators';

interface FeatureAnalysis {
  avgConsecutiveRises: number;
  avg5DayChange: number;
  avgLimitUpRatio: number;
  avgVolumeRatio: number;
  avgPriceAboveCYC: number;
  avgMACDGoldenCross: number;
  commonFeatures: string[];
}

/**
 * POST /api/tonghuashun/analyze - 逆向分析同花顺策略
 * 请求体: { strategyType } (5day-trend | 5day-volume)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyType } = body;

    if (!strategyType) {
      return NextResponse.json({
        success: false,
        error: '缺少 strategyType 参数',
      }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 获取同花顺策略股票
    const { data: tonghuashunStocks, error } = await client
      .from('tonghuashun_strategies')
      .select('*')
      .eq('strategy_type', strategyType);

    if (error || !tonghuashunStocks || tonghuashunStocks.length === 0) {
      return NextResponse.json({
        success: false,
        error: '未找到同花顺策略股票',
      }, { status: 404 });
    }

    console.log(`开始分析 ${tonghuashunStocks.length} 只同花顺策略股票...`);

    // 分析股票特征
    const features: FeatureAnalysis = {
      avgConsecutiveRises: 0,
      avg5DayChange: 0,
      avgLimitUpRatio: 0,
      avgVolumeRatio: 0,
      avgPriceAboveCYC: 0,
      avgMACDGoldenCross: 0,
      commonFeatures: [],
    };

    let totalConsecutiveRises = 0;
    let total5DayChange = 0;
    let totalLimitUpCount = 0;
    let totalVolumeRatio = 0;
    let totalPriceAboveCYCCount = 0;
    let totalMACDGoldenCrossCount = 0;

    const batchSize = 5;
    const analyzedStocks: any[] = [];

    for (let i = 0; i < tonghuashunStocks.length; i += batchSize) {
      const batch = tonghuashunStocks.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (stock) => {
          try {
            const klines = await getKLineData(stock.stock_code, '101');

            if (klines.length >= 35) {
              const analysis = performTechnicalAnalysis(klines, stock.stock_code);

              // 累计特征
              totalConsecutiveRises += analysis.consecutiveRises;
              total5DayChange += analysis.price5DayChange;
              if (analysis.hasLimitUp) totalLimitUpCount++;
              
              const volumeRatio = analysis.volume20DayAvg > 0 
                ? analysis.volume5DayAvg / analysis.volume20DayAvg 
                : 0;
              totalVolumeRatio += volumeRatio;
              
              if (analysis.priceAboveCYC) totalPriceAboveCYCCount++;
              if (analysis.macdGoldenCross) totalMACDGoldenCrossCount++;

              analyzedStocks.push({
                code: stock.stock_code,
                name: stock.stock_name,
                analysis,
              });

              console.log(`  ${stock.stock_code} ${stock.stock_name}: 连涨${analysis.consecutiveRises}天, 5日涨幅${analysis.price5DayChange.toFixed(2)}%, 涨停:${analysis.hasLimitUp}`);
            }
          } catch (error) {
            console.error(`分析股票 ${stock.stock_code} 失败:`, error);
          }
        })
      );

      // 批次间延迟
      if (i + batchSize < tonghuashunStocks.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 计算平均值
    const count = analyzedStocks.length;
    if (count > 0) {
      features.avgConsecutiveRises = totalConsecutiveRises / count;
      features.avg5DayChange = total5DayChange / count;
      features.avgLimitUpRatio = totalLimitUpCount / count;
      features.avgVolumeRatio = totalVolumeRatio / count;
      features.avgPriceAboveCYC = totalPriceAboveCYCCount / count;
      features.avgMACDGoldenCross = totalMACDGoldenCrossCount / count;
    }

    // 提取共同特征
    features.commonFeatures = [];
    if (features.avgLimitUpRatio > 0.5) features.commonFeatures.push('高频涨停');
    if (features.avgConsecutiveRises > 2) features.commonFeatures.push('连续上涨');
    if (features.avg5DayChange > 5) features.commonFeatures.push('5日涨幅显著');
    if (features.avgVolumeRatio > 2) features.commonFeatures.push('成交量放大');
    if (features.avgPriceAboveCYC > 0.5) features.commonFeatures.push('收盘价高于CYC');
    if (features.avgMACDGoldenCross > 0.5) features.commonFeatures.push('MACD金叉');

    // 更新数据库中的学习特征
    if (count > 0) {
      await client
        .from('tonghuashun_strategies')
        .update({
          learned_features: features,
          updated_at: new Date().toISOString(),
        })
        .eq('strategy_type', strategyType);
    }

    return NextResponse.json({
      success: true,
      data: {
        strategyType,
        analyzedCount: count,
        features,
        recommendations: generateRecommendations(features, strategyType),
      },
      message: '分析完成',
    });
  } catch (error) {
    console.error('分析失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误',
    }, { status: 500 });
  }
}

/**
 * 生成优化建议
 */
function generateRecommendations(features: FeatureAnalysis, strategyType: string): string[] {
  const recommendations: string[] = [];

  if (strategyType === '5day-trend') {
    // 5日趋势核心策略建议
    if (features.avgLimitUpRatio > 0.8) {
      recommendations.push('提高涨停板评分权重，建议从25分提升到30分');
    }
    if (features.avgVolumeRatio > 3) {
      recommendations.push('提高成交量评分门槛，建议5日/20日均量比≥3倍给予满分');
    }
    if (features.avgPriceAboveCYC > 0.7) {
      recommendations.push('CYC因子有效，建议维持或提高CYC评分权重');
    }
  } else if (strategyType === '5day-volume') {
    // 5日容量核心策略建议
    if (features.avgVolumeRatio > 4) {
      recommendations.push('成交量是核心因子，建议继续提高成交量评分权重');
    }
    if (features.avgMACDGoldenCross > 0.6) {
      recommendations.push('MACD金叉对容量策略有显著影响，建议增加MACD因子');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('当前策略评分标准合理，无需调整');
  }

  return recommendations;
}
