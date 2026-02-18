/**
 * 东方财富数据源API
 * 
 * 数据来源：东方财富 (https://www.eastmoney.com)
 * 默认接入：实时股票行情数据
 * 策略支持：全部股票、5日趋势核心、5日容量核心、龙头精选
 * 
 * 注意：此API仅获取和分析前30只股票数据，避免API限流
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStockList, getKLineData, COMMON_STOCKS, formatStockData } from '@/lib/stock-data';
import { performTechnicalAnalysis } from '@/lib/indicators';

interface StockWithScore {
  code: string;
  name: string;
  sector?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  trendScore?: number;
  volumeScore?: number;
  leaderScore?: number;
  // 技术分析数据
  technicalAnalysis?: {
    consecutiveRises: number;
    price5DayChange: number;
    hasLimitUp: boolean;
    macdGoldenCross: boolean;
    volumeIncreasing: boolean;
    priceVolumeCorrelation: number;
  };
}

/**
 * GET /api/stocks/real - 获取真实股票数据
 * 支持策略筛选参数: strategy=all|5day-trend|5day-volume|leader
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get('strategy') || 'all';

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

    console.log(`获取到 ${stockList.length} 只股票`);

    // 如果是策略筛选，分析获取到的股票
    let targetStocks = stockList;
    if (strategy !== 'all') {
      // 只分析前30只股票，避免API调用过多
      targetStocks = stockList.slice(0, 30);
      console.log(`策略筛选，分析前30只股票`);
    }

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
      };
    });

    // 如果是策略筛选，获取K线数据并进行技术分析
    if (strategy !== 'all' && stocks.length > 0) {
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
                  macdGoldenCross: analysis.macdGoldenCross,
                  volumeIncreasing: analysis.volumeIncreasing,
                  priceVolumeCorrelation: analysis.priceVolumeCorrelation,
                };

                console.log(`股票 ${stock.code} ${stock.name} 分析完成: 趋势=${analysis.trendScore}, 容量=${analysis.volumeScore}, 龙头=${analysis.leaderScore}`);
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
        sortedStocks.sort((a, b) => (b.leaderScore || 0) - (a.leaderScore || 0));
        console.log(`龙头精选排序完成，最高分: ${sortedStocks[0]?.leaderScore}`);

        // 龙头精选只返回前3只
        sortedStocks = sortedStocks.slice(0, 3);
        console.log(`龙头精选筛选完成，返回前3只`);
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
