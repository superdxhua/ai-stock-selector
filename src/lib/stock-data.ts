/**
 * 东方财富股票数据获取模块
 * 
 * 本应用默认使用东方财富作为数据源
 * 提供沪深A股实时行情、技术指标分析等功能
 * 
 * 数据来源：东方财富 (https://www.eastmoney.com)
 * 更新频率：实时
 */

import { DEFAULT_DATA_SOURCE } from './data-source-config';

// 确认使用东方财富作为默认数据源
if (DEFAULT_DATA_SOURCE !== "eastmoney") {
  console.warn("警告：数据源配置与实际使用不一致");
}

// 东方财富API配置
const EASTMONEY_API = {
  // 获取股票列表
  stockList: "https://push2.eastmoney.com/api/qt/clist/get",
  // 获取单股票详情
  stockDetail: "https://push2.eastmoney.com/api/qt/stock/get",
};

// 常用股票代码列表（用于筛选）
export const COMMON_STOCKS = [
  // 白酒
  "600519", "000858", "000568", "002304", "600809",
  // 医药
  "603259", "300750", "000661", "002007", "002422",
  // 新能源
  "002594", "300014", "688111", "601012", "300274",
  // 券商
  "600030", "300059", "601688", "000166", "002736",
  // 保险
  "601318", "601601", "601628", "601336",
  // 银行
  "600036", "000001", "002142", "601166", "600000",
  // 电子
  "002415", "000725", "688981", "002371", "300474",
  // 消费
  "601888", "000333", "002714", "603288", "600887",
  // 化工
  "600309", "002648", "600346", "002493", "603260",
  // 机械
  "000651", "002475", "300124", "600031", "002202",
];

export interface StockBasicInfo {
  f12: string; // 股票代码
  f14: string; // 股票名称
  f2: number; // 最新价
  f3: number; // 涨跌幅
  f4: number; // 昨收盘价
  f5: number; // 量比
  f6: number; // 涨跌额
  f7: number; // 成交量（旧字段，可能不准确）
  f8: number; // 振幅
  f9: number; // 最高
  f10: number; // 最低
  f11: number; // 今开
  f15: number; // 最高
  f16: number; // 最低
  f17: number; // 成交额
  f18: number; // 换手率
  f20: number; // 总市值
  f21: number; // 流通市值
  f22: number; // 市盈率
  f23: number; // 市净率
  f38: number; // 成交量（手，准确）
}

export interface KLineData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  amount: number;
}

/**
 * 获取股票列表数据
 */
export async function getStockList(): Promise<StockBasicInfo[]> {
  try {
    const params = new URLSearchParams({
      pn: "1",
      pz: "500",
      po: "1",
      np: "1",
      fltt: "2",
      invt: "2",
      fid: "f3",
      fs: "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23",
      fields: "f12,f14,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f15,f16,f17,f18,f20,f21,f22,f23,f38,f40",
    });

    const response = await fetch(`${EASTMONEY_API.stockList}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const data = await response.json();

    if (data?.data?.diff) {
      return data.data.diff;
    }

    return [];
  } catch (error) {
    console.error("获取股票列表失败:", error);
    throw error;
  }
}

/**
 * 获取指定股票数据
 */
export async function getStockDetail(codes: string[]): Promise<StockBasicInfo[]> {
  try {
    const securities = codes.map(code => {
      const market = code.startsWith('6') ? '1.0.' : '0.0.';
      return `${market}${code}`;
    }).join(',');

    const params = new URLSearchParams({
      fields: "f12,f14,f3,f4,f5,f6,f7,f8,f9,f10,f11,f15,f16,f17,f18,f20,f21,f22,f23",
      secids: securities,
    });

    const response = await fetch(`${EASTMONEY_API.stockDetail}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const data = await response.json();

    if (data?.data) {
      return Object.values(data.data) as StockBasicInfo[];
    }

    return [];
  } catch (error) {
    console.error("获取股票详情失败:", error);
    throw error;
  }
}

/**
 * 获取K线数据（目前使用模拟数据）
 */
export async function getKLineData(
  code: string,
  period: "101" | "102" | "103" = "101"
): Promise<KLineData[]> {
  // TODO: 替换为真实的K线数据API
  // 由于东方财富K线API路径可能需要调整，暂时使用模拟数据
  console.warn(`股票 ${code} 使用模拟K线数据`);
  
  const days = 60;
  const klines: KLineData[] = [];
  const now = new Date();
  
  // 生成模拟K线数据
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const basePrice = 10 + Math.random() * 20;
    const volatility = basePrice * 0.05;
    
    klines.push({
      date: date.toISOString().split('T')[0],
      open: basePrice + (Math.random() - 0.5) * volatility,
      close: basePrice + (Math.random() - 0.5) * volatility,
      high: basePrice + volatility * 0.8,
      low: basePrice - volatility * 0.8,
      volume: Math.floor(Math.random() * 100000000) + 10000000,
      amount: Math.floor(Math.random() * 1000000000) + 100000000,
    });
  }
  
  return klines;
}

/**
 * 格式化股票数据
 */
export function formatStockData(stock: StockBasicInfo) {
  // 计算涨跌额
  const price = stock.f2 || stock.f4; // 优先使用f2（最新价），否则使用f4
  const changePercent = stock.f3;
  const prevClose = price / (1 + changePercent / 100);
  const change = price - prevClose;

  return {
    code: stock.f12,
    name: stock.f14,
    price: price,
    change: change,
    changePercent: changePercent,
    volume: Math.round((stock.f40 || 0) / price), // 成交量（股）= 成交额（元）/ 价格
    marketCap: stock.f20, // f20字段已经是元为单位
    amount: (stock.f40 || 0) / 10000, // 成交额（万元）
    turnoverRate: stock.f18, // 换手率
    high: stock.f9,
    low: stock.f10,
    open: stock.f11,
    turnoverRate: stock.f18,
    volumeRatio: stock.f5,
    pe: stock.f22,
    pb: stock.f23,
    amplitude: stock.f8,
  };
}
