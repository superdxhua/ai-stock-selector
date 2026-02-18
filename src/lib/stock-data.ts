// 模拟股票数据

export interface Stock {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  // 新增：策略评分
  trendScore?: number;
  volumeScore?: number;
}

export interface KLineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockDetail extends Stock {
  kline: KLineData[];
  indicators: {
    ma5: number[];
    ma10: number[];
    ma20: number[];
    macd: { dif: number; dea: number; bar: number };
    kdj: { k: number; d: number; j: number };
    rsi: number;
  };
}

// 模拟股票列表
export const stockList: Stock[] = [
  {
    code: "000001",
    name: "平安银行",
    price: 12.45,
    change: 0.23,
    changePercent: 1.88,
    volume: 52000000,
    marketCap: 2400000000000,
  },
  {
    code: "000002",
    name: "万科A",
    price: 18.67,
    change: -0.15,
    changePercent: -0.80,
    volume: 38000000,
    marketCap: 1800000000000,
  },
  {
    code: "600519",
    name: "贵州茅台",
    price: 1689.50,
    change: 12.30,
    changePercent: 0.73,
    volume: 2500000,
    marketCap: 21000000000000,
  },
  {
    code: "600036",
    name: "招商银行",
    price: 35.78,
    change: 0.85,
    changePercent: 2.43,
    volume: 67000000,
    marketCap: 9200000000000,
  },
  {
    code: "000858",
    name: "五粮液",
    price: 185.32,
    change: 3.25,
    changePercent: 1.78,
    volume: 4500000,
    marketCap: 7200000000000,
  },
  {
    code: "600276",
    name: "恒瑞医药",
    price: 52.18,
    change: 1.45,
    changePercent: 2.85,
    volume: 8900000,
    marketCap: 3300000000000,
  },
  {
    code: "002594",
    name: "比亚迪",
    price: 256.78,
    change: 8.92,
    changePercent: 3.60,
    volume: 15000000,
    marketCap: 7500000000000,
  },
  {
    code: "601318",
    name: "中国平安",
    price: 48.56,
    change: 1.23,
    changePercent: 2.60,
    volume: 82000000,
    marketCap: 8900000000000,
  },
  {
    code: "000725",
    name: "京东方A",
    price: 4.28,
    change: 0.35,
    changePercent: 8.90,
    volume: 180000000,
    marketCap: 1500000000000,
  },
  {
    code: "300750",
    name: "宁德时代",
    price: 185.50,
    change: 15.20,
    changePercent: 8.93,
    volume: 25000000,
    marketCap: 8100000000000,
  },
];

// 生成模拟 K 线数据（支持指定趋势）
function generateKLineData(
  basePrice: number,
  days: number = 30,
  trend: "up" | "down" | "neutral" = "neutral"
): KLineData[] {
  const data: KLineData[] = [];
  let price = basePrice;
  const now = new Date();

  // 根据趋势调整涨跌概率
  const upProbability = trend === "up" ? 0.65 : trend === "down" ? 0.35 : 0.48;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const isUp = Math.random() < upProbability;
    const maxChange = isUp ? 0.06 : 0.04;
    const changePercent = isUp
      ? Math.random() * maxChange
      : -Math.random() * maxChange;

    const open = price;
    const close = price * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);

    // 趋势股成交量放大
    const baseVolume = Math.random() * 100000000 + 10000000;
    const volume =
      trend !== "neutral"
        ? baseVolume * (1 + Math.random() * 1.5)
        : baseVolume;

    data.push({
      date: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(volume),
    });

    price = close;
  }

  return data;
}

// 计算移动平均线
function calculateMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(Number((sum / period).toFixed(2)));
    }
  }
  return result;
}

// 计算技术指标
function calculateIndicators(kline: KLineData[]) {
  const closes = kline.map((d) => d.close);

  // 移动平均线
  const ma5 = calculateMA(closes, 5);
  const ma10 = calculateMA(closes, 10);
  const ma20 = calculateMA(closes, 20);

  // RSI (简化版)
  let gains = 0;
  let losses = 0;
  const period = 14;
  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  const rs = gains / (losses || 1);
  const rsi = Number((100 - 100 / (1 + rs)).toFixed(2));

  // MACD (简化版)
  const ema12 = calculateMA(closes, 12);
  const ema26 = calculateMA(closes, 26);
  const dif = Number((ema12[ema12.length - 1] - ema26[ema26.length - 1]).toFixed(4));
  const dea = Number((dif * 0.2).toFixed(4));
  const bar = Number(((dif - dea) * 2).toFixed(4));

  // KDJ (简化版)
  const recent = kline.slice(-9);
  const high9 = Math.max(...recent.map((d) => d.high));
  const low9 = Math.min(...recent.map((d) => d.low));
  const close9 = recent[recent.length - 1].close;
  const rsv = ((close9 - low9) / (high9 - low9 || 1)) * 100;
  const k = Number((rsv * 0.3333 + 50 * 0.6667).toFixed(2));
  const d = Number((k * 0.3333 + 50 * 0.6667).toFixed(2));
  const j = Number((3 * k - 2 * d).toFixed(2));

  return {
    ma5,
    ma10,
    ma20,
    macd: { dif, dea, bar },
    kdj: { k, d, j },
    rsi,
  };
}

