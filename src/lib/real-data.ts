// 真实股票数据获取模块（东方财富API）

export interface RealKLineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number; // 成交额
  changePercent: number; // 涨跌幅
}

/**
 * 根据股票代码获取历史K线数据
 * @param stockCode 股票代码（6位数字）
 * @param days 获取天数，默认30天
 * @param adjustPrice 是否复权，默认前复权
 */
export async function getRealStockKLine(
  stockCode: string,
  days: number = 30,
  adjustPrice: boolean = true
): Promise<RealKLineData[]> {
  try {
    // 判断市场
    const market = stockCode.startsWith('6') ? '1' : '0'; // 6开头为上海，其他为深圳
    const secid = `${market}.${stockCode}`;

    // 计算开始日期（向前推days天）
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const beg = formatDate(startDate).replace(/-/g, '');
    const end = formatDate(endDate).replace(/-/g, '');

    // 东方财富历史K线API
    const url = `http://push2his.eastmoney.com/api/qt/stock/klt?fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=${adjustPrice ? 1 : 0}&secid=${secid}&beg=${beg}&end=${end}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const data = await response.json();

    if (!data.data?.diff) {
      console.warn(`Failed to fetch K-line data for ${stockCode}`);
      return [];
    }

    // 解析数据
    const klineData: RealKLineData[] = data.data.diff.map((item: any) => ({
      date: item.f5 || item.f51, // 日期
      open: item.f56, // 开盘价
      high: item.f54, // 最高价
      low: item.f55, // 最低价
      close: item.f57, // 收盘价
      volume: item.f58, // 成交量
      amount: item.f59, // 成交额
      changePercent: item.f60 || 0, // 涨跌幅
    })).reverse(); // 按时间正序排列

    return klineData;
  } catch (error) {
    console.error('Error fetching real stock K-line:', error);
    return [];
  }
}

/**
 * 获取股票基本信息
 * @param stockCode 股票代码
 */
export async function getRealStockInfo(stockCode: string): Promise<{
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
} | null> {
  try {
    const market = stockCode.startsWith('6') ? '1' : '0';
    const secid = `${market}.${stockCode}`;

    const url = `http://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f43,f44,f45,f46,f47,f48,f49,f50,f57,f58,f107,f116,f117,f127,f162,f163,f164,f166,f167,f168,f169,f170,f171,f172,f173,f174,f175,f176,f177,f178,f179,f180,f181,f182,f183,f184,f185,f186,f187,f188,f189,f190,f191,f192,f193,f194,f195,f196,f197,f198,f199,f200,f201,f202,f203,f204,f205,f206,f207,f208,f209,f210,f211,f212,f213,f214,f215,f216,f217,f218,f219,f220,f221,f222,f223,f224,f225,f226,f227,f228,f229,f230,f231,f232,f233,f234,f235,f236,f237,f238,f239,f240,f241,f242,f243,f244,f245,f246,f247,f248,f249,f250,f251,f252,f253,f254,f255,f256,f257,f258,f259,f260,f261,f262,f263,f264,f265,f266,f267,f268,f269,f270,f271,f272,f273,f274,f275,f276,f277,f278,f279,f280,f281,f282,f283,f284,f285,f286,f287,f288,f289,f290,f291,f292,f293,f294,f295,f296,f297,f298,f299,f300`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const data = await response.json();

    if (!data.data) {
      return null;
    }

    const stockData = data.data;

    return {
      name: stockData.f58 || '', // 股票名称
      price: stockData.f43 || 0, // 最新价
      change: stockData.f169 || 0, // 涨跌额
      changePercent: stockData.f170 || 0, // 涨跌幅
      volume: stockData.f47 || 0, // 成交量
    };
  } catch (error) {
    console.error('Error fetching real stock info:', error);
    return null;
  }
}
