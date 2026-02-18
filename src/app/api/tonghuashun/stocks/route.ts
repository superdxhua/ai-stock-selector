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

    // 获取股票实时数据
    const stockList = await getStockList();
    const stockData = stockList.find(s => s.f12 === code);

    if (!stockData) {
      return NextResponse.json({
        success: false,
        error: '未找到股票数据',
      }, { status: 404 });
    }

    const formatted = formatStockData(stockData);

    // 插入数据库
    const { data, error } = await client
      .from('tonghuashun_strategies')
      .insert({
        stock_code: code,
        stock_name: name,
        strategy_type: strategyType,
        reason,
        source,
        price: formatted.price,
        change_percent: formatted.changePercent,
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
