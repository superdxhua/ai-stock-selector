/**
 * 多维度因子分析模块
 * 
 * 功能：
 * 1. 市场情绪因子分析
 * 2. 政策指引因子分析
 * 3. 资金流向因子分析
 * 4. 基本面因子分析
 * 5. 行业因子分析
 * 6. 高级技术指标分析
 */

/**
 * 获取市场情绪因子
 */
export async function getMarketSentimentFactor(code: string): Promise<any> {
  try {
    const response = await fetch(`http://localhost:5000/api/analysis/market-sentiment?code=${code}`);
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error(`获取股票 ${code} 的市场情绪因子失败:`, error);
    return null;
  }
}

/**
 * 获取政策指引因子
 */
export async function getPolicyGuidanceFactor(code: string, industry?: string): Promise<any> {
  try {
    const response = await fetch(
      `http://localhost:5000/api/analysis/policy-guidance?code=${code}${industry ? `&industry=${industry}` : ''}`
    );
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error(`获取股票 ${code} 的政策指引因子失败:`, error);
    return null;
  }
}

/**
 * 获取资金流向因子
 */
export async function getCapitalFlowFactor(code: string): Promise<any> {
  try {
    const response = await fetch(`http://localhost:5000/api/analysis/capital-flow?code=${code}`);
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error(`获取股票 ${code} 的资金流向因子失败:`, error);
    return null;
  }
}

/**
 * 分析基本面因子（模拟）
 */
export async function getFundamentalMetricsFactor(code: string): Promise<any> {
  // 模拟数据生成
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const pe_ratio = parseFloat((random(hash) * 100 + 5).toFixed(2));  // 5-105
  const pb_ratio = parseFloat((random(hash + 1) * 10 + 0.5).toFixed(2));  // 0.5-10.5
  const revenue_growth = parseFloat(((random(hash + 2) - 0.5) * 100).toFixed(2));  // -50% 到 50%
  const profit_growth = parseFloat(((random(hash + 3) - 0.5) * 100).toFixed(2));  // -50% 到 50%
  const roe = parseFloat((random(hash + 4) * 30).toFixed(2));  // 0-30%
  const roa = parseFloat((random(hash + 5) * 10).toFixed(2));  // 0-10%

  // 基本面评分计算
  const pe_score = Math.max(0, 100 - Math.abs(pe_ratio - 30) * 2);  // PE越接近30越好
  const growth_score = Math.min(100, Math.max(0, (revenue_growth + profit_growth) / 2 + 50));
  const roe_score = roe * 3.33;  // ROE越高越好

  const fundamental_score = Math.floor((pe_score * 0.3) + (growth_score * 0.4) + (roe_score * 0.3));

  return {
    pe_ratio,
    pb_ratio,
    revenue_growth,
    profit_growth,
    roe,
    roa,
    fundamental_score,
  };
}

/**
 * 分析行业因子（模拟）
 */
export async function getIndustryFactorsFactor(code: string): Promise<any> {
  // 模拟数据生成
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const industry_boom = Math.floor(random(hash) * 100);
  const sector_rotation = Math.floor(random(hash + 1) * 100);
  const industry_rank = Math.floor(random(hash + 2) * 100) + 1;  // 1-100
  const sector_heat = Math.floor(random(hash + 3) * 100);
  const peer_comparison = Math.floor(random(hash + 4) * 100);

  // 行业评分计算
  const industry_score = Math.floor(
    (industry_boom * 0.3) + 
    (sector_heat * 0.3) + 
    ((100 - industry_rank) * 0.2) + 
    (peer_comparison * 0.2)
  );

  return {
    industry_boom,
    sector_rotation,
    industry_rank,
    sector_heat,
    peer_comparison,
    industry_score,
  };
}

/**
 * 分析高级技术指标（模拟）
 */
