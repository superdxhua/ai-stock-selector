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
 * 检查是否有涨停板
 * @param klines K线数据
 * @param days 检查天数，默认5天
 * @param limitUpRate 涨停阈值，默认9.9%
 */
export function checkLimitUp(klines: KLineData[], days: number = 5, limitUpRate: number = 9.9): boolean {
  if (klines.length < 2) return false;

  const checkDays = Math.min(days, klines.length);

  for (let i = klines.length - 1; i >= klines.length - checkDays; i--) {
    const prevClose = klines[i - 1].close;
    const changePercent = ((klines[i].close - prevClose) / prevClose) * 100;

    if (changePercent >= limitUpRate) {
      return true;
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
 */
export function performTechnicalAnalysis(klines: KLineData[]): TechnicalAnalysis {
  // 基础指标
  const consecutiveRises = calculateConsecutiveRises(klines);
  const price5DayChange = calculate5DayChange(klines);
  const hasLimitUp = checkLimitUp(klines, 5);

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

  // 计算5日趋势核心评分
  let trendScore = 0;
  if (hasLimitUp) trendScore += 25; // 有涨停
  if (consecutiveRises >= 3) trendScore += 20; // 连续3天以上上涨
  if (price5DayChange > 3) trendScore += 15; // 5日涨幅>3%
  if (priceAboveMA5) trendScore += 10; // 价格在MA5上方
  if (macdGoldenCross) trendScore += 20; // MACD金叉
  trendScore = Math.min(trendScore, 100);

  // 计算5日容量核心评分
  let volumeScore = 0;
  if (hasLimitUp) volumeScore += 25; // 有涨停
  if (volumeTrend.isIncreasing) volumeScore += 35; // 均量倍数>1.2
  const currentVolume = klines[klines.length - 1].volume;
  const avgVolume = volumeTrend.avg10Day;
  const turnoverRate = (currentVolume / (currentPrice * 100000000)) * 100;
  if (turnoverRate > 3) volumeScore += 25; // 换手率>3%
  if (priceVolumeCorrelation > 50) volumeScore += 15; // 量价配合良好
  volumeScore = Math.min(volumeScore, 100);

  // 计算龙头精选评分
  let leaderScore = 0;
  if (hasLimitUp) leaderScore += 25; // 有涨停
  if (consecutiveRises >= 3) leaderScore += 15; // 连续上涨
  if (volumeTrend.isIncreasing) leaderScore += 25; // 成交量堆积
  if (price5DayChange > 5) leaderScore += 20; // 大幅上涨
  if (priceVolumeCorrelation > 60) leaderScore += 15; // 量价齐升
  leaderScore = Math.min(leaderScore, 100);

  return {
    consecutiveRises,
    price5DayChange,
    hasLimitUp,
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
