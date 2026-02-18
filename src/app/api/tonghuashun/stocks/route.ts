/**
 * 同花顺策略管理API
 * 
 * 功能：
 * 1. 获取同花顺策略股票列表
 * 2. 添加股票到同花顺策略
 * 3. 删除股票
 * 4. 逆向分析同花顺策略
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getStockList, formatStockData } from '@/lib/stock-data';
import { performTechnicalAnalysis } from '@/lib/indicators';

/**
 * GET /api/tonghuashun/stocks - 获取同花顺策略股票列表
 * 支持参数: strategyType (5day-trend | 5day-volume)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategyType = searchParams.get('strategyType') || 'all';

    const client = getSupabaseClient();

    // 查询同花顺策略股票
    let query = client
      .from('tonghuashun_strategies')
      .select('*')
      .order('added_at', { ascending: false });

    if (strategyType !== 'all') {
      query = query.eq('strategy_type', strategyType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('查询同花顺策略股票失败:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('获取同花顺策略股票失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误',
    }, { status: 500 });
  }
}

/**
 * POST /api/tonghuashun/stocks - 添加股票到同花顺策略
 * 请求体: { code, name, strategyType, reason?, source? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, strategyType, reason, source = 'manual' } = body;

    // 验证必填字段
    if (!code || !name || !strategyType) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段: code, name, strategyType',
      }, { status: 400 });
    }

    // 验证策略类型
    if (!['5day-trend', '5day-volume'].includes(strategyType)) {
      return NextResponse.json({
        success: false,
        error: '策略类型必须是 5day-trend 或 5day-volume',
      }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 检查股票是否已存在
    const { data: existing } = await client
      .from('tonghuashun_strategies')
      .select('*')
      .eq('stock_code', code)
      .eq('strategy_type', strategyType)
      .single();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: '该股票已在此策略中',
      }, { status: 400 });
    }

    // 获取股票实时数据（不依赖策略池，直接从东方财富获取）
    // 使用多页方式搜索股票
    let stockData = null;
    let page = 1;
    const pageSize = 100;
    let maxPages = 56; // 5507 / 100 ≈ 55，取56页

    while (page <= maxPages && !stockData) {
      const params = new URLSearchParams({
        pn: page.toString(),
        pz: pageSize.toString(),
        po: "1",
        np: "1",
        fltt: "2",
        invt: "2",
        fid: "f12", // 按代码排序
        fs: "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23",
        fields: "f12,f14,f2,f3",
      });

      const stockListResponse = await fetch(`https://push2.eastmoney.com/api/qt/clist/get?${params}`);
      const stockListData = await stockListResponse.json();

      if (stockListData && stockListData.data && stockListData.data.diff) {
        stockData = stockListData.data.diff.find((s: any) => s.f12 === code);
        if (stockData) {
          break;
        }
      }

      page++;
    }

    if (!stockData) {
      return NextResponse.json({
        success: false,
        error: '未找到股票数据',
      }, { status: 404 });
    }

    const price = stockData.f2 || 0;
    const changePercent = stockData.f3 || 0;

    // 插入数据库
    const { data, error } = await client
      .from('tonghuashun_strategies')
      .insert({
        stock_code: code,
        stock_name: name,
        strategy_type: strategyType,
        reason,
        source,
        price: price,
        change_percent: changePercent,
      })
      .select()
      .single();

    if (error) {
      console.error('添加股票失败:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '股票添加成功',
    });
  } catch (error) {
    console.error('添加股票失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误',
    }, { status: 500 });
  }
}
