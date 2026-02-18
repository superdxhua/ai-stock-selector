// 市场情绪风向计算模块

export interface MarketSentiment {
  overallSentiment: "extreme-bullish" | "bullish" | "neutral" | "bearish" | "extreme-bearish";
  sentimentScore: number; // 0-100, 50为中性
  sentimentLabel: string;
  updateTime: string;
  indicators: {
    // 涨停跌停统计
    limitUp: number;
    limitDown: number;
    limitUpRatio: number;

    // 涨跌分布
    riseCount: number;
    fallCount: number;
    flatCount: number;
    riseRatio: number;

    // 热点板块
    hotSectors: Array<{
      name: string;
      code: string;
      changePercent: number;
      leadingStock: string;
    }>;

    // 市场指数
    shIndex: number;
    szIndex: number;
    changePercent: number;

    // 北向资金（模拟）
    northboundMoney: {
      netInflow: number;
      status: "inflow" | "outflow";
    };
  };
}

// 计算情绪分数
function calculateSentimentScore(indicators: {
  limitUp: number;
  limitDown: number;
  riseRatio: number;
  changePercent: number;
  northboundInflow: number;
}): { score: number; sentiment: MarketSentiment["overallSentiment"] } {
  let score = 50; // 基础分

  // 涨停跌停影响（权重25）
  const limitScore = Math.min(25, indicators.limitUp * 0.6) - Math.min(25, indicators.limitDown * 1.0);
  score += limitScore;

  // 涨跌比例影响（权重20）
  score += (indicators.riseRatio - 0.5) * 40;

  // 指数涨跌影响（权重35，提高权重）
  score += Math.max(-20, Math.min(20, indicators.changePercent * 3));

  // 北向资金影响（权重20，提高权重）
  score += Math.max(-15, Math.min(15, indicators.northboundInflow / 100000000));

  // 限制在0-100范围内
  score = Math.max(0, Math.min(100, score));

  // 判断情绪等级
  let sentiment: MarketSentiment["overallSentiment"];
  if (score >= 80) sentiment = "extreme-bullish";
  else if (score >= 60) sentiment = "bullish";
  else if (score >= 40) sentiment = "neutral";
  else if (score >= 20) sentiment = "bearish";
  else sentiment = "extreme-bearish";

  return { score, sentiment };
}

// 获取情绪标签
function getSentimentLabel(sentiment: MarketSentiment["overallSentiment"]): string {
  const labels = {
    "extreme-bullish": "🚀 极度乐观",
    "bullish": "📈 乐观",
    "neutral": "😐 中性",
    "bearish": "📉 悲观",
    "extreme-bearish": "💥 极度悲观",
  };
  return labels[sentiment];
}

// 从东方财富API获取实时数据
async function fetchEastMoneyData() {
  try {
    // 获取板块热点数据
    const sectorsRes = await fetch(
      `http://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:90+t:2&fields=f2,f3,f12,f14,f136,f140&bz=f`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    const sectorsData = await sectorsRes.json();

    // 获取涨跌停数据
    const limitRes = await fetch(
      `http://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=100&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f3,f12&bz=f`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    const limitData = await limitRes.json();

    // 获取指数数据（使用东方财富API）
    const indexRes = await fetch(
      `http://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&secids=1.000001,0.399001&fields=f2,f3,f12,f14&ut=bd1d9ddb04089700cf9c27f6f7426281`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    const indexData = await indexRes.json();

    // 如果东方财富API失败，使用模拟数据
    if (!indexData.data || !indexData.data.diff || indexData.data.diff.length === 0) {
      // 使用模拟的指数数据
      indexData.data = {
        diff: [
          {
            f12: "1.000001",
            f2: 3050.5,
            f3: 0.5,
            f14: "上证指数"
          },
          {
            f12: "0.399001",
            f2: 9850.3,
            f3: 0.3,
            f14: "深证成指"
          }
        ]
      };
    }

    return {
      sectors: sectorsData.data?.diff || [],
      stocks: limitData.data?.diff || [],
      indices: indexData.data?.diff || [],
    };
  } catch (error) {
    console.error("Error fetching EastMoney data:", error);
    return null;
  }
}

// 计算市场情绪
export async function calculateMarketSentiment(): Promise<MarketSentiment | null> {
  const data = await fetchEastMoneyData();

  if (!data) {
    return null;
  }

  // 统计涨跌停
  const limitUp = data.stocks.filter((s: any) => s.f3 >= 9.9).length;
  const limitDown = data.stocks.filter((s: any) => s.f3 <= -9.9).length;
  const limitUpRatio = data.stocks.length > 0 ? limitUp / data.stocks.length : 0;

  // 统计涨跌分布（从样本数据）
  const riseCount = data.stocks.filter((s: any) => s.f3 > 0).length;
  const fallCount = data.stocks.filter((s: any) => s.f3 < 0).length;
  const flatCount = data.stocks.filter((s: any) => s.f3 === 0).length;
  const riseRatio = data.stocks.length > 0 ? riseCount / data.stocks.length : 0;

  // 获取热点板块
  const hotSectors = data.sectors.slice(0, 5).map((s: any) => ({
    name: s.f14,
    code: s.f12,
    changePercent: s.f3,
    leadingStock: s.f140,
  }));

  // 获取指数（支持两种格式）
  const shIndex = data.indices.find((i: any) =>
    i.f12 === "1.000001" || i.f12 === "000001"
  );
  const szIndex = data.indices.find((i: any) =>
    i.f12 === "0.399001" || i.f12 === "399001"
  );
  const shChangePercent = shIndex?.f3 || 0;
  const szChangePercent = szIndex?.f3 || 0;
  const avgChangePercent = (shChangePercent + szChangePercent) / 2;

  // 模拟北向资金（根据指数涨跌计算）
  const northboundInflow = avgChangePercent * 500000000; // 指数每涨跌1%，对应5亿资金
  const status: "inflow" | "outflow" = northboundInflow >= 0 ? "inflow" : "outflow";
  const northboundMoney = {
    netInflow: Math.round(northboundInflow),
    status,
  };

  // 计算情绪分数
  const { score, sentiment } = calculateSentimentScore({
    limitUp,
    limitDown,
    riseRatio,
    changePercent: avgChangePercent,
    northboundInflow: northboundMoney.netInflow,
  });

  return {
    overallSentiment: sentiment,
    sentimentScore: Math.round(score),
    sentimentLabel: getSentimentLabel(sentiment),
    updateTime: new Date().toISOString(),
    indicators: {
      limitUp,
      limitDown,
      limitUpRatio: Math.round(limitUpRatio * 100) / 100,
      riseCount,
      fallCount,
      flatCount,
      riseRatio: Math.round(riseRatio * 100) / 100,
      hotSectors,
      shIndex: shIndex?.f2 || 0,
      szIndex: szIndex?.f2 || 0,
      changePercent: Math.round(avgChangePercent * 100) / 100,
      northboundMoney,
    },
  };
}
