/**
 * 跟踪观察API路由
 *
 * 功能：
 * 1. T+1观察 - 获取跟踪股票次日数据
 * 2. T+3观察 - 获取跟踪股票第三日数据并评估
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();
import { getStockRealTimeData } from '@/lib/stock-data-source';

/**
 * POST /api/tracking/observation - 执行跟踪观察
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'T1';

    console.log(`📊 开始执行${type}观察任务`);

    let count = 0;

    if (type === 'T1') {
      // T+1观察：获取跟踪开始后第1天的数据
      const { data: t1Records, error } = await supabase
        .from('stock_tracking')
        .select('*')
        .eq('status', 'tracking')
        .is('t1_price', null);

      if (error) {
        console.error('获取T+1跟踪记录失败:', error);
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 500 }
        );
      }

      console.log(`  → 找到 ${t1Records.length} 条待观察的记录`);

      for (const record of t1Records) {
        try {
          const stockData = await getStockRealTimeData(record.stock_code);

          if (stockData) {
            const { error: updateError } = await supabase
              .from('stock_tracking')
              .update({
                t1_price: stockData.price,
                t1_change_percent: stockData.changePercent,
                t1_volume: stockData.volume,
                t1_turnover: stockData.turnover,
                t1_date: new Date().toISOString().split('T')[0],
              })
              .eq('id', record.id);

            if (!updateError) {
              count++;
              console.log(`  ✓ 已更新T+1数据: ${record.stock_name}`);
            }
          }
        } catch (error) {
          console.error(`  ✗ 更新T+1数据失败 (${record.stock_name}):`, error);
        }
      }
    } else if (type === 'T3') {
      // T+3观察：获取跟踪开始后第3天的数据并评估
      const { data: t3Records, error } = await supabase
        .from('stock_tracking')
        .select('*')
        .eq('status', 'tracking')
        .is('t3_price', null);

      if (error) {
        console.error('获取T+3跟踪记录失败:', error);
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 500 }
        );
      }

      console.log(`  → 找到 ${t3Records.length} 条待观察的记录`);

      for (const record of t3Records) {
        try {
          const stockData = await getStockRealTimeData(record.stock_code);

          if (stockData) {
            // 计算评估结果
            const trackingStartPrice = parseFloat(record.tracking_start_price);
            const t3Price = stockData.price;
            const changePercent = ((t3Price - trackingStartPrice) / trackingStartPrice) * 100;

            const evaluation = changePercent >= 5 ? 'success' : changePercent >= 0 ? 'hold' : 'failed';

            const { error: updateError } = await supabase
              .from('stock_tracking')
              .update({
                t3_price: stockData.price,
                t3_change_percent: stockData.changePercent,
                t3_volume: stockData.volume,
                t3_turnover: stockData.turnover,
                t3_date: new Date().toISOString().split('T')[0],
                t3_total_change: changePercent,
                evaluation: evaluation,
              })
              .eq('id', record.id);

            if (!updateError) {
              count++;
              console.log(`  ✓ 已更新T+3数据: ${record.stock_name} (${evaluation})`);
            }
          }
        } catch (error) {
          console.error(`  ✗ 更新T+3数据失败 (${record.stock_name}):`, error);
        }
      }
    }

    console.log(`  ✓ ${type}观察完成，共处理 ${count} 条记录`);

    return NextResponse.json({
      success: true,
      count,
      message: `${type}观察完成`,
    });
  } catch (error) {
    console.error(`${type}观察失败:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : `${type}观察失败`,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tracking/observation - 查询观察状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'T1';

    // 获取待观察的记录数
    let query;
    if (type === 'T1') {
      query = supabase
        .from('stock_tracking')
        .select('id', { count: 'exact' })
        .eq('status', 'tracking')
        .is('t1_price', null);
    } else {
      query = supabase
        .from('stock_tracking')
        .select('id', { count: 'exact' })
        .eq('status', 'tracking')
        .is('t3_price', null);
    }

    const { count, error } = await query;

    if (error) {
      console.error('查询观察状态失败:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      type,
      pendingCount: count || 0,
    });
  } catch (error) {
    console.error('查询观察状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查询观察状态失败',
      },
      { status: 500 }
    );
  }
}
