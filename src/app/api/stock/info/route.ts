/**
 * 获取股票名称API
 * 
 * 用于根据股票代码获取股票名称，不依赖策略池
 * 支持主动添加任意股票到同花顺策略
 */

import { NextRequest, NextResponse } from 'next/server';

const EASTMONEY_API = {
  stockList: "https://push2.eastmoney.com/api/qt/clist/get",
};

/**
 * GET /api/stock/info?code=603466
 * 获取股票名称
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code || code.length !== 6) {
      return NextResponse.json({
        success: false,
        error: '请输入有效的6位股票代码',
      }, { status: 400 });
    }

    // 调用东方财富API获取股票列表
    const params = new URLSearchParams({
      pn: "1",
      pz: "10000", // 获取足够多的股票
      po: "1",
      np: "1",
      fltt: "2",
      invt: "2",
      fid: "f2", // 按价格排序，这样可以获取到更多股票
      fs: "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23",
      fields: "f12,f14",
    });

    const response = await fetch(`${EASTMONEY_API.stockList}?${params}`);
    const data = await response.json();

    if (data && data.data && data.data.diff) {
      const stock = data.data.diff.find((s: any) => s.f12 === code);
      if (stock) {
        return NextResponse.json({
          success: true,
          data: {
            code: stock.f12,
            name: stock.f14,
          },
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: '未找到该股票，请检查代码是否正确',
    });
  } catch (error) {
    console.error('获取股票名称失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取股票名称失败，请稍后重试',
    }, { status: 500 });
  }
}
