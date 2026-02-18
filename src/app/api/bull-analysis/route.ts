/**
 * 大牛股复盘和分析API
 * 
 * 功能：
 * 1. 扫描当前股票池，识别具有大牛股潜力的股票
 * 2. 分析每只股票的大牛股特征
 * 3. 推荐应纳入哪些策略
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStockList, getKLineData } from '@/lib/stock-data';
import { filterStocks } from '@/lib/stock-filter';
import { performEnhancedTechnicalAnalysis, filterBullPotentialStocks, generateBullFeatureSummary } from '@/lib/bull-integration';

/**
 * GET /api/bull-analysis - 大牛股潜力分析
 * 
 * 查询参数：
 * - minScore: 最低大牛股评分（默认60）
 * - limit: 返回数量限制（默认20）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minScore = parseInt(searchParams.get('minScore') || '60');
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log(`开始大牛股潜力分析，最低评分: ${minScore}，限制: ${limit}`);

    // 1. 获取股票列表
    let stockList = await getStockList();

    if (!stockList || stockList.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: '未获取到股票数据',
      });
    }

    console.log(`获取到 ${stockList.length} 只股票`);

    // 2. 过滤不适合投资的股票
    stockList = filterStocks(stockList);
    console.log(`过滤后剩余 ${stockList.length} 只股票`);

    // 3. 分析前100只股票的大牛股特征
    const targetStocks = stockList.slice(0, 100);
    console.log(`分析 ${targetStocks.length} 只股票的大牛股特征`);

    const analyzedStocks = [];

    // 限制并发请求数量
    const batchSize = 5;

    for (let i = 0; i < targetStocks.length; i += batchSize) {
      const batch = targetStocks.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (stock) => {
          try {
            // 获取K线数据
            const klines = await getKLineData(stock.f12, '101');

            if (klines.length >= 35) {
              // 进行增强技术分析（包含大牛股特征）
              const enhancedAnalysis = performEnhancedTechnicalAnalysis(klines, stock);

              // 只保留符合大牛股潜力的股票
              if (enhancedAnalysis.bullScore >= minScore && enhancedAnalysis.isBullPotential) {
                analyzedStocks.push({
                  code: stock.f12,
                  name: stock.f14,
                  price: stock.f4,
                  changePercent: stock.f3,
                  marketCap: stock.f20,
                  volume: stock.f7 * 100,
                  turnoverRate: stock.f18,
                  bullScore: enhancedAnalysis.bullScore,
                  bullPotential: enhancedAnalysis.bullPotential,
                  isBullPotential: enhancedAnalysis.isBullPotential,
                  recommendedStrategies: enhancedAnalysis.recommendedStrategies,
                  bullFeatures: enhancedAnalysis.bullFeatures,
                  trendScore: enhancedAnalysis.trendScore,
                  volumeScore: enhancedAnalysis.volumeScore,
                  leaderScore: enhancedAnalysis.leaderScore,
                  featureSummary: generateBullFeatureSummary(enhancedAnalysis.bullFeatures),
                  matchedFeatures: enhancedAnalysis.bullFeatures.matchedFeatures,
                });
              }
            }
          } catch (error) {
            console.error(`分析股票 ${stock.f12} ${stock.f14} 失败:`, error);
          }
        })
      );

      // 批次间延迟
      if (i + batchSize < targetStocks.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`分析完成，发现 ${analyzedStocks.length} 只符合大牛股潜力的股票`);

    // 4. 按大牛股评分排序
    analyzedStocks.sort((a, b) => b.bullScore - a.bullScore);

    // 5. 限制返回数量
    const result = analyzedStocks.slice(0, limit);

    // 6. 统计分析
    const statistics = {
      totalAnalyzed: targetStocks.length,
      bullPotentialCount: analyzedStocks.length,
      highPotential: analyzedStocks.filter(s => s.bullScore >= 80).length,
      mediumPotential: analyzedStocks.filter(s => s.bullScore >= 60 && s.bullScore < 80).length,
      lowPotential: analyzedStocks.filter(s => s.bullScore >= 40 && s.bullScore < 60).length,
      recommendedTrend: analyzedStocks.filter(s => s.recommendedStrategies.includes('5day-trend')).length,
      recommendedVolume: analyzedStocks.filter(s => s.recommendedStrategies.includes('5day-volume')).length,
      recommendedLeader: analyzedStocks.filter(s => s.recommendedStrategies.includes('leader')).length,
    };

    return NextResponse.json({
      success: true,
      data: result,
      statistics,
      count: result.length,
      minScore,
    });
  } catch (error) {
    console.error('大牛股分析失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '大牛股分析失败',
        data: [],
      },
      { status: 500 }
    );
  }
}
