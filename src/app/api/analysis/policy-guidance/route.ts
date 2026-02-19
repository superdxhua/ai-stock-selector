/**
 * 政策指引因子API
 * 
 * 功能：
 * 1. 获取政策相关度数据
 * 2. 分析行业政策利好
 * 3. 识别国家战略支持
 */

import { NextRequest, NextResponse } from 'next/server';

interface PolicyGuidance {
  policy_relevance: number;  // 政策相关度（0-100）
  industry_policy: string[];  // 行业政策利好列表
  national_strategy: string[];  // 国家战略支持列表
  recent_policy_days: number;  // 近期政策发布天数
  overall_score: number;  // 综合政策评分（0-100）
}

/**
 * GET /api/analysis/policy-guidance?code=600519&industry=食品饮料
 * 获取政策指引因子
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const industry = searchParams.get('industry');

    if (!code) {
      return NextResponse.json({
        success: false,
        error: '缺少股票代码参数',
      }, { status: 400 });
    }

    // 获取政策指引数据
    const policyGuidance = await getPolicyGuidanceData(code, industry);

    return NextResponse.json({
      success: true,
      data: policyGuidance,
    });
  } catch (error) {
    console.error('获取政策指引因子失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取政策指引因子失败',
    }, { status: 500 });
  }
}

/**
 * 获取政策指引数据（模拟）
 * 实际应用中应该接入真实政策数据源
 */
async function getPolicyGuidanceData(code: string, industry?: string): Promise<PolicyGuidance> {
  // 行业政策数据库（模拟）
  const industryPolicyDatabase: Record<string, string[]> = {
    '食品饮料': ['促进消费扩容提质', '食品工业高质量发展', '乡村振兴战略'],
    '生物医药': ['健康中国2030', '生物医药创新政策', '医保目录调整'],
    '新能源': ['碳达峰碳中和', '新能源汽车发展规划', '可再生能源发展'],
    '半导体': ['集成电路产业发展', '国产替代政策', '芯片产业支持'],
    '人工智能': ['新一代人工智能发展规划', '数字中国建设', '算力基础设施'],
    '军工': ['国防现代化', '军民融合发展战略', '军工改革'],
    '房地产': ['房住不炒', '房地产市场平稳健康发展', '保障性住房建设'],
    '银行': ['金融供给侧改革', '银行数字化转型', '金融科技发展'],
    '证券': ['资本市场改革', '注册制改革', '提高直接融资比重'],
    '保险': ['保险业改革发展', '健康险政策', '养老保险制度'],
  };

  // 国家战略数据库（模拟）
  const nationalStrategyDatabase: Record<string, string[]> = {
    '新能源': ['碳中和目标', '新能源革命'],
    '半导体': ['科技自立自强', '核心科技突破'],
    '生物医药': ['健康中国', '生物经济'],
    '人工智能': ['数字经济', '智能制造'],
    '军工': ['国防建设', '国家安全'],
  };

  // 模拟数据生成
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // 确定行业
  const stockIndustry = industry || determineStockIndustry(code);

  // 获取行业政策
  const industry_policy = industryPolicyDatabase[stockIndustry] || 
                          industryPolicyDatabase[Object.keys(industryPolicyDatabase)[Math.floor(random(hash) * Object.keys(industryPolicyDatabase).length)]] || 
                          [];

  // 获取国家战略
  const national_strategy = nationalStrategyDatabase[stockIndustry] || 
                            nationalStrategyDatabase[Object.keys(nationalStrategyDatabase)[Math.floor(random(hash + 1) * Object.keys(nationalStrategyDatabase).length)]] || 
                            [];

  // 政策相关度计算
  const policy_relevance = industry_policy.length > 0 || national_strategy.length > 0 
    ? Math.floor(random(hash + 2) * 40) + 60  // 60-100
    : Math.floor(random(hash + 2) * 30);  // 0-30

  // 近期政策发布天数
  const recent_policy_days = Math.floor(random(hash + 3) * 30) + 1;

  // 综合政策评分计算
  // 公式：政策相关度*0.5 + 政策数量*5 + 战略支持*0.3
  const policy_score = Math.min(100,
    (policy_relevance * 0.5) + 
    (industry_policy.length + national_strategy.length) * 5 + 
    (national_strategy.length * 0.3)
  );
  const overall_score = Math.floor(policy_score);

  return {
    policy_relevance,
    industry_policy,
    national_strategy,
    recent_policy_days,
    overall_score,
  };
}

/**
 * 根据股票代码推断行业（模拟）
 */
function determineStockIndustry(code: string): string {
  const firstChar = code.charAt(0);
  
  // 简单的股票代码与行业映射（模拟）
  if (code.startsWith('600')) {
    const industries = ['食品饮料', '生物医药', '新能源', '半导体', '人工智能', '军工'];
    return industries[parseInt(code.substring(3, 5)) % industries.length];
  } else if (code.startsWith('000')) {
    const industries = ['房地产', '银行', '证券', '保险', '食品饮料'];
    return industries[parseInt(code.substring(3, 5)) % industries.length];
  } else if (code.startsWith('300')) {
    const industries = ['新能源', '半导体', '生物医药', '人工智能', '军工'];
    return industries[parseInt(code.substring(3, 5)) % industries.length];
  } else {
    return '其他';
  }
}

/**
 * 真实数据接入示例（注释掉，供参考）
 */
/*
// 国家政策网API
async function getGovPolicies(industry: string): Promise<string[]> {
  const response = await fetch(`https://api.gov.cn/policy/search?keyword=${encodeURIComponent(industry)}`);
  const data = await response.json();
  return data?.policies || [];
}

// 行业协会API
async function getIndustryAssociationPolicies(industry: string): Promise<string[]> {
  const response = await fetch(`https://api.association.org/policies?industry=${encodeURIComponent(industry)}`);
  const data = await response.json();
  return data?.policies || [];
}

// 证券时报政策库API
async function getSecuritiesTimesPolicies(code: string): Promise<any> {
  const response = await fetch(`https://api.stcn.com/policy/stock/${code}`);
  const data = await response.json();
  return data?.policies || [];
}
*/
