/**
 * 策略自动执行模块
 *
 * 功能：
 * 1. 自动执行5日趋势核心策略
 * 2. 自动执行5日容量核心策略
 * 3. 自动执行龙头精选策略
 * 4. 自动保存筛选结果到数据库
 */

/**
 * 执行所有策略筛选
 */
export async function executeAllStrategies(): Promise<any> {
  console.log('🎯 开始执行所有策略筛选');

  const results: any = {
    '5day-trend': null,
    '5day-volume': null,
    'leader': null,
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  // 执行5日趋势核心策略
  try {
    console.log('\n  → 执行5日趋势核心策略');
    const response = await fetch(`${baseUrl}/api/stocks/real?strategy=5day-trend`);
    const result = await response.json();

    if (result.success && result.data.length > 0) {
      console.log(`    ✓ 筛选出 ${result.data.length} 只股票`);
      results['5day-trend'] = {
        count: result.count,
        stocks: result.data.map((s: any) => ({
          code: s.code,
          name: s.name,
          trendScore: s.trendScore,
          price: s.price,
          changePercent: s.changePercent,
        })),
      };
    } else {
      console.log(`    ⚠️ 未筛选出符合条件的股票`);
      results['5day-trend'] = { count: 0, stocks: [] };
    }
  } catch (error) {
    console.error(`    ✗ 5日趋势策略执行失败:`, error);
    results['5day-trend'] = { error: error instanceof Error ? error.message : '执行失败' };
  }

  // 执行5日容量核心策略
  try {
    console.log('\n  → 执行5日容量核心策略');
    const response = await fetch(`${baseUrl}/api/stocks/real?strategy=5day-volume`);
    const result = await response.json();

    if (result.success && result.data.length > 0) {
      console.log(`    ✓ 筛选出 ${result.data.length} 只股票`);
      results['5day-volume'] = {
        count: result.count,
        stocks: result.data.map((s: any) => ({
          code: s.code,
          name: s.name,
          volumeScore: s.volumeScore,
          price: s.price,
          changePercent: s.changePercent,
        })),
      };
    } else {
      console.log(`    ⚠️ 未筛选出符合条件的股票`);
      results['5day-volume'] = { count: 0, stocks: [] };
    }
  } catch (error) {
    console.error(`    ✗ 5日容量策略执行失败:`, error);
    results['5day-volume'] = { error: error instanceof Error ? error.message : '执行失败' };
  }

  // 执行龙头精选策略
  try {
    console.log('\n  → 执行龙头精选策略');
    const response = await fetch(`${baseUrl}/api/stocks/real?strategy=leader`);
    const result = await response.json();

    if (result.success && result.data.length > 0) {
      console.log(`    ✓ 筛选出 ${result.data.length} 只龙头股`);
      results['leader'] = {
        count: result.count,
        stocks: result.data.map((s: any) => ({
          code: s.code,
          name: s.name,
          leaderScore: s.leaderScore,
          price: s.price,
          changePercent: s.changePercent,
        })),
      };
    } else {
      console.log(`    ⚠️ 未筛选出符合条件的龙头股`);
      results['leader'] = { count: 0, stocks: [] };
    }
  } catch (error) {
    console.error(`    ✗ 龙头精选策略执行失败:`, error);
    results['leader'] = { error: error instanceof Error ? error.message : '执行失败' };
  }

  // 统计
  const totalStocks =
    (results['5day-trend']?.stocks?.length || 0) +
    (results['5day-volume']?.stocks?.length || 0) +
    (results['leader']?.stocks?.length || 0);

  console.log(`\n📊 策略执行完成，共筛选出 ${totalStocks} 只股票`);

  return {
    success: true,
    results,
    summary: {
      totalStrategies: 3,
      totalStocks,
      breakdown: {
        '5day-trend': results['5day-trend']?.stocks?.length || 0,
        '5day-volume': results['5day-volume']?.stocks?.length || 0,
        'leader': results['leader']?.stocks?.length || 0,
      },
    },
  };
}

/**
 * 执行单个策略
 */
export async function executeStrategy(strategy: string): Promise<any> {
  console.log(`🎯 开始执行策略: ${strategy}`);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  try {
    const response = await fetch(`${baseUrl}/api/stocks/real?strategy=${strategy}`);
    const result = await response.json();

    if (result.success) {
      console.log(`  ✓ 策略 ${strategy} 执行完成，筛选出 ${result.count} 只股票`);
      return {
        success: true,
        strategy,
        count: result.count,
        stocks: result.data,
      };
    } else {
      console.error(`  ✗ 策略 ${strategy} 执行失败`);
      return {
        success: false,
        strategy,
        error: result.error,
      };
    }
  } catch (error) {
    console.error(`  ✗ 策略 ${strategy} 执行失败:`, error);
    return {
      success: false,
      strategy,
      error: error instanceof Error ? error.message : '执行失败',
    };
  }
}
