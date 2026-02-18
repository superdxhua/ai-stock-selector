/**
 * 技术指标计算模块
 */

import { KLineData } from "./stock-data";

/**
 * 计算移动平均线
 */
export function calculateMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * 计算EMA指数移动平均
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(data[i]);
    } else {
      const ema = (data[i] - result[i - 1]) * multiplier + result[i - 1];
      result.push(ema);
    }
  }
  return result;
}

/**
 * 计算MACD
 * @param klines K线数据
 * @returns { dif, dea, macd } DIF、DEA、MACD柱状图
 */
export function calculateMACD(klines: KLineData[]) {
  if (klines.length < 35) {
    return { dif: [], dea: [], macd: [] };
  }

  const closes = klines.map(k => k.close);

  // 计算EMA
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  // 计算DIF
  const dif = ema12.map((val, idx) => val - ema26[idx]);

  // 计算DEA
  const dea = calculateEMA(dif, 9);

  // 计算MACD柱状图
  const macd = dif.map((val, idx) => (val - dea[idx]) * 2);

  return { dif, dea, macd };
}

/**
 * 计算RSI相对强弱指标
 * @param klines K线数据
 * @param period 周期，默认14
 */
export function calculateRSI(klines: KLineData[], period: number = 14): number[] {
  if (klines.length < period) {
    return new Array(klines.length).fill(0);
  }

  const closes = klines.map(k => k.close);
  const result: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      result.push(0);
    } else {
      let gains = 0;
      let losses = 0;

      for (let j = i - period + 1; j <= i; j++) {
        const change = closes[j] - closes[j - 1];
        if (change > 0) {
          gains += change;
        } else {
          losses += Math.abs(change);
        }
      }

      const avgGain = gains / period;
      const avgLoss = losses / period;

      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
      }
    }
  }

  return result;
}

/**
 * 计算KDJ随机指标
 * @param klines K线数据
 * @returns { k, d, j } K、D、J值
 */
export function calculateKDJ(klines: KLineData[], n: number = 9, m1: number = 3, m2: number = 3) {
  if (klines.length < n) {
    return { k: [], d: [], j: [] };
  }

  const kValues: number[] = [];
  const dValues: number[] = [];
  const jValues: number[] = [];

  let prevK = 50;
  let prevD = 50;

  for (let i = 0; i < klines.length; i++) {
    if (i < n - 1) {
      kValues.push(0);
      dValues.push(0);
      jValues.push(0);
    } else {
      // 计算RSV
      let high = klines[i].high;
      let low = klines[i].low;

      for (let j = i - n + 1; j <= i; j++) {
        high = Math.max(high, klines[j].high);
        low = Math.min(low, klines[j].low);
      }

      const rsv = ((klines[i].close - low) / (high - low)) * 100;

      // 计算K值
      const k = (rsv + (m1 - 1) * prevK) / m1;
      prevK = k;

      // 计算D值
      const d = (k + (m2 - 1) * prevD) / m2;
      prevD = d;

      // 计算J值
      const j = 3 * k - 2 * d;

      kValues.push(k);
      dValues.push(d);
      jValues.push(j);
    }
  }

  return { k: kValues, d: dValues, j: jValues };
}

/**
 * 检查MACD金叉
 */
export function checkMACDGoldenCross(macdData: { dif: number[]; dea: number[] }): boolean {
  const { dif, dea } = macdData;
  if (dif.length < 2 || dea.length < 2) return false;

  const lastIdx = dif.length - 1;
  const prevIdx = dif.length - 2;

  // DIF上穿DEA，且都在0轴上方
  return (
    dif[prevIdx] <= dea[prevIdx] &&
    dif[lastIdx] > dea[lastIdx] &&
    dif[lastIdx] > 0
  );
}

/**
 * 检查价格在均线上方
 */
export function checkPriceAboveMA(price: number, ma: number): boolean {
  return price > ma;
}

