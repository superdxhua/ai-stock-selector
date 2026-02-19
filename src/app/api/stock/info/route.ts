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
 * GET /api/stock/info?code=603466 或 /api/stock/info?name=平安银行
 * 获取股票信息（支持代码或名称查询）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const name = searchParams.get('name');

    // 支持股票代码查询
    if (code) {
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
        fs: "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81,m:1+t:13",
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
    }

    // 支持股票名称查询
    if (name) {
      if (name.length < 2) {
        return NextResponse.json({
          success: false,
          error: '请输入至少2个字符的股票名称',
        }, { status: 400 });
      }

      // 使用腾讯财经搜索API
      console.log("开始搜索股票名称:", name);
      const response = await fetch(`https://smartbox.gtimg.cn/s3/?q=${encodeURIComponent(name)}&t=all&c=1`);
      const text = await response.text();
      console.log("搜索结果:", text);
      
      // 解析返回的数据
      // 格式: v_hint="sh~600519~贵州茅台~gzmt~GP-A^sh~600903~贵州燃气~gzrq~GP-A^..."
      const match = text.match(/v_hint="(.+)"/);
      
      console.log("匹配结果:", match);
      
      if (match && match[1]) {
        const stocks = match[1].split('^').map((item: string) => {
          const parts = item.split('~');
          return {
            market: parts[0], // sh/sz/hk
            code: parts[1],
            name: parts[2],
            pinyin: parts[3],
            type: parts[4],
          };
        }).filter((stock: any) => {
          // 只返回A股（排除港股）
          return stock.market === 'sh' || stock.market === 'sz';
        });

        console.log("过滤后的股票:", stocks);

        if (stocks.length === 0) {
          return NextResponse.json({
            success: false,
            error: '未找到匹配的股票，请检查名称是否正确',
          });
        }

        // 如果只有一个精确匹配，返回单只股票
        const exactMatch = stocks.find((s: any) => s.name === name);
        if (exactMatch) {
          console.log("精确匹配:", exactMatch);
          return NextResponse.json({
            success: true,
            data: {
              code: exactMatch.code,
              name: exactMatch.name,
            },
          });
        }

        // 返回所有匹配的股票（用于用户选择）
        console.log("返回匹配列表:", stocks.map((s: any) => ({ code: s.code, name: s.name })));
        return NextResponse.json({
          success: true,
          data: {
            matches: stocks.map((s: any) => ({
              code: s.code,
              name: s.name,
            })),
          },
        });
      }

      return NextResponse.json({
        success: false,
        error: '未找到匹配的股票，请检查名称是否正确',
      });
    }

    return NextResponse.json({
      success: false,
      error: '请提供股票代码或股票名称',
    }, { status: 400 });
  } catch (error) {
    console.error('获取股票信息失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取股票信息失败，请稍后重试',
    }, { status: 500 });
  }
}
