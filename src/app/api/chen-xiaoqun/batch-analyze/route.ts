/**
 * 陈小群策略批量分析API
 * 
 * 功能：
 * 1. 批量分析同花顺策略中的股票，应用陈小群策略逻辑
 * 2. 生成陈小群风格的选股建议
 * 3. 优化现有策略评分标准
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { batchAnalyzeChenXiaoqunFactors } from '@/lib/chen-xiaoqun-strategy';

/**
 * POST /api/chen-xiaoqun/batch-analyze
 * 
 * 批量分析同花顺策略中的股票，应用陈小群策略逻辑
 * 请求体: { strategyType } (5day-trend | 5day-volume)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyType } = body;

    if (!strategyType) {
      return NextResponse.json({
        success: false,
        error: '缺少 strategyType 参数',
      }, { status: 400 });
    }

    console.log(`开始批量分析策略 ${strategyType} 中的股票，应用陈小群策略...`);

    const client = getSupabaseClient();

    // 获取同花顺策略股票
    const { data: tonghuashunStocks, error } = await client
      .from('tonghuashun_strategies')
      .select('*')
      .eq('strategy_type', strategyType);

    if (error || !tonghuashunStocks || tonghuashunStocks.length === 0) {
      return NextResponse.json({
        success: false,
        error: '未找到同花顺策略股票',
      }, { status: 404 });
    }

    console.log(`找到 ${tonghuashunStocks.length} 只股票，开始分析...`);

    // 批量分析陈小群策略因子
    const factors = await batchAnalyzeChenXiaoqunFactors(tonghuashunStocks);

    console.log(`分析完成，成功分析 ${Object.keys(factors).length} 只股票`);

    // 为每个因子添加股票名称
    const stockNameMap = new Map(tonghuashunStocks.map(s => [s.stock_code, s.stock_name]));
    Object.keys(factors).forEach(code => {
      (factors[code] as any).stock_name = stockNameMap.get(code) || '';
    });

    // 统计分析结果
    const analyzedStocks = Object.values(factors);
    const totalStocks = analyzedStocks.length;

    const dragonHeadCount = analyzedStocks.filter(f => f.is_dragon_head).length;
    const monsterStockCount = analyzedStocks.filter(f => f.is_monster_stock).length;
    const highScoreCount = analyzedStocks.filter(f => f.overall_score >= 80).length;

    // 计算平均评分
    const avgScore = analyzedStocks.reduce((sum, f) => sum + f.overall_score, 0) / totalStocks;

    // 生成陈小群风格的学习建议
    const recommendations = generateChenXiaoqunRecommendations(analyzedStocks);

    // 保存所有学习记录
    for (const stock of tonghuashunStocks) {
      const code = stock.stock_code;
      const factor = factors[code];

      if (!factor) continue;

      try {
        await client
          .from('chen_xiaoqun_learning_records')
          .insert({
            stock_code: code,
            stock_name: stock.stock_name,
            dragon_head_score: factor.dragon_head_score,
            is_dragon_head: factor.is_dragon_head,
            consecutive_limit_up: factor.consecutive_limit_up,
            is_monster_stock: factor.is_monster_stock,
            market_sentiment_cycle: factor.market_sentiment_cycle,
            sentiment_alignment: factor.sentiment_alignment,
            main_force_flow: factor.main_force_flow,
            fund_accumulation: factor.fund_accumulation,
            limit_up_timing: factor.limit_up_timing,
            limit_up_strong: factor.limit_up_strong,
            position_risk: factor.position_risk,
            relay_feasibility: factor.relay_feasibility,
            sector_heat: factor.sector_heat,
            sector_rotation_position: factor.sector_rotation_position,
            overall_score: factor.overall_score,
            action_advice: factor.action_advice,
            is_applied: false,
          });

        console.log(`已保存股票 ${code} 的学习记录`);
      } catch (error) {
        console.error(`保存股票 ${code} 的学习记录失败:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        strategyType,
        analyzedCount: totalStocks,
        statistics: {
          dragonHeadCount,
          monsterStockCount,
          highScoreCount,
          avgScore: avgScore.toFixed(2),
        },
        recommendations,
        factors,
      },
      message: '批量分析完成',
    });
  } catch (error) {
    console.error('批量分析失败:', error);
    return NextResponse.json({
      success: false,
      error: '批量分析失败',
    }, { status: 500 });
  }
}

/**
 * 生成陈小群风格的学习建议
 */