/**
 * 计算连涨天数
 */
export function calculateConsecutiveRises(klines: KLineData[]): number {
  let count = 0;
  for (let i = klines.length - 1; i >= 1; i--) {
    if (klines[i].close > klines[i - 1].close) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

/**
 * 计算5日涨幅
 */
export function calculate5DayChange(klines: KLineData[]): number {
  if (klines.length < 5) return 0;

  const closePrice = klines[klines.length - 1].close;
  const prevClose = klines[klines.length - 5].close;

  return ((closePrice - prevClose) / prevClose) * 100;
}

/**
 * 检查是否为一字板涨停
 * 一字板特征：涨停且成交量异常低（换手率<1%）
 */
export function checkIsOneSidedLimitUp(
  klines: KLineData[],
  limitUpRate: number = 9.9
): boolean {
  if (klines.length < 2) return false;

  const lastKline = klines[klines.length - 1];
  const prevClose = klines[klines.length - 2].close;

  // 检查是否涨停
  const changePercent = ((lastKline.close - prevClose) / prevClose) * 100;
  if (changePercent < limitUpRate) return false;

  // 检查换手率是否异常低（<1%）
  // 假设流通股本约10亿股，计算换手率
  const turnoverRate = (lastKline.volume / (lastKline.close * 100000000)) * 100;

  // 一字板通常换手率很低（<1.5%）
  return turnoverRate < 1.5;
}

/**
 * 获取涨停板阈值
 * @param stockCode 股票代码
 * @returns 涨停板阈值（百分比）
 */
export function getLimitUpThreshold(stockCode: string): number {
  // 创业板（300开头）和科创板（688开头）的涨停板为20%
  // 主板（600、000、002开头）的涨停板为10%
  if (stockCode.startsWith('300') || stockCode.startsWith('688')) {
    return 19.9; // 创业板和科创板涨停板约为19.9%
  }
  return 9.9; // 主板涨停板约为9.9%
}

/**
 * 检查涨停
 * @param klines K线数据
 * @param days 检查天数，默认5天（包括最新交易日）
 * @param stockCode 股票代码，用于判断涨停板阈值
 */
export function checkLimitUp(klines: KLineData[], days: number = 5, stockCode?: string): boolean {
  if (klines.length < 1) return false;

  const limitUpRate = stockCode ? getLimitUpThreshold(stockCode) : 9.9;
  const checkDays = Math.min(days, klines.length);

  // 检查最近N个交易日（包括今天）
  for (let i = klines.length - 1; i >= klines.length - checkDays; i--) {
    if (i === 0) {
      // 第一天数据，无法计算涨跌幅
      const open = klines[i].open;
      const high = klines[i].high;
      const close = klines[i].close;
      // 如果开盘即涨停（一字板），或者收盘价达到涨停
      const changePercent = ((high - open) / open) * 100;
      if (changePercent >= limitUpRate) {
        return true;
      }
    } else {
      const prevClose = klines[i - 1].close;
      const changePercent = ((klines[i].close - prevClose) / prevClose) * 100;

      if (changePercent >= limitUpRate) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 计算成交量变化趋势
 */
export function calculateVolumeTrend(klines: KLineData[]): {
  isIncreasing: boolean;
  avg5Day: number;
  avg10Day: number;
} {
  if (klines.length < 10) {
    return { isIncreasing: false, avg5Day: 0, avg10Day: 0 };
  }

  const recent5Days = klines.slice(-5).map(k => k.volume);
  const recent10Days = klines.slice(-10).map(k => k.volume);

  const avg5Day = recent5Days.reduce((a, b) => a + b, 0) / 5;
  const avg10Day = recent10Days.reduce((a, b) => a + b, 0) / 10;

  // 5日均量大于10日均量的1.2倍
  return {
    isIncreasing: avg5Day > avg10Day * 1.2,
    avg5Day,
    avg10Day,
  };
}

/**
 * 计算量价配合度
 */
export function calculatePriceVolumeCorrelation(klines: KLineData[]): number {
  if (klines.length < 5) return 0;

  const recent5Days = klines.slice(-5);

  let score = 0;
  for (let i = 1; i < recent5Days.length; i++) {
    const priceChange = recent5Days[i].close - recent5Days[i - 1].close;
    const volumeChange = recent5Days[i].volume - recent5Days[i - 1].volume;

    // 价格上涨且成交量增加
    if (priceChange > 0 && volumeChange > 0) {
      score += 20;
    }
    // 价格下跌且成交量减少
    else if (priceChange < 0 && volumeChange < 0) {
      score += 10;
    }
  }

  return Math.min(score, 100);
}

/**
 * 技术分析结果
 */
export interface TechnicalAnalysis {
  // 趋势指标
  consecutiveRises: number;
  price5DayChange: number;
  hasLimitUp: boolean;
  isOneSidedLimitUp: boolean; // 是否为一字板涨停

  // MACD
  macdDif: number;
  macdDea: number;
  macdGoldenCross: boolean;

  // KDJ
  kdjK: number;
  kdjD: number;
  kdjJ: number;

  // RSI
  rsi: number;

  // 均线
  ma5: number;
  ma10: number;
  ma20: number;
  priceAboveMA5: boolean;

  // 成交量
  volume5DayAvg: number;
  volume10DayAvg: number;
  volumeIncreasing: boolean;
  priceVolumeCorrelation: number;

  // 综合评分
  trendScore: number;
  volumeScore: number;
  leaderScore: number;

  // 大牛股特征
  bullScore?: number;
  bullPotential?: 'high' | 'medium' | 'low' | 'none';
  bullFeatures?: string[];
}

/**
 * 进行综合技术分析
 * @param klines K线数据
 * @param stockCode 股票代码，用于判断涨停板阈值
 */
export function performTechnicalAnalysis(klines: KLineData[], stockCode?: string): TechnicalAnalysis {
  // 基础指标
  const consecutiveRises = calculateConsecutiveRises(klines);
  const price5DayChange = calculate5DayChange(klines);
  const limitUpRate = stockCode ? getLimitUpThreshold(stockCode) : 9.9;
  const hasLimitUp = checkLimitUp(klines, 5, stockCode);
  const isOneSidedLimitUp = checkIsOneSidedLimitUp(klines, limitUpRate);

  // MACD
  const macdData = calculateMACD(klines);
  const macdDif = macdData.dif[macdData.dif.length - 1] || 0;
  const macdDea = macdData.dea[macdData.dea.length - 1] || 0;
  const macdGoldenCross = checkMACDGoldenCross(macdData);

  // KDJ
  const kdjData = calculateKDJ(klines);
  const kdjK = kdjData.k[kdjData.k.length - 1] || 0;
  const kdjD = kdjData.d[kdjData.d.length - 1] || 0;
  const kdjJ = kdjData.j[kdjData.j.length - 1] || 0;

  // RSI
  const rsiData = calculateRSI(klines, 14);
  const rsi = rsiData[rsiData.length - 1] || 0;

  // 均线
  const closes = klines.map(k => k.close);
  const ma5 = calculateMA(closes, 5)[closes.length - 1] || 0;
  const ma10 = calculateMA(closes, 10)[closes.length - 1] || 0;
  const ma20 = calculateMA(closes, 20)[closes.length - 1] || 0;
  const currentPrice = klines[klines.length - 1].close;
  const priceAboveMA5 = currentPrice > ma5;

  // 成交量
  const volumeTrend = calculateVolumeTrend(klines);
  const priceVolumeCorrelation = calculatePriceVolumeCorrelation(klines);
  const volumeRatio = volumeTrend.avg10Day > 0 ? volumeTrend.avg5Day / volumeTrend.avg10Day : 0; // 5日/10日均量比

  // 计算5日趋势核心评分
  let trendScore = 0;
  // 一字板惩罚：一字板的趋势评分大幅降低，因为流动性差
  const oneSidedPenalty = isOneSidedLimitUp ? 0.3 : 1.0;

  if (hasLimitUp && !isOneSidedLimitUp) trendScore += 25; // 有涨停（排除一字板）
  if (consecutiveRises >= 3) trendScore += 20; // 连续3天以上上涨
  if (price5DayChange > 3) trendScore += 15; // 5日涨幅>3%
  if (priceAboveMA5) trendScore += 10; // 价格在MA5上方
  if (macdGoldenCross) trendScore += 20; // MACD金叉

  // 成交量评分（5日趋势核心策略也要求成交量活跃）
  if (volumeRatio >= 1.5) trendScore += 20; // 5日/10日均量比≥1.5倍，明显的成交量堆积
  else if (volumeRatio >= 1.3) trendScore += 15; // 5日/10日均量比≥1.3倍，成交量较好
  else if (volumeRatio >= 1.2) trendScore += 10; // 5日/10日均量比≥1.2倍，成交量正常
  else if (volumeRatio < 1.1) trendScore -= 15; // 5日/10日均量比<1.1倍，成交量低迷，惩罚15分

  trendScore = Math.min(Math.round(trendScore * oneSidedPenalty), 100);

  // 计算5日容量核心评分
  let volumeScore = 0;
  // 一字板惩罚：一字板的容量评分应该非常低，因为成交量不足
  const oneSidedVolumePenalty = isOneSidedLimitUp ? 0.2 : 1.0;

  if (hasLimitUp && !isOneSidedLimitUp) volumeScore += 25; // 有涨停（排除一字板）
  if (volumeTrend.isIncreasing) volumeScore += 35; // 均量倍数>1.2
  const currentVolume = klines[klines.length - 1].volume;
  const avgVolume = volumeTrend.avg10Day;
  const turnoverRate = (currentVolume / (currentPrice * 100000000)) * 100;

  // 换手率评分
  if (turnoverRate > 5) volumeScore += 25; // 换手率>5%（活跃）
  else if (turnoverRate > 3) volumeScore += 20; // 换手率>3%（正常）
  else if (turnoverRate > 1.5) volumeScore += 10; // 换手率>1.5%（一般）
  // 一字板换手率<1.5%，不会得分

  if (priceVolumeCorrelation > 50) volumeScore += 15; // 量价配合良好
  volumeScore = Math.min(Math.round(volumeScore * oneSidedVolumePenalty), 100);

  // 计算龙头精选评分
  let leaderScore = 0;
  // 一字板惩罚：一字板的龙头评分大幅降低
  const oneSidedLeaderPenalty = isOneSidedLimitUp ? 0.25 : 1.0;

  if (hasLimitUp && !isOneSidedLimitUp) leaderScore += 25; // 有涨停（排除一字板）
  if (consecutiveRises >= 3) leaderScore += 15; // 连续上涨
  if (volumeTrend.isIncreasing) leaderScore += 25; // 成交量堆积
  if (price5DayChange > 5) leaderScore += 20; // 大幅上涨
  if (priceVolumeCorrelation > 60) leaderScore += 15; // 量价齐升
  leaderScore = Math.min(Math.round(leaderScore * oneSidedLeaderPenalty), 100);

  return {
    consecutiveRises,
    price5DayChange,
    hasLimitUp,
    isOneSidedLimitUp,
    macdDif,
    macdDea,
    macdGoldenCross,
    kdjK,
    kdjD,
    kdjJ,
    rsi,
    ma5,
    ma10,
    ma20,
    priceAboveMA5,
    volume5DayAvg: volumeTrend.avg5Day,
    volume10DayAvg: volumeTrend.avg10Day,
    volumeIncreasing: volumeTrend.isIncreasing,
    priceVolumeCorrelation,
    trendScore,
    volumeScore,
    leaderScore,
  };
}
