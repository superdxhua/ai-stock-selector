/**
 * 陈小群策略分析API
 * 
 * 功能：
 * 1. 分析股票的陈小群策略因子
 * 2. 生成陈小群风格的操作建议
 * 3. 保存学习记录到数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { analyzeChenXiaoqunFactors, batchAnalyzeChenXiaoqunFactors } from '@/lib/chen-xiaoqun-strategy';

/**
 * POST /api/chen-xiaoqun/analyze
 * 
 * 分析单只股票的陈小群策略因子
 * 请求体: { code, name?, industry? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, industry } = body;

    if (!code) {
      return NextResponse.json({
        success: false,
        error: '缺少股票代码参数',
      }, { status: 400 });
    }

    console.log(`开始分析股票 ${code} 的陈小群策略...`);

    // 分析陈小群策略因子
    const factors = await analyzeChenXiaoqunFactors(code, industry);

    // 保存学习记录到数据库
    const client = getSupabaseClient();
    const { error: insertError } = await client
      .from('chen_xiaoqun_learning_records')
      .insert({
        stock_code: code,
        stock_name: name,
        dragon_head_score: factors.dragon_head_score,
        is_dragon_head: factors.is_dragon_head,
        consecutive_limit_up: factors.consecutive_limit_up,
        is_monster_stock: factors.is_monster_stock,
        market_sentiment_cycle: factors.market_sentiment_cycle,
        sentiment_alignment: factors.sentiment_alignment,
        main_force_flow: factors.main_force_flow,
        fund_accumulation: factors.fund_accumulation,
        limit_up_timing: factors.limit_up_timing,
        limit_up_strong: factors.limit_up_strong,
        position_risk: factors.position_risk,
        relay_feasibility: factors.relay_feasibility,
        sector_heat: factors.sector_heat,
        sector_rotation_position: factors.sector_rotation_position,
        overall_score: factors.overall_score,
        action_advice: factors.action_advice,
        is_applied: false,
      });

    if (insertError) {
      console.error('保存学习记录失败:', insertError);
    } else {
      console.log('学习记录已保存');
    }

    return NextResponse.json({
      success: true,
      data: {
        stock_code: code,
        stock_name: name,
        factors,
      },
      message: '分析完成',
    });
  } catch (error) {
    console.error('分析失败:', error);
    return NextResponse.json({
      success: false,
      error: '分析失败',
    }, { status: 500 });
  }
}

/**
 * GET /api/chen-xiaoqun/analyze?code=xxx
 * 
 * 获取股票的陈小群策略学习记录
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({
        success: false,
        error: '缺少股票代码参数',
      }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 获取最新的学习记录
    const { data, error } = await client
      .from('chen_xiaoqun_learning_records')
      .select('*')
      .eq('stock_code', code)
      .order('analyze_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({
        success: false,
        error: '未找到学习记录',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('获取学习记录失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取学习记录失败',
    }, { status: 500 });
  }
}
