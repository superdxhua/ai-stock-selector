import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/stocks - 获取所有股票或策略筛选的股票
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get('strategy');

    // 获取所有股票
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 如果没有策略，只返回基础信息
    if (!strategy || strategy === 'all') {
      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    // 对于策略筛选，添加模拟的实时数据
    const stocksWithRealTimeData = (data || []).map((stock) => {
      // 生成随机价格数据
      const basePrice = Math.random() * 50 + 10; // 10-60之间的基础价格
      const change = (Math.random() - 0.5) * 5; // -2.5 到 +2.5
      const changePercent = (change / basePrice) * 100;
      const volume = Math.floor(Math.random() * 500000000) + 10000000; // 1000万-5亿
      const marketCap = basePrice * (Math.random() * 100000000 + 50000000); // 市值

      // 根据策略生成评分
      let trendScore = 0;
      let volumeScore = 0;
      let leaderScore = 0;

      if (strategy === '5day-trend') {
        trendScore = Math.floor(Math.random() * 50) + 50; // 50-100
        volumeScore = Math.floor(Math.random() * 100);
        leaderScore = Math.floor(Math.random() * 100);
      } else if (strategy === '5day-volume') {
        volumeScore = Math.floor(Math.random() * 50) + 50; // 50-100
        trendScore = Math.floor(Math.random() * 100);
        leaderScore = Math.floor(Math.random() * 100);
      } else if (strategy === 'leader') {
        leaderScore = Math.floor(Math.random() * 50) + 50; // 50-100
        trendScore = Math.floor(Math.random() * 100);
        volumeScore = Math.floor(Math.random() * 100);
      }

      return {
        ...stock,
        price: Number(basePrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        volume,
        marketCap: Math.floor(marketCap),
        trendScore,
        volumeScore,
        leaderScore,
      };
    });

    // 根据策略排序
    let sortedStocks = stocksWithRealTimeData;
    if (strategy === '5day-trend') {
      sortedStocks.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
    } else if (strategy === '5day-volume') {
      sortedStocks.sort((a, b) => (b.volumeScore || 0) - (a.volumeScore || 0));
    } else if (strategy === 'leader') {
      sortedStocks.sort((a, b) => (b.leaderScore || 0) - (a.leaderScore || 0));
    }

    // 对于策略，只返回评分≥50的股票
    const filteredStocks = sortedStocks.filter((stock) => {
      if (strategy === '5day-trend') return (stock.trendScore || 0) >= 50;
      if (strategy === '5day-volume') return (stock.volumeScore || 0) >= 50;
      if (strategy === 'leader') return (stock.leaderScore || 0) >= 50;
      return true;
    });

    return NextResponse.json({
      success: true,
      data: filteredStocks,
    });
  } catch (error) {
    console.error('Get stocks error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stocks - 添加新股票
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, sector, description } = body;

    // 验证必填字段
    if (!code || !name || !sector) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: code, name, sector' },
        { status: 400 }
      );
    }

    // 验证股票代码格式（6位数字）
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Stock code must be 6 digits' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('stocks')
      .insert([
        {
          code,
          name,
          sector,
          description: description || null,
        },
      ])
      .select()
      .single();

    if (error) {
      // 检查是否是唯一约束错误
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Stock code already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 });
  } catch (error) {
    console.error('Create stock error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
