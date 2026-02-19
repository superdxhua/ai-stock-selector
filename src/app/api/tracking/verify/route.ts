/**
 * 跟踪验证API路由
 *
 * 功能：
 * 验证已完成T+3观察的记录，补充完整并标记为完成
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getStockRealTimeData } from '@/lib/stock-data';

const supabase = getSupabaseClient();

/**
 * POST /api/tracking/verify - 执行跟踪验证
 */
export async function POST(request: NextRequest) {
  try {
    console.log('✅ 开始执行跟踪验证任务');

    // 获取已完成T+3评估但未标记为完成的记录
    const { data: records, error } = await supabase
      .from('stock_tracking')
      .select('*')
      .eq('status', 'tracking')
      .not('evaluation', 'is', null)
      .eq('is_completed', false);

    if (error) {
      console.error('获取验证记录失败:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    console.log(`  → 找到 ${records.length} 条待验证的记录`);

    let count = 0;

    for (const record of records) {
      try {
        // 获取最新数据
        const stockData = await getStockRealTimeData(record.stock_code);

        if (stockData) {
          // 计算最终收益
          const trackingStartPrice = parseFloat(record.tracking_start_price);
          const finalPrice = stockData.f2;
          const finalChangePercent = ((finalPrice - trackingStartPrice) / trackingStartPrice) * 100;

          const { error: updateError } = await supabase
            .from('stock_tracking')
            .update({
              final_price: stockData.f2,
              final_change_percent: stockData.f3,
              final_total_change: finalChangePercent,
              final_date: new Date().toISOString().split('T')[0],
              is_completed: true,
              completed_at: new Date().toISOString(),
            })
            .eq('id', record.id);

          if (!updateError) {
            count++;
            console.log(
              `  ✓ 已验证并完成: ${record.stock_name} (${record.evaluation}, 收益: ${finalChangePercent.toFixed(2)}%)`
            );
          }
        }
      } catch (error) {
        console.error(`  ✗ 验证失败 (${record.stock_name}):`, error);
      }
    }

    console.log(`  ✓ 验证完成，共处理 ${count} 条记录`);

    return NextResponse.json({
      success: true,
      count,
      message: '跟踪验证完成',
    });
  } catch (error) {
    console.error('跟踪验证失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '跟踪验证失败',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tracking/verify - 查询验证状态
 */
export async function GET(request: NextRequest) {
  try {
    // 获取待验证的记录数
    const { count, error } = await supabase
      .from('stock_tracking')
      .select('id', { count: 'exact' })
      .eq('status', 'tracking')
      .not('evaluation', 'is', null)
      .eq('is_completed', false);

    if (error) {
      console.error('查询验证状态失败:', error);
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
      pendingCount: count || 0,
    });
  } catch (error) {
    console.error('查询验证状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查询验证状态失败',
      },
      { status: 500 }
    );
  }
}
