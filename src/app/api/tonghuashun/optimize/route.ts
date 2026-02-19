/**
 * 同花顺策略优化接口
 * 
 * 功能：
 * 1. 获取最新的学习记录
 * 2. 根据学习结果调整策略评分权重
 * 3. 生成优化后的策略配置
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface LearningRecord {
  id: number;
  strategy_type: string;
  analyze_date: string;
  stock_count: number;
  learned_features: any;
  avg_consecutive_rises: number;
  avg_5_day_change: number;
  avg_limit_up_ratio: number;
  avg_volume_ratio: number;
  avg_price_above_cyc: number;
  avg_macd_golden_cross: number;
  recommendations: string[];
  learning_score: number;
  is_applied: boolean;
}

interface StrategyConfig {
  name: string;
  description: string;
  weights: {
    limitUp: number;
    volume: number;
    cyc: number;
    macd: number;
    consecutiveRises: number;
    price5DayChange: number;
  };
  thresholds: {
    volumeRatio: number;
    cycDays: number;
  };
}

const defaultStrategyConfigs: Record<string, StrategyConfig> = {
  '5day-trend': {
    name: '5日趋势核心策略',
    description: '基于5日K线趋势、成交量、CYC等因子综合评分',
    weights: {
      limitUp: 25,
      volume: 20,
      cyc: 15,
      macd: 10,
      consecutiveRises: 20,
      price5DayChange: 10,
    },
    thresholds: {
      volumeRatio: 2,
      cycDays: 3,
    },
  },
  '5day-volume': {
    name: '5日容量核心策略',
    description: '基于成交量放大、价格趋势、技术指标综合评分',
    weights: {
      limitUp: 20,
      volume: 30,
      cyc: 10,
      macd: 20,
      consecutiveRises: 10,
      price5DayChange: 10,
    },
    thresholds: {
      volumeRatio: 2,
      cycDays: 3,
    },
  },
};

/**
 * GET /api/tonghuashun/optimize - 获取策略优化建议
 * 查询参数: strategyType=5day-trend|5day-volume
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

    // 获取最新的未应用学习记录
    const { data: learningRecord, error } = await client
      .from('tonghuashun_learning_records')
      .select('*')
      .eq('strategy_type', strategyType)
      .eq('is_applied', false)
      .order('analyze_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !learningRecord) {
      return NextResponse.json({
        success: false,
        error: '未找到可应用的学习记录',
        hasNewLearning: false,
      }, { status: 404 });
    }

    // 生成优化建议
    const optimization = generateOptimization(learningRecord, strategyType);

    return NextResponse.json({
      success: true,
      data: {
        learningRecord,
        optimization,
        canApply: true,
      },
    });
  } catch (error) {
    console.error('获取优化建议失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误',
    }, { status: 500 });
  }
}

/**
 * POST /api/tonghuashun/optimize - 应用策略优化
 * 请求体: { strategyType, apply }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyType, apply } = body;

    if (!strategyType) {
      return NextResponse.json({
        success: false,
        error: '缺少 strategyType 参数',
      }, { status: 400 });
    }

    if (!apply) {
      return NextResponse.json({
        success: false,
        error: '未确认应用优化',
      }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 获取最新的未应用学习记录
    const { data: learningRecord, error: fetchError } = await client
      .from('tonghuashun_learning_records')
      .select('*')
      .eq('strategy_type', strategyType)
      .eq('is_applied', false)
      .order('analyze_date', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !learningRecord) {
      return NextResponse.json({
        success: false,
        error: '未找到可应用的学习记录',
      }, { status: 404 });
    }

    // 生成优化配置
    const optimization = generateOptimization(learningRecord, strategyType);

    // 更新学习记录为已应用
    const { error: updateError } = await client
      .from('tonghuashun_learning_records')
      .update({
        is_applied: true,
        applied_at: new Date().toISOString(),
      })
      .eq('id', learningRecord.id);

    if (updateError) {
      console.error('更新学习记录失败:', updateError);
      return NextResponse.json({
        success: false,
        error: '应用优化失败',
      }, { status: 500 });
    }

    // TODO: 这里可以将优化配置保存到数据库或配置文件中
    // 例如：创建一个 strategy_configs 表，或者写入配置文件
    console.log(`策略 ${strategyType} 优化已应用:`, optimization);

    return NextResponse.json({
      success: true,
      data: {
        learningRecord,
        optimization,
      },
      message: '策略优化已应用',
    });
  } catch (error) {
    console.error('应用优化失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误',
    }, { status: 500 });
  }
}

/**
 * 生成优化建议
 */
function generateOptimization(
  learningRecord: LearningRecord,
  strategyType: string
): StrategyConfig {
  const config = JSON.parse(JSON.stringify(defaultStrategyConfigs[strategyType]));
  const features = learningRecord.learned_features;

  if (strategyType === '5day-trend') {
    // 5日趋势策略优化
    if (features.avgLimitUpRatio > 0.7) {
      config.weights.limitUp = 30; // 提高涨停板权重
    }
    if (features.avgVolumeRatio > 2.5) {
      config.weights.volume = 25; // 提高成交量权重
      config.thresholds.volumeRatio = 2.5; // 提高成交量阈值
    }
    if (features.avgPriceAboveCYC > 0.6) {
      config.weights.cyc = 20; // 提高CYC权重
      config.thresholds.cycDays = 2; // 降低CYC天数阈值
    }
    if (features.avgMACDGoldenCross > 0.5) {
      config.weights.macd = 15; // 提高MACD权重
    }
    if (features.avgConsecutiveRises > 2) {
      config.weights.consecutiveRises = 25; // 提高连涨权重
    }
  } else if (strategyType === '5day-volume') {
    // 5日容量策略优化
    if (features.avgVolumeRatio > 3) {
      config.weights.volume = 35; // 提高成交量权重
      config.thresholds.volumeRatio = 3; // 提高成交量阈值
    }
    if (features.avgLimitUpRatio > 0.6) {
      config.weights.limitUp = 25; // 提高涨停板权重
    }
    if (features.avgMACDGoldenCross > 0.6) {
      config.weights.macd = 25; // 提高MACD权重
    }
    if (features.avgConsecutiveRises > 2) {
      config.weights.consecutiveRises = 15; // 提高连涨权重
    }
    if (features.avgPriceAboveCYC > 0.5) {
      config.weights.cyc = 15; // 提高CYC权重
    }
  }

  return config;
}
