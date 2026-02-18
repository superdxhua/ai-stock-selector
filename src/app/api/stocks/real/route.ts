/**
 * 东方财富数据源API
 *
 * 数据来源：东方财富 (https://www.eastmoney.com)
 * 默认接入：实时股票行情数据
 * 策略支持：5日趋势核心、5日容量核心、龙头精选
 *
 * 注意：
 * - 此API仅获取和分析前30只股票数据，避免API限流
 * - 自动过滤：科创板（688开头）、ST股票
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStockList, getKLineData, COMMON_STOCKS, formatStockData } from '@/lib/stock-data';
import { performTechnicalAnalysis } from '@/lib/indicators';
import { filterStocks } from '@/lib/stock-filter';
import { performEnhancedTechnicalAnalysis, enhanceStrategyScores } from '@/lib/bull-integration';
import { filterHotSectorStocks } from '@/lib/hot-sectors';

interface StockWithScore {
  code: string;
  name: string;
  sector?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  amount?: number; // 成交额（万元）
  trendScore?: number;
  volumeScore?: number;
  leaderScore?: number;
  // 技术分析数据
  technicalAnalysis?: {
    consecutiveRises: number;
    price5DayChange: number;
    hasLimitUp: boolean;
    isOneSidedLimitUp?: boolean;
    macdGoldenCross: boolean;
    volumeIncreasing: boolean;
    priceVolumeCorrelation: number;
  };
}

/**
 * GET /api/stocks/real - 获取真实股票数据
 * 支持策略筛选参数: strategy=5day-trend|5day-volume|leader
 * 默认策略: 5day-trend
 *
 * 注意：自动过滤以下类型股票
 * - 科创板（688开头）
 * - 北交所（830/831/832开头）
 * - ST股票（包含ST或*ST）
 * - 退市风险股票（包括退市整理期、暂停上市、终止上市、风险警示等）
 * - 停牌股票
 * - 其他特殊处理股票
 * - 市值700亿元以上的股票
 * - 市值40亿元以下的股票
 * - 成交额30万元以下的股票（f17字段，单位：万元，可根据实际情况调整）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get('strategy') || '5day-trend';

    console.log(`开始获取股票数据，策略: ${strategy}`);

    // 获取股票列表
    let stockList = await getStockList();

    if (!stockList || stockList.length === 0) {
      console.warn('未获取到股票数据');
      return NextResponse.json({
        success: true,
        data: [],
        message: '未获取到股票数据',
      });
    }

    console.log(`获取到 ${stockList.length} 只股票（含科创板和ST）`);

    // 调试：打印前5只股票的市值
    console.log(`市值样本（前5只）：`);
    stockList.slice(0, 5).forEach(stock => {
      const marketCap = stock.f20 || 0;
      console.log(`  ${stock.f12} ${stock.f14}: f20=${marketCap}, 市值=${(marketCap / 100000000).toFixed(2)}亿元`);
    });

    // 过滤科创板和ST股票
    console.log(`开始过滤股票...`);
    stockList = filterStocks(stockList);
    console.log(`过滤后剩余 ${stockList.length} 只股票（已排除科创板和ST）`);

    // 热点板块筛选（所有策略都使用热点板块）
    console.log('开始热点板块筛选...');
    stockList = await filterHotSectorStocks(stockList, 20); // 从前20个热点板块筛选
    console.log(`热点板块筛选后剩余 ${stockList.length} 只股票`);

    // 统一分析前50只股票（所有策略共享数据池）
    // 这样可以确保龙头精选的股票确实在趋势池和容量池中
    let targetStocks = stockList.slice(0, 50);
    console.log(`策略筛选，统一分析50只股票`);

    // 转换数据格式
    let stocks: StockWithScore[] = targetStocks.map(stock => {
      const formatted = formatStockData(stock);

      return {
        code: formatted.code,
        name: formatted.name,
        price: formatted.price,
        change: formatted.change,
        changePercent: formatted.changePercent,
        volume: formatted.volume,
        marketCap: formatted.marketCap,
        amount: formatted.amount, // 添加成交额字段
      };
    });

    // 获取K线数据并进行技术分析
    if (stocks.length > 0) {
      console.log('开始获取K线数据进行技术分析...');

      // 限制并发请求数量，避免API限流
      const batchSize = 5;
      const analyzedStocks: StockWithScore[] = [];

      for (let i = 0; i < stocks.length; i += batchSize) {
        const batch = stocks.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (stock) => {
            try {
              // 获取日K线数据（至少需要35天数据）
              const klines = await getKLineData(stock.code, '101');

              if (klines.length >= 35) {
                const analysis = performTechnicalAnalysis(klines);

                stock.trendScore = analysis.trendScore;
                stock.volumeScore = analysis.volumeScore;
                stock.leaderScore = analysis.leaderScore;
                stock.technicalAnalysis = {
                  consecutiveRises: analysis.consecutiveRises,
                  price5DayChange: analysis.price5DayChange,
                  hasLimitUp: analysis.hasLimitUp,
                  isOneSidedLimitUp: analysis.isOneSidedLimitUp,
                  macdGoldenCross: analysis.macdGoldenCross,
                  volumeIncreasing: analysis.volumeIncreasing,
                  priceVolumeCorrelation: analysis.priceVolumeCorrelation,
                };

                console.log(`股票 ${stock.code} ${stock.name} 分析完成: 趋势=${analysis.trendScore}, 容量=${analysis.volumeScore}, 龙头=${analysis.leaderScore}${analysis.isOneSidedLimitUp ? ' [一字板]' : ''}`);
              } else {
                console.warn(`股票 ${stock.code} ${stock.name} K线数据不足，跳过分析`);
              }
            } catch (error) {
              console.error(`分析股票 ${stock.code} ${stock.name} 失败:`, error);
              // 分析失败时给予默认低分
              stock.trendScore = 0;
              stock.volumeScore = 0;
              stock.leaderScore = 0;
            }
          })
        );

        analyzedStocks.push(...batch);

        // 批次间延迟，避免请求过快
        if (i + batchSize < stocks.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      stocks = analyzedStocks;

      // 根据策略排序和筛选
      let sortedStocks = stocks;
      if (strategy === '5day-trend') {
        sortedStocks.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
        console.log(`5日趋势核心排序完成，最高分: ${sortedStocks[0]?.trendScore}`);
      } else if (strategy === '5day-volume') {
        sortedStocks.sort((a, b) => (b.volumeScore || 0) - (a.volumeScore || 0));
        console.log(`5日容量核心排序完成，最高分: ${sortedStocks[0]?.volumeScore}`);
      } else if (strategy === 'leader') {
        console.log(`龙头精选策略：优中选优`);
        // 龙头精选策略：从5日趋势核心和5日容量核心两个池子中优中选优
        // 第一步：筛选出趋势池和容量池
        const trendPool = stocks.filter(stock => (stock.trendScore || 0) >= 50);
        const volumePool = stocks.filter(stock => (stock.volumeScore || 0) >= 50);

        console.log(`  - 趋势池（trendScore >= 50）: ${trendPool.length} 只`);
        console.log(`  - 容量池（volumeScore >= 50）: ${volumePool.length} 只`);

        // 第二步：合并两个池子，去重
        const poolMap = new Map();
        trendPool.forEach(stock => poolMap.set(stock.code, stock));
        volumePool.forEach(stock => poolMap.set(stock.code, stock));

        const combinedPool = Array.from(poolMap.values());
        console.log(`  - 合并池: ${combinedPool.length} 只`);

        if (combinedPool.length === 0) {
          // 如果没有股票达到标准，则选择综合评分最高的
          console.log(`  - 警告：无股票达到标准，选择综合评分最高的`);
          sortedStocks.sort((a, b) => {
            const scoreA = (a.trendScore || 0) + (a.volumeScore || 0) + (a.leaderScore || 0);
            const scoreB = (b.trendScore || 0) + (b.volumeScore || 0) + (b.leaderScore || 0);
            return scoreB - scoreA;
          });
        } else {
          // 第三步：从合并池中优中选优
          // 计算综合评分 = trendScore * 0.4 + volumeScore * 0.3 + leaderScore * 0.3
          combinedPool.forEach(stock => {
            const trendScore = stock.trendScore || 0;
            const volumeScore = stock.volumeScore || 0;
            const leaderScore = stock.leaderScore || 0;
            stock.leaderScore = Math.round(trendScore * 0.4 + volumeScore * 0.3 + leaderScore * 0.3);
          });

          sortedStocks = combinedPool;
          sortedStocks.sort((a, b) => (b.leaderScore || 0) - (a.leaderScore || 0));

          console.log(`  - 综合评分排序完成，最高分: ${sortedStocks[0]?.leaderScore}`);
        }

        // 龙头精选只返回前3只
        sortedStocks = sortedStocks.slice(0, 3);
        console.log(`龙头精选筛选完成，返回前3只优中选优股票`);
      }

      // 过滤评分≥50的股票（除了龙头精选，龙头精选已经取了前3只）
      if (strategy !== 'leader') {
        const filteredStocks = sortedStocks.filter(stock => {
          if (strategy === '5day-trend') return (stock.trendScore || 0) >= 50;
          if (strategy === '5day-volume') return (stock.volumeScore || 0) >= 50;
          return true;
        });
        console.log(`过滤评分≥50的股票，结果: ${filteredStocks.length} 只`);
        stocks = filteredStocks;
      } else {
        stocks = sortedStocks;
      }
    }

    console.log(`返回 ${stocks.length} 只股票数据`);

    return NextResponse.json({
      success: true,
      data: stocks,
      count: stocks.length,
      strategy,
    });
  } catch (error) {
    console.error('获取股票数据失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取股票数据失败',
        data: [],
      },
      { status: 500 }
    );
  }
}