function generateChenXiaoqunRecommendations(stocks: any[]): string[] {
  const recommendations: string[] = [];

  const dragonHeadStocks = stocks.filter(f => f.is_dragon_head);
  const monsterStocks = stocks.filter(f => f.is_monster_stock);
  const highScoreStocks = stocks.filter(f => f.overall_score >= 80);

  // 龙头战法建议
  if (dragonHeadStocks.length > 0) {
    recommendations.push(
      `发现 ${dragonHeadStocks.length} 只龙头股，符合陈小群龙头战法，建议重点关注`
    );
  }

  // 妖股建议
  if (monsterStocks.length > 0) {
    recommendations.push(
      `发现 ${monsterStocks.length} 只妖股（5连板以上），按照陈小群策略，可考虑打板买入`
    );
  }

  // 高分股票建议
  if (highScoreStocks.length > 0) {
    recommendations.push(
      `${highScoreStocks.length} 只股票综合评分超过80分，强烈推荐按陈小群策略操作`
    );
  }

  // 市场情绪建议
  const sentimentCycles = stocks.map(f => f.market_sentiment_cycle);
  const bullMarketStocks = stocks.filter(f => 
    f.market_sentiment_cycle === '上升期' || f.market_sentiment_cycle === '高潮期'
  );

  if (bullMarketStocks.length > stocks.length * 0.5) {
    recommendations.push('市场情绪处于上升期，按照陈小群策略，可加大仓位，追涨龙头');
  } else {
    recommendations.push('市场情绪一般，建议控制仓位，等待情绪回暖');
  }

  // 资金流向建议
  const strongCapitalStocks = stocks.filter(f => f.main_force_flow > 10000);
  if (strongCapitalStocks.length > 0) {
    recommendations.push(
      `${strongCapitalStocks.length} 只股票主力资金大幅流入，可考虑跟随资金流向`
    );
  }

  // 板块轮动建议
  const sectorPositions = stocks.map(f => f.sector_rotation_position);
  const hotSectors = stocks.filter(f => f.sector_heat > 60);
  if (hotSectors.length > 0) {
    recommendations.push('当前有热门板块，关注板块轮动，把握板块龙头');
  }

  return recommendations;
}

/**
 * GET /api/chen-xiaoqun/batch-analyze?strategyType=xxx
 * 
 * 获取批量分析结果
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategyType = searchParams.get('strategyType');

    if (!strategyType) {
      return NextResponse.json({
        success: false,
        error: '缺少 strategyType 参数',
      }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 获取最新的批量分析结果
    const { data, error } = await client
      .from('chen_xiaoqun_learning_records')
      .select('*')
      .order('analyze_date', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({
        success: false,
        error: '获取批量分析结果失败',
      }, { status: 500 });
    }

    // 统计分析结果
    const dragonHeadCount = data.filter(r => r.is_dragon_head).length;
    const monsterStockCount = data.filter(r => r.is_monster_stock).length;
    const avgScore = data.reduce((sum, r) => sum + (r.overall_score || 0), 0) / data.length;

    return NextResponse.json({
      success: true,
      data: {
        records: data,
        statistics: {
          total: data.length,
          dragonHeadCount,
          monsterStockCount,
          avgScore: avgScore.toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error('获取批量分析结果失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取批量分析结果失败',
    }, { status: 500 });
  }
}
