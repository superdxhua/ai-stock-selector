import { NextRequest, NextResponse } from 'next/server';
import { getRealStockKLine, getRealStockInfo, RealKLineData } from '@/lib/real-data';
import { calculateCYC, calculateMA, calculate5DayTrendScore, calculate5DayVolumeScore } from '@/lib/stock-data';

/**
 * 获取真实股票数据接口
 * GET /api/real-stock?code=600519&days=30
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Stock code is required' },
        { status: 400 }
      );
    }

    const stockCode = code; // TypeScript 类型流保护后，code 是 string
    const days = parseInt(searchParams.get('days') || '30');

    // 获取股票基本信息
    const stockInfo = await getRealStockInfo(stockCode);
    
    // 获取历史K线数据
    const klineData = await getRealStockKLine(stockCode, days);

    if (klineData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch stock data' },
        { status: 500 }
      );
    }

    // 转换为标准K线格式
    const standardKLine = klineData.map((d: RealKLineData) => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
      changePercent: d.changePercent,
    }));

    // 计算CYC指标
    const cyc5 = calculateCYC(standardKLine, 5);
    const cyc13 = calculateCYC(standardKLine, 13);
    const cyc34 = calculateCYC(standardKLine, 34);

    // 计算MA指标
    const closes = standardKLine.map(d => d.close);
    const ma5 = calculateMA(closes, 5);
    const ma10 = calculateMA(closes, 10);
    const ma20 = calculateMA(closes, 20);

    // 计算选股评分
    const trendScore = calculate5DayTrendScore(standardKLine);
    const volumeScore = calculate5DayVolumeScore(standardKLine, standardKLine[standardKLine.length - 1].close);

    return NextResponse.json({
      success: true,
      data: {
        code,
        name: stockInfo?.name || '',
        price: stockInfo?.price || 0,
        change: stockInfo?.change || 0,
        changePercent: stockInfo?.changePercent || 0,
        volume: stockInfo?.volume || 0,
        kline: standardKLine,
        indicators: {
          cyc5,
          cyc13,
          cyc34,
          ma5,
          ma10,
          ma20,
        },
        scores: {
          trendScore,
          volumeScore,
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Real stock API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