// 计算5日趋势核心评分
function calculate5DayTrendScore(kline: KLineData[]): number {
  const recent5 = kline.slice(-5);
  if (recent5.length < 5) return 0;

  let score = 0;

  // 1. 连阳天数 (权重30)
  let consecutiveUp = 0;
  for (let i = recent5.length - 1; i >= 0; i--) {
    if (recent5[i].close > recent5[i].open) {
      consecutiveUp++;
    } else {
      break;
    }
  }
  score += Math.min(30, consecutiveUp * 10);

  // 2. 5日涨幅 (权重25)
  const startPrice = recent5[0].close;
  const endPrice = recent5[recent5.length - 1].close;
  const changePercent = ((endPrice - startPrice) / startPrice) * 100;
  if (changePercent > 8) score += 25;
  else if (changePercent > 5) score += 20;
  else if (changePercent > 3) score += 15;
  else if (changePercent > 1) score += 10;
  else if (changePercent > 0) score += 5;

  // 3. 技术形态 (权重25)
  const closes = recent5.map((d) => d.close);
  const ma5 = calculateMA(closes, 5);
  const lastMA5 = ma5[ma5.length - 1];

  // 价格在MA5上方
  if (endPrice > lastMA5 && !isNaN(lastMA5)) {
    score += 10;
  }

  // 4. MACD金叉 (权重20)
  const indicators = calculateIndicators(kline);
  if (indicators.macd.dif > indicators.macd.dea && indicators.macd.bar > 0) {
    score += 20;
  }

  return Math.min(100, score);
}

// 计算5日容量核心评分
function calculate5DayVolumeScore(kline: KLineData[], stockPrice: number): number {
  const recent5 = kline.slice(-5);
  if (recent5.length < 5) return 0;

  let score = 0;

  // 1. 5日均量倍数 (权重35) - 降低门槛
  const recent5Volume = recent5.map((d) => d.volume);
  const avg5Volume =
    recent5Volume.reduce((a, b) => a + b, 0) / recent5Volume.length;

  const recent10 = kline.slice(-10);
  if (recent10.length >= 10) {
    const recent10Volume = recent10.map((d) => d.volume);
    const avg10Volume =
      recent10Volume.reduce((a, b) => a + b, 0) / recent10Volume.length;

    const volumeRatio = avg5Volume / (avg10Volume || 1);
    if (volumeRatio > 2.0) score += 35;
    else if (volumeRatio > 1.5) score += 30;
    else if (volumeRatio > 1.2) score += 25;
    else if (volumeRatio > 1.0) score += 20;
    else if (volumeRatio > 0.8) score += 15;
  }

  // 2. 换手率 (权重25) - 降低门槛，简化计算
  const avgVolume = avg5Volume;
  // 基于市值估算换手率
  const turnoverRate = (avgVolume / 100000000) * 100; // 以1亿为基准

  if (turnoverRate > 10) score += 25;
  else if (turnoverRate > 7) score += 20;
  else if (turnoverRate > 5) score += 15;
  else if (turnoverRate > 3) score += 10;
  else if (turnoverRate > 2) score += 5;

  // 3. 成交量递增 (权重20) - 降低门槛
  let increasingDays = 0;
  for (let i = 1; i < recent5.length; i++) {
    if (recent5[i].volume > recent5[i - 1].volume) {
      increasingDays++;
    }
  }
  if (increasingDays >= 4) score += 20;
  else if (increasingDays >= 3) score += 18;
  else if (increasingDays >= 2) score += 15;
  else if (increasingDays >= 1) score += 10;

  // 4. 量价配合 (权重20) - 降低门槛
  const priceUpDays = recent5.filter((d) => d.close > d.open).length;
  if (priceUpDays >= 4 && avgVolume > 30000000) score += 20;
  else if (priceUpDays >= 3 && avgVolume > 20000000) score += 18;
  else if (priceUpDays >= 2 && avgVolume > 10000000) score += 15;
  else if (priceUpDays >= 1 && avgVolume > 5000000) score += 10;

  return Math.min(100, score);
}

// 获取股票详情
export function getStockDetail(code: string): StockDetail | null {
  const stock = stockList.find((s) => s.code === code);
  if (!stock) return null;

  // 根据股票特点生成对应趋势的K线
  let trend: "up" | "down" | "neutral" = "neutral";
  if (stock.changePercent > 3) trend = "up";
  else if (stock.changePercent < -2) trend = "down";

  const kline = generateKLineData(stock.price, 30, trend);
  const indicators = calculateIndicators(kline);

  return {
    ...stock,
    kline,
    indicators,
  };
}

// 获取股票列表
export function getStockList(): Stock[] {
  return stockList;
}

// 选股策略
export function selectStocks(strategy: string): Stock[] {
  let selected: Stock[] = [];

  switch (strategy) {
    case "large-cap":
      // 大盘股：市值 > 5000亿
      selected = stockList.filter((s) => s.marketCap > 5000000000000);
      break;
    case "5day-trend":
      // 5日趋势核心
      selected = stockList
        .map((stock) => {
          const kline = generateKLineData(
            stock.price,
            30,
            stock.changePercent > 1 ? "up" : "neutral"
          );
          const score = calculate5DayTrendScore(kline);
          return { ...stock, trendScore: score };
        })
        .filter((s) => s.trendScore && s.trendScore >= 50)
        .sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
      break;
    case "5day-volume":
      // 5日容量核心
      selected = stockList
        .map((stock) => {
          const kline = generateKLineData(
            stock.price,
            30,
            stock.changePercent > 0 ? "up" : "neutral"
          );
          const score = calculate5DayVolumeScore(kline, stock.price);
          return { ...stock, volumeScore: score };
        })
        .filter((s) => s.volumeScore && s.volumeScore >= 50)
        .sort((a, b) => (b.volumeScore || 0) - (a.volumeScore || 0));
      break;
    default:
      selected = stockList;
  }

  return selected;
}
