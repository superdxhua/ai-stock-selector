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
  f5: number; // 成交量（手）
  f6: number; // 成交额（元）
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
  f38: number; // 成交量（手，备用）
  f40: number; // 成交额（元，备用）
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
 * 获取K线数据
 * 使用新浪财经K线API获取真实数据
 */
export async function getKLineData(
  code: string,
  period: "101" | "102" | "103" = "101"
): Promise<KLineData[]> {
  try {
    // 构建新浪K线API URL
    // 101: 日K线, 102: 周K线, 103: 月K线
    // 根据股票代码构建symbol: sh开头为沪市, sz开头为深市
    const market = code.startsWith('6') ? 'sh' : 'sz';
    const symbol = `${market}${code}`;
    
    // 请求120天数据，确保有足够的数据进行技术分析
    const url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=240&ma=no&datalen=120`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn(`股票 ${code} 未获取到K线数据`);
      return [];
    }

    // 转换数据格式
    const klines: KLineData[] = data.map((item: any) => ({
      date: item.day,
      open: parseFloat(item.open),
      close: parseFloat(item.close),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      volume: parseInt(item.volume), // 成交量（股）
      amount: 0, // 新浪API不返回成交额，可以后续根据成交量*价格计算
    }));

    console.log(`股票 ${code} 获取到 ${klines.length} 条K线数据`);
    
    return klines;
  } catch (error) {
    console.error(`获取股票 ${code} K线数据失败:`, error);
    return [];
  }
}

/**
 * 获取单只股票的实时数据
 * @param stockCode 股票代码
 * @returns 股票基本信息
 */
export async function getStockRealTimeData(stockCode: string): Promise<StockBasicInfo | null> {
  try {
    const data = await getStockList();
    const stock = data.find((s: StockBasicInfo) => s.f12 === stockCode);
    return stock || null;
  } catch (error) {
    console.error('获取实时数据失败:', error);
    return null;
  }
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
    volume: Math.round((stock.f5 || 0) * 100), // 成交量（股）= 成交量（手）* 100
    marketCap: stock.f21 || stock.f20, // f21流通市值（元），如果没有则使用f20总市值
    amount: (stock.f6 || 0) / 100000000, // 成交额（亿元）
    turnoverRate: stock.f18, // 换手率
    high: stock.f9,
    low: stock.f10,
    open: stock.f11,
    volumeRatio: stock.f7 || 0, // 量比（使用f7字段）
    pe: stock.f22,
    pb: stock.f23,
    amplitude: stock.f8,
  };
}
