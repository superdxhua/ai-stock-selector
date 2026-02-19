-- 添加多维度学习因子字段
ALTER TABLE tonghuashun_learning_records 
ADD COLUMN IF NOT EXISTS market_sentiment JSONB,  -- 市场情绪因子
ADD COLUMN IF NOT EXISTS policy_guidance JSONB,  -- 政策指引因子
ADD COLUMN IF NOT EXISTS capital_flow JSONB,  -- 资金流向因子
ADD COLUMN IF NOT EXISTS fundamental_metrics JSONB,  -- 基本面因子
ADD COLUMN IF NOT EXISTS industry_factors JSONB,  -- 行业因子
ADD COLUMN IF NOT EXISTS advanced_indicators JSONB;  -- 高级技术指标

-- 市场情绪因子详细字段说明（存储在market_sentiment JSONB中）:
-- - guba_heat: 股吧热度（0-100）
-- - guba_posts: 股吧帖子数
-- - guba_replies: 股吧回复数
-- - sentiment_positive: 正面情绪比例
-- - sentiment_negative: 负面情绪比例
-- - sentiment_neutral: 中性情绪比例
-- - social_discussion: 社交媒体讨论度

-- 政策指引因子详细字段说明（存储在policy_guidance JSONB中）:
-- - policy_relevance: 政策相关度（0-100）
-- - industry_policy: 行业政策利好
-- - national_strategy: 国家战略支持
-- - recent_policy_days: 近期政策发布天数

-- 资金流向因子详细字段说明（存储在capital_flow JSONB中）:
-- - main_net_inflow: 主力资金净流入（万元）
-- - retail_net_inflow: 散户资金净流入（万元）
-- - northbound_flow: 北向资金动向（万元）
-- - fund_net_inflow: 基金净流入（万元）
-- - capital_score: 资金面评分（0-100）

-- 基本面因子详细字段说明（存储在fundamental_metrics JSONB中）:
-- - pe_ratio: 市盈率
-- - pb_ratio: 市净率
-- - revenue_growth: 营收增长率
-- - profit_growth: 净利润增长率
-- - roe: 净资产收益率
-- - roa: 总资产收益率
-- - fundamental_score: 基本面评分（0-100）

-- 行业因子详细字段说明（存储在industry_factors JSONB中）:
-- - industry_boom: 行业景气度（0-100）
-- - sector_rotation: 板块轮动强度
-- - industry_rank: 行业排名
-- - sector_heat: 板块热度
-- - peer_comparison: 同行业比较

-- 高级技术指标详细字段说明（存储在advanced_indicators JSONB中）:
-- - rsi: RSI指标
-- - kdj_k: KDJ-K值
-- - kdj_d: KDJ-D值
-- - kdj_j: KDJ-J值
-- - bollinger_upper: 布林带上轨
-- - bollinger_lower: 布林带下轨
-- - bollinger_break: 布林带突破
-- - ma5: 5日均线
-- - ma10: 10日均线
-- - ma20: 20日均线
-- - ma60: 60日均线
-- - ma_cross: 均线金叉/死叉
