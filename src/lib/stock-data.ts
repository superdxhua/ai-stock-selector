// 模拟股票数据

export interface Stock {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
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
];

// 生成模拟 K 线数据
function generateKLineData(basePrice: number, days: number = 90): KLineData[] {
  const data: KLineData[] = [];
  let price = basePrice;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const changePercent = (Math.random() - 0.48) * 0.06; // -3% 到 +3%
    const open = price;
    const close = price * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = Math.floor(Math.random() * 100000000 + 10000000);

    data.push({
      date: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
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
  const dea = Number((dif * 0.2).toFixed(4)); // 简化计算
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

// 获取股票详情
export function getStockDetail(code: string): StockDetail | null {
  const stock = stockList.find((s) => s.code === code);
  if (!stock) return null;

  const kline = generateKLineData(stock.price);
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
    case "bullish":
      // 看涨策略：涨幅 > 2%
      selected = stockList.filter((s) => s.changePercent > 2);
      break;
    case "value":
      // 价值策略：价格 < 50 且市值 > 1000亿
      selected = stockList.filter((s) => s.price < 50 && s.marketCap > 1000000000000);
      break;
    case "growth":
      // 成长策略：涨幅 > 0 且成交量 > 5000万
      selected = stockList.filter((s) => s.changePercent > 0 && s.volume > 50000000);
      break;
    case "large-cap":
      // 大盘股：市值 > 5000亿
      selected = stockList.filter((s) => s.marketCap > 5000000000000);
      break;
    default:
      selected = stockList;
  }

  return selected;
}