export async function getAdvancedIndicatorsFactor(klines: any[]): Promise<any> {
  if (!klines || klines.length < 30) {
    return null;
  }

  const closePrices = klines.map(k => parseFloat(k.close));
  const highPrices = klines.map(k => parseFloat(k.high));
  const lowPrices = klines.map(k => parseFloat(k.low));
  const volumes = klines.map(k => parseFloat(k.volume));

  // RSI计算
  const rsi = calculateRSI(closePrices, 14);

  // KDJ计算
  const kdj = calculateKDJ(highPrices, lowPrices, closePrices, 9, 3, 3);

  // 布林带计算
  const bollinger = calculateBollingerBands(closePrices, 20, 2);

  // 均线计算
  const ma5 = calculateMA(closePrices, 5);
  const ma10 = calculateMA(closePrices, 10);
  const ma20 = calculateMA(closePrices, 20);
  const ma60 = calculateMA(closePrices, 60);

  // 均线金叉/死叉
  let ma_cross = 'none';
  if (ma5 > ma10 && ma10 > ma20) {
    ma_cross = 'golden_cross';  // 多头排列
  } else if (ma5 < ma10 && ma10 < ma20) {
    ma_cross = 'death_cross';  // 空头排列
  }

  return {
    rsi,
    kdj_k: kdj.k,
    kdj_d: kdj.d,
    kdj_j: kdj.j,
    bollinger_upper: bollinger.upper,
    bollinger_lower: bollinger.lower,
    bollinger_break: closePrices[closePrices.length - 1] > bollinger.upper ? 'up' : 
                    closePrices[closePrices.length - 1] < bollinger.lower ? 'down' : 'middle',
    ma5,
    ma10,
    ma20,
    ma60,
    ma_cross,
  };
}

/**
 * 计算RSI指标
 */
function calculateRSI(prices: number[], period: number): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * 计算KDJ指标
 */
function calculateKDJ(highs: number[], lows: number[], closes: number[], n: number, m1: number, m2: number): any {
  const period = n - 1;
  if (closes.length < n) return { k: 50, d: 50, j: 50 };

  const lowN = Math.min(...lows.slice(-n));
  const highN = Math.max(...highs.slice(-n));
  
  if (highN === lowN) return { k: 50, d: 50, j: 50 };

  const rsv = ((closes[closes.length - 1] - lowN) / (highN - lowN)) * 100;
  
  // 简化的KDJ计算
  const k = rsv;
  const d = k;
  const j = 3 * k - 2 * d;

  return { k, d, j };
}

/**
 * 计算布林带
 */
function calculateBollingerBands(prices: number[], period: number, stdDev: number): any {
  if (prices.length < period) {
    const price = prices[0];
    return { middle: price, upper: price * 1.02, lower: price * 0.98 };
  }

  const slice = prices.slice(-period);
  const middle = slice.reduce((sum, p) => sum + p, 0) / period;
  
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    middle,
    upper: middle + stdDev * std,
    lower: middle - stdDev * std,
  };
}

/**
 * 计算移动平均线
 */
function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[0];
  const slice = prices.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

/**
 * 批量分析多维度因子
 */
export async function analyzeMultiDimensionalFactors(stocks: any[], klinesMap: Map<string, any[]>): Promise<any> {
  const results: any = {};

  for (const stock of stocks) {
    const code = stock.stock_code;
    
    try {
      // 获取各维度因子
      const marketSentiment = await getMarketSentimentFactor(code);
      const policyGuidance = await getPolicyGuidanceFactor(code, stock.industry);
      const capitalFlow = await getCapitalFlowFactor(code);
      const fundamentalMetrics = await getFundamentalMetricsFactor(code);
      const industryFactors = await getIndustryFactorsFactor(code);
      const klines = klinesMap.get(code);
      const advancedIndicators = klines ? 
        await getAdvancedIndicatorsFactor(klines) : null;

      results[code] = {
        market_sentiment: marketSentiment,
        policy_guidance: policyGuidance,
        capital_flow: capitalFlow,
        fundamental_metrics: fundamentalMetrics,
        industry_factors: industryFactors,
        advanced_indicators: advancedIndicators,
      };

      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`分析股票 ${code} 的多维度因子失败:`, error);
      results[code] = null;
    }
  }

  return results;
}
