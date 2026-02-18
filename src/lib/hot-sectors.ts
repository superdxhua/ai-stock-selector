/**
 * 热点板块获取模块
 *
 * 功能：
 * 1. 获取东方财富热点板块数据
 * 2. 获取板块内的股票列表
 * 3. 为5日趋势和5日容量策略提供热点板块筛选
 */

// 东方财富板块API配置
const SECTOR_API = {
  // 获取板块列表
  sectorList: "https://push2.eastmoney.com/api/qt/clist/get",
  // 获取板块内个股
  sectorStocks: "https://push2.eastmoney.com/api/qt/ulist.np/get",
};

/**
 * 板块信息
 */
export interface SectorInfo {
  f12: string; // 板块代码
  f14: string; // 板块名称
  f2: number; // 最新价
  f3: number; // 涨跌幅
  f4: number; // 涨跌额
  f5: number; // 成交量（手）
  f6: number; // 成交额
  f8: number; // 振幅
  f9: number; // 最高
  f10: number; // 最低
  f13: number; // 市场类型（1=沪A, 2=深A）
  f20: number; // 总市值
  f21: number; // 流通市值
  f62: number; // 涨速
  f66: number; // 量比
  f104: number; // 市场股票数
  f105: number; // 上涨数
  f106: number; // 下跌数
  f107: number; // 平盘数
}

/**
 * 获取板块列表
 */
