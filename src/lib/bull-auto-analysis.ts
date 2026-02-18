/**
 * 大牛股自动复盘模块
 *
 * 功能：
 * 1. 自动扫描潜力股票
 * 2. 生成大牛股特征分析
 * 3. 自动保存复盘结果到数据库
 */

/**
 * 执行大牛股复盘
 */
export async function executeBullAnalysis(): Promise<any> {
  console.log('📈 开始执行大牛股复盘分析');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  try {
    const response = await fetch(`${baseUrl}/api/bull-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        autoMode: true,
        analysisCount: 10, // 自动分析10只潜力股票
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`  ✓ 复盘完成，分析了 ${result.data?.length || 0} 只股票`);
      console.log(`  - 成功捕获: ${result.successCount || 0} 只`);
      console.log(`  - 潜力股: ${result.potentialCount || 0} 只`);

      return {
        success: true,
        analyzedCount: result.data?.length || 0,
        capturedCount: result.successCount || 0,
        potentialCount: result.potentialCount || 0,
        data: result.data,
      };
    } else {
      console.error(`  ✗ 复盘执行失败:`, result.error);
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error(`  ✗ 复盘执行失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '执行失败',
    };
  }
}

/**
 * 执行大牛股潜力扫描
 */
export async function scanPotentialStocks(): Promise<any> {
  console.log('🔍 开始扫描潜力股票');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  try {
    const response = await fetch(`${baseUrl}/api/stocks/real?strategy=leader&limit=50`);
    const result = await response.json();

    if (result.success && result.data.length > 0) {
      console.log(`  ✓ 扫描完成，发现 ${result.data.length} 只潜力股票`);
      return {
        success: true,
        stocks: result.data,
      };
    } else {
      console.log(`  ⚠️ 未发现潜力股票`);
      return {
        success: true,
        stocks: [],
      };
    }
  } catch (error) {
    console.error(`  ✗ 扫描失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '扫描失败',
    };
  }
}
