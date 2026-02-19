/**
 * 获取股票名称API
 * 
 * 用于根据股票代码获取股票名称，不依赖策略池
 * 支持主动添加任意股票到同花顺策略
 */

import { NextRequest, NextResponse } from 'next/server';

const EASTMONEY_API = {
  stockInfo: "https://push2.eastmoney.com/api/qt/ulist.np/get",
};

/**
 * 根据股票代码推断市场ID
 * 600xxx, 601xxx, 603xxx, 605xxx: 沪市 (1)
 * 688xxx: 科创板 (1)
 * 000xxx, 001xxx, 002xxx, 003xxx: 深市 (0)
 * 300xxx: 创业板 (0)
 */
function getMarketId(code: string): string {
  const firstChar = code.charAt(0);
  const secondChar = code.charAt(1);
  
  // 6开头（科创板也是6开头，但都在沪市）
  if (firstChar === '6') {
    return '1';
  }
  
  // 0, 1, 2, 3开头（深市主板、创业板）
  if (['0', '1', '2', '3'].includes(firstChar)) {
    return '0';
  }
  
  // 4, 8开头（北交所）
  if (['4', '8'].includes(firstChar)) {
    return '0'; // 北交所暂时归为深市
  }
  
  // 默认为沪市
  return '1';
}

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

    // 验证是否为纯数字
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({
        success: false,
        error: '股票代码必须是6位数字',
      }, { status: 400 });
    }

    // 推断市场ID
    const marketId = getMarketId(code);
    const secid = `${marketId}.${code}`;

    // 调用东方财富API获取股票信息
    const params = new URLSearchParams({
      fltt: "2",
      invt: "2",
      fs: "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81,m:1+t:13", // 扩大搜索范围
      fields: "f12,f14",
      secids: secid,
    });

    const response = await fetch(`${EASTMONEY_API.stockInfo}?${params}`);
    const data = await response.json();

    if (data && data.data && data.data.diff && data.data.diff.length > 0) {
      const stock = data.data.diff[0];
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
