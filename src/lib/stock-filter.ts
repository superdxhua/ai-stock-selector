/**
 * 股票过滤工具函数
 * 
 * 提供股票过滤功能，供多个API共享使用
 */

/**
 * 过滤不适合投资的股票
 * @param stocks 股票列表
 * @returns 过滤后的股票列表
 */
export function filterStocks(stocks: any[]): any[] {
  return stocks.filter(stock => {
    const code = stock.f12 || stock.code;
    const name = stock.f14 || stock.name;

    // 排除科创板（688开头）
    if (code.startsWith('688')) {
      return false;
    }

    // 排除北交所股票（830/831/832开头）
    if (code.startsWith('830') || code.startsWith('831') || code.startsWith('832')) {
      return false;
    }

    // 排除ST股票（名称包含"ST"或"*ST"）
    if (name.includes('ST') || name.includes('*ST')) {
      return false;
    }

    // 排除退市风险股票
    // 包括退市整理期、暂停上市、终止上市等
    if (name.includes('退市') || name.includes('整理') || name.includes('暂停上市') || name.includes('终止上市')) {
      return false;
    }

    // 排除停牌股票
    if (name.includes('停牌')) {
      return false;
    }

    // 排除其他特殊处理的股票（S、SST、S*ST等）
    if (/^S\*?ST/.test(name)) {
      return false;
    }

    // 排除名称中包含特殊标记的股票
    if (name.includes('终止') || name.includes('取消') || name.includes('撤销') || name.includes('风险警示') || name.includes('警示')) {
      return false;
    }

    // 排除市值700亿元以上的股票
    // f20字段是总市值，单位：元
    const marketCap = Number(stock.f20) || 0;
    if (marketCap > 70000000000) {
      console.log(`  排除 ${code} ${name}: 市值=${(marketCap / 100000000).toFixed(2)}亿元 > 700亿元`);
      return false;
    }

    // 排除市值40亿元以下的股票
    if (marketCap < 4000000000) {
      console.log(`  排除 ${code} ${name}: 市值=${(marketCap / 100000000).toFixed(2)}亿元 < 40亿元`);
      return false;
    }

    // 排除成交额过低的股票
    // 注意：amount字段是基于f38（成交量手数）和价格计算得出的成交额（万元）
    const amount = stock.amount;
    if (amount && amount < 30) {  // 30万元
      console.log(`  排除 ${code} ${name}: 成交额=${amount.toFixed(2)}万元 < 30万元`);
      return false;
    }

    return true;
  });
}