export async function getSectorList(): Promise<SectorInfo[]> {
  try {
    const params = new URLSearchParams({
      pn: "1",
      pz: "50",
      po: "1",
      np: "1",
      fltt: "2",
      invt: "2",
      fid: "f3",
      fs: "m:90+t:2", // 概念板块
      fields: "f12,f14,f2,f3,f4,f5,f6,f8,f9,f10,f20,f21,f62,f66,f104,f105,f106,f107",
    });

    const response = await fetch(`${SECTOR_API.sectorList}?${params}`, {
      headers: {
        'Referer': 'https://quote.eastmoney.com/center/boardlist.html#boards-BK01388',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const data = result.data?.diff || [];

    console.log(`获取到 ${data.length} 个板块`);
    return data;
  } catch (error) {
    console.error('获取板块列表失败:', error);
    return [];
  }
}

/**
 * 获取热点板块（涨幅前N名）
 */
export async function getHotSectors(limit: number = 20): Promise<SectorInfo[]> {
  try {
    const sectors = await getSectorList();

    // 按涨幅排序，取前N名
    const hotSectors = sectors
      .filter(s => s.f3 > 0) // 只保留上涨的板块
      .sort((a, b) => b.f3 - a.f3)
      .slice(0, limit);

    console.log(`获取到 ${hotSectors.length} 个热点板块`);
    hotSectors.forEach((sector, idx) => {
      console.log(`  ${idx + 1}. ${sector.f14} (${sector.f3.toFixed(2)}%)`);
    });

    return hotSectors;
  } catch (error) {
    console.error('获取热点板块失败:', error);
    return [];
  }
}

/**
 * 获取板块内的股票列表
 */
export async function getSectorStocks(sectorCode: string): Promise<any[]> {
  try {
    // 使用不同的API端点获取板块股票
    const params = new URLSearchParams({
      pn: "1",
      pz: "500",
      po: "1",
      np: "1",
      fltt: "2",
      invt: "2",
      fid: "f3",
      fs: `b:${sectorCode}+f:!50`, // 从指定板块获取股票，排除50和60开头的
      fields: "f12,f14,f2,f3,f4,f20,f21,f17,f40", // 包含代码、名称、最新价、涨跌幅、昨收、总市值、流通市值、换手率、成交额
    });

    const response = await fetch(`${SECTOR_API.sectorList}?${params}`, {
      headers: {
        'Referer': 'https://quote.eastmoney.com/bk/90/BK1295.html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const data = result.data?.diff || [];

    console.log(`板块 ${sectorCode} 包含 ${data.length} 只股票`);

    return data;
  } catch (error) {
    console.error(`获取板块 ${sectorCode} 股票列表失败:`, error);
    return [];
  }
}

/**
 * 获取所有热点板块内的股票（去重）
 */
export async function getHotSectorStocks(hotSectorLimit: number = 20): Promise<Set<string>> {
  try {
    const hotSectors = await getHotSectors(hotSectorLimit);
    const stockCodes = new Set<string>();

    for (const sector of hotSectors) {
      const stocks = await getSectorStocks(sector.f12);
      stocks.forEach((stock: any) => stockCodes.add(stock.f12));
    }

    console.log(`共获取到 ${stockCodes.size} 只热点板块股票`);
    return stockCodes;
  } catch (error) {
    console.error('获取热点板块股票失败:', error);
    return new Set();
  }
}

/**
 * 过滤股票：只保留热点板块内的股票
 */
export async function filterHotSectorStocks(
  stocks: any[],
  hotSectorLimit: number = 20
): Promise<any[]> {
  try {
    const hotSectors = await getHotSectors(hotSectorLimit);
    const hotSectorStocks = new Map<string, any>(); // 使用 Map 存储完整的股票信息

    // 获取所有热点板块的股票
    for (const sector of hotSectors) {
      const sectorStocks = await getSectorStocks(sector.f12);
      sectorStocks.forEach((stock: any) => {
        hotSectorStocks.set(stock.f12, stock);
      });
    }

    console.log(`共获取到 ${hotSectorStocks.size} 只热点板块股票（含完整信息）`);

    // 筛选热点板块内的股票，并使用热点板块的完整信息
    const filteredStocks: any[] = [];
    for (const stock of stocks) {
      const hotSectorStock = hotSectorStocks.get(stock.f12);
      if (hotSectorStock) {
        // 合并原始股票信息和热点板块股票信息
        // 优先使用热点板块股票的市值等字段
        const mergedStock = {
          ...stock,
          f2: hotSectorStock.f2 || stock.f2,
          f20: hotSectorStock.f20 || stock.f20,
          f21: hotSectorStock.f21 || stock.f21,
          f17: hotSectorStock.f17 || stock.f17,
          f40: hotSectorStock.f40 || stock.f40,
        };

        // 检查流通市值过滤：40亿-700亿元
        const marketCap = Number(mergedStock.f21 || mergedStock.f20) || 0;
        if (marketCap > 70000000000) {
          console.log(`  排除 ${stock.f12} ${stock.f14}: 流通值=${(marketCap / 100000000).toFixed(2)}亿元 > 700亿元（热点板块）`);
          continue;
        }
        if (marketCap < 4000000000) {
          console.log(`  排除 ${stock.f12} ${stock.f14}: 流通值=${(marketCap / 100000000).toFixed(2)}亿元 < 40亿元（热点板块）`);
          continue;
        }

        filteredStocks.push(mergedStock);
      }
    }

    console.log(
      `从 ${stocks.length} 只股票中筛选出 ${filteredStocks.length} 只热点板块股票`
    );

    return filteredStocks;
  } catch (error) {
    console.error('筛选热点板块股票失败:', error);
    // 出错时返回原列表
    return stocks;
  }
}

/**
 * 获取板块统计信息
 */
export async function getSectorStatistics(limit: number = 20) {
  try {
    const sectors = await getSectorList();
    const hotSectors = await getHotSectors(limit);

    return {
      total: sectors.length,
      hotCount: hotSectors.length,
      hotSectors: hotSectors.map(s => ({
        code: s.f12,
        name: s.f14,
        changePercent: s.f3,
        upCount: s.f105,
        downCount: s.f106,
        flatCount: s.f107,
      })),
    };
  } catch (error) {
    console.error('获取板块统计失败:', error);
    return {
      total: 0,
      hotCount: 0,
      hotSectors: [],
    };
  }
}
