/**
 * 资金流向因子API
 * 
 * 功能：
 * 1. 获取主力资金净流入数据
 * 2. 分析散户资金流向
 * 3. 追踪北向资金动向
 */

import { NextRequest, NextResponse } from 'next/server';

interface CapitalFlow {
  main_net_inflow: number;  // 主力资金净流入（万元）
  retail_net_inflow: number;  // 散户资金净流入（万元）
  northbound_flow: number;  // 北向资金动向（万元）
  fund_net_inflow: number;  // 基金净流入（万元）
  capital_score: number;  // 资金面评分（0-100）
  flow_trend: string;  // 资金流向趋势
}

/**
 * GET /api/analysis/capital-flow?code=600519
 * 获取资金流向因子
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({
        success: false,
        error: '缺少股票代码参数',
      }, { status: 400 });
    }

    // 获取资金流向数据
    const capitalFlow = await getCapitalFlowData(code);

    return NextResponse.json({
      success: true,
      data: capitalFlow,
    });
  } catch (error) {
    console.error('获取资金流向因子失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取资金流向因子失败',
    }, { status: 500 });
  }
}

/**
 * 获取资金流向数据（模拟）
 * 实际应用中应该接入真实数据源
 */
async function getCapitalFlowData(code: string): Promise<CapitalFlow> {
  // 模拟数据生成（基于股票代码的伪随机）
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // 主力资金净流入（万元）
  const main_net_inflow = Math.floor((random(hash) - 0.5) * 50000);  // -25000 到 25000 万元

  // 散户资金净流入（万元）
  const retail_net_inflow = Math.floor((random(hash + 1) - 0.5) * 30000);  // -15000 到 15000 万元

  // 北向资金动向（万元）
  const northbound_flow = Math.floor((random(hash + 2) - 0.5) * 20000);  // -10000 到 10000 万元

  // 基金净流入（万元）
  const fund_net_inflow = Math.floor((random(hash + 3) - 0.5) * 15000);  // -7500 到 7500 万元

  // 资金流向趋势
  let flow_trend = 'neutral';
  if (main_net_inflow > 5000 && northbound_flow > 3000) {
    flow_trend = 'strong_inflow';  // 强流入
  } else if (main_net_inflow > 0) {
    flow_trend = 'inflow';  // 流入
  } else if (main_net_inflow < -5000 && northbound_flow < -3000) {
    flow_trend = 'strong_outflow';  // 强流出
  } else if (main_net_inflow < 0) {
    flow_trend = 'outflow';  // 流出
  }

  // 资金面评分计算
  // 公式：主力流入*0.4 + 北向流入*0.3 + 基金流入*0.3
  const main_score = Math.min(100, Math.max(0, (main_net_inflow + 25000) / 50000 * 100));
  const northbound_score = Math.min(100, Math.max(0, (northbound_flow + 10000) / 20000 * 100));
  const fund_score = Math.min(100, Math.max(0, (fund_net_inflow + 7500) / 15000 * 100));
  
  const capital_score = Math.floor(
    (main_score * 0.4) + 
    (northbound_score * 0.3) + 
    (fund_score * 0.3)
  );

  return {
    main_net_inflow,
    retail_net_inflow,
    northbound_flow,
    fund_net_inflow,
    capital_score,
    flow_trend,
  };
}

/**
 * 批量获取资金流向数据
 * @param codes 股票代码数组
 * @returns 资金流向数据映射
 */
export async function getBatchCapitalFlow(codes: string[]): Promise<Record<string, CapitalFlow>> {
  const results: Record<string, CapitalFlow> = {};

  for (const code of codes) {
    try {
      results[code] = await getCapitalFlowData(code);
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`获取股票 ${code} 的资金流向失败:`, error);
      results[code] = {
        main_net_inflow: 0,
        retail_net_inflow: 0,
        northbound_flow: 0,
        fund_net_inflow: 0,
        capital_score: 0,
        flow_trend: 'neutral',
      };
    }
  }

  return results;
}

/**
 * 真实数据接入示例（注释掉，供参考）
 */
/*
// 东方财富资金流向API
async function getEastmoneyCapitalFlow(code: string): Promise<CapitalFlow> {
  const response = await fetch(`https://push2.eastmoney.com/api/qt/stock/fflow/get?secid=1.${code}&lmt=1`);
  const data = await response.json();
  return {
    main_net_inflow: data?.data?.xj || 0,
    retail_net_inflow: data?.data?.zj || 0,
    northbound_flow: data?.data?.hk || 0,
    fund_net_inflow: data?.data?.jj || 0,
    capital_score: 0,
    flow_trend: 'neutral',
  };
}

// 同花顺资金流向API
async function getTonghuashunCapitalFlow(code: string): Promise<any> {
  const response = await fetch(`https://data.10jqka.com.cn/funds/zjlr/${code}`);
  const html = await response.text();
  // 解析数据
  // ...
  return { main_net_inflow: 0, retail_net_inflow: 0 };
}

// 雪球资金流向API
async function getXueqiuCapitalFlow(code: string): Promise<any> {
  const response = await fetch(`https://xueqiu.com/stock/f10/CapitalFlow?symbol=${code}`);
  const data = await response.json();
  return data?.data || {};
}
*/
