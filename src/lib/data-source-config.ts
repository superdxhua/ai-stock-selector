/**
 * 数据源配置
 * 
 * 本应用默认使用东方财富作为数据源
 * 如需切换数据源，请修改此配置
 */

export enum DataSource {
  EASTMONEY = "eastmoney", // 东方财富（默认）
  TUSHARE = "tushare",     // Tushare
  SINA = "sina",           // 新浪财经
  MOCK = "mock",           // 模拟数据（仅用于测试）
}

/**
 * 默认数据源
 * 可以在此切换不同的数据源
 */
export const DEFAULT_DATA_SOURCE: DataSource = DataSource.EASTMONEY;

/**
 * 数据源配置信息
 */
export const DATA_SOURCE_CONFIG = {
  [DataSource.EASTMONEY]: {
    name: "东方财富",
    description: "沪深A股实时行情数据",
    url: "https://www.eastmoney.com",
    features: ["实时行情", "技术指标", "K线数据"],
    isDefault: true,
  },
  [DataSource.TUSHARE]: {
    name: "Tushare",
    description: "专业金融数据接口",
    url: "https://tushare.pro",
    features: ["历史数据", "财务数据", "宏观经济"],
    isDefault: false,
  },
  [DataSource.SINA]: {
    name: "新浪财经",
    description: "免费股票数据API",
    url: "https://finance.sina.com.cn",
    features: ["实时行情", "历史数据"],
    isDefault: false,
  },
  [DataSource.MOCK]: {
    name: "模拟数据",
    description: "用于测试和开发",
    url: "",
    features: ["模拟数据"],
    isDefault: false,
  },
} as const;
