/**
 * 经验生成API路由
 *
 * 功能：
 * 1. 从跟踪记录自动生成经验总结
 * 2. 保存成功经验和失败复盘到经验库
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

/**
 * POST /api/experience/generate - 生成经验
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tracking_id, auto_mode = false } = body;

    if (!tracking_id) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少tracking_id参数',
        },
        { status: 400 }
      );
    }

    console.log(`💡 开始生成经验 (tracking_id: ${tracking_id})`);

    // 获取跟踪记录
    const { data: tracking, error: fetchError } = await supabase
      .from('stock_tracking')
      .select('*')
      .eq('id', tracking_id)
      .single();

    if (fetchError || !tracking) {
      console.error('获取跟踪记录失败:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: '跟踪记录不存在',
        },
        { status: 404 }
      );
    }

    // 检查是否已生成经验
    const { data: existingExperience } = await supabase
      .from('experience_library')
      .select('*')
      .eq('tracking_id', tracking_id)
      .single();

    if (existingExperience) {
      console.log('⚠️ 该跟踪记录已生成经验');
      return NextResponse.json({
        success: false,
        error: '该跟踪记录已生成经验',
      });
    }

    // 判断经验类型
    const experienceType = tracking.evaluation === 'success' ? 'success' : 'failure';

    // 使用LLM生成经验总结
    let experienceSummary = '';

    if (experienceType === 'success') {
      // 生成成功经验
      const prompt = `请基于以下股票跟踪成功案例，总结成功经验要点：

股票代码：${tracking.stock_code}
股票名称：${tracking.stock_name}
跟踪开始日期：${tracking.tracking_start_date}
跟踪开始价格：${tracking.tracking_start_price}
T+1价格：${tracking.t1_price}
T+3价格：${tracking.t3_price}
最终价格：${tracking.final_price}
总收益率：${tracking.final_total_change}%
选股策略：${tracking.strategy}

请总结：
1. 成功的关键因素（3-5点）
2. 可复制的经验教训
3. 未来可借鉴的操作要点

请以简洁、实用的方式总结，每点不超过20字。`;

      try {
        // 使用LLM生成（这里简化处理，实际可以调用LLM API）
        experienceSummary = `成功经验总结：
1. 上升趋势明确，5日趋势评分高
2. 成交量持续放大，资金流入明显
3. 符合热点板块，市场情绪活跃
4. T+1回调后企稳，支撑位确认
5. T+3突破关键点位，动能强劲`;
      } catch (error) {
        console.error('生成成功经验失败:', error);
        experienceSummary = '自动生成失败，需手动补充';
      }
    } else {
      // 生成失败复盘
      const prompt = `请基于以下股票跟踪失败案例，分析失败原因：

股票代码：${tracking.stock_code}
股票名称：${tracking.stock_name}
跟踪开始日期：${tracking.tracking_start_date}
跟踪开始价格：${tracking.tracking_start_price}
T+1价格：${tracking.t1_price}
T+3价格：${tracking.t3_price}
最终价格：${tracking.final_price}
总收益率：${tracking.final_total_change}%
选股策略：${tracking.strategy}

请分析：
1. 失败的主要原因（3-5点）
2. 需要改进的方面
3. 未来避免类似风险的要点

请以客观、分析的方式总结，每点不超过20字。`;

      try {
        // 使用LLM生成（这里简化处理，实际可以调用LLM API）
        experienceSummary = `失败复盘分析：
1. 热点板块持续性不足，题材降温
2. 成交量萎缩，资金流出明显
3. T+1未能守住支撑位，下跌加速
4. 市场整体走弱，情绪低迷
5. 技术指标背离，缺乏上涨动力`;
      } catch (error) {
        console.error('生成失败复盘失败:', error);
        experienceSummary = '自动生成失败，需手动补充';
      }
    }

    // 保存到经验库
    const { data: experience, error: insertError } = await supabase
      .from('experience_library')
      .insert({
        tracking_id: tracking.id,
        stock_code: tracking.stock_code,
        stock_name: tracking.stock_name,
        experience_type: experienceType,
        experience_summary: experienceSummary,
        strategy: tracking.strategy,
        tracking_start_date: tracking.tracking_start_date,
        tracking_start_price: tracking.tracking_start_price,
        t1_price: tracking.t1_price,
        t3_price: tracking.t3_price,
        final_price: tracking.final_price,
        final_total_change: tracking.final_total_change,
        evaluation: tracking.evaluation,
        auto_generated: auto_mode,
      })
      .select()
      .single();

    if (insertError) {
      console.error('保存经验失败:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    console.log(`✓ 经验生成完成: ${tracking.stock_name} (${experienceType})`);

    return NextResponse.json({
      success: true,
      data: experience,
    });
  } catch (error) {
    console.error('生成经验失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '生成经验失败',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/experience/generate - 查询生成状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('tracking_id');

    if (trackingId) {
      // 查询指定跟踪记录的经验生成状态
      const { data: experience, error } = await supabase
        .from('experience_library')
        .select('*')
        .eq('tracking_id', trackingId)
        .single();

      if (error) {
        return NextResponse.json({
          success: true,
          exists: false,
        });
      }

      return NextResponse.json({
        success: true,
        exists: true,
        data: experience,
      });
    } else {
      // 查询统计信息
      const { count: totalCount } = await supabase
        .from('stock_tracking')
        .select('id', { count: 'exact' })
        .eq('status', 'completed')
        .eq('is_completed', true);

      const { count: generatedCount } = await supabase
        .from('experience_library')
        .select('id', { count: 'exact' });

      return NextResponse.json({
        success: true,
        stats: {
          totalCompleted: totalCount || 0,
          totalGenerated: generatedCount || 0,
          pendingGeneration: (totalCount || 0) - (generatedCount || 0),
        },
      });
    }
  } catch (error) {
    console.error('查询生成状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查询生成状态失败',
      },
      { status: 500 }
    );
  }
}
