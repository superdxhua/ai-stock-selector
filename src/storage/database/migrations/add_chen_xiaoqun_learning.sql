-- 陈小群策略学习记录表
CREATE TABLE IF NOT EXISTS chen_xiaoqun_learning_records (
    id BIGSERIAL PRIMARY KEY,
    stock_code VARCHAR(10) NOT NULL,
    stock_name VARCHAR(50),
    analyze_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 龙头战法因子
    dragon_head_score INTEGER,
    is_dragon_head BOOLEAN DEFAULT FALSE,
    
    -- 连板妖股因子
    consecutive_limit_up INTEGER DEFAULT 0,
    is_monster_stock BOOLEAN DEFAULT FALSE,
    
    -- 市场情绪因子
    market_sentiment_cycle VARCHAR(20),
    sentiment_alignment INTEGER,
    
    -- 资金流向因子
    main_force_flow INTEGER,  -- 万元
    fund_accumulation INTEGER,
    
    -- 打板策略因子
    limit_up_timing VARCHAR(20),
    limit_up_strong BOOLEAN DEFAULT FALSE,
    
    -- 高位接力因子
    position_risk INTEGER,
    relay_feasibility INTEGER,
    
    -- 板块轮动因子
    sector_heat INTEGER,
    sector_rotation_position VARCHAR(20),
    
    -- 综合评分
    overall_score INTEGER,
    action_advice TEXT,
    
    -- 应用状态
    is_applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP WITH TIME ZONE,
    
    -- 备注
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_chen_xiaoqun_stock_code ON chen_xiaoqun_learning_records(stock_code);
CREATE INDEX IF NOT EXISTS idx_chen_xiaoqun_analyze_date ON chen_xiaoqun_learning_records(analyze_date);
CREATE INDEX IF NOT EXISTS idx_chen_xiaoqun_overall_score ON chen_xiaoqun_learning_records(overall_score);
CREATE INDEX IF NOT EXISTS idx_chen_xiaoqun_is_monster_stock ON chen_xiaoqun_learning_records(is_monster_stock);
CREATE INDEX IF NOT EXISTS idx_chen_xiaoqun_is_dragon_head ON chen_xiaoqun_learning_records(is_dragon_head);

-- 添加注释
COMMENT ON TABLE chen_xiaoqun_learning_records IS '陈小群策略学习记录表';
COMMENT ON COLUMN chen_xiaoqun_learning_records.dragon_head_score IS '龙头评分（0-100）';
COMMENT ON COLUMN chen_xiaoqun_learning_records.is_dragon_head IS '是否龙头股';
COMMENT ON COLUMN chen_xiaoqun_learning_records.consecutive_limit_up IS '连续涨停天数';
COMMENT ON COLUMN chen_xiaoqun_learning_records.is_monster_stock IS '是否妖股（5连板以上）';
COMMENT ON COLUMN chen_xiaoqun_learning_records.market_sentiment_cycle IS '市场情绪周期（上升期/高潮期/退潮期/冰点期）';
COMMENT ON COLUMN chen_xiaoqun_learning_records.sentiment_alignment IS '情绪契合度（0-100）';
COMMENT ON COLUMN chen_xiaoqun_learning_records.main_force_flow IS '主力资金净流入（万元）';
COMMENT ON COLUMN chen_xiaoqun_learning_records.fund_accumulation IS '资金堆量程度（0-100）';
COMMENT ON COLUMN chen_xiaoqun_learning_records.limit_up_timing IS '涨停时机（早盘/中盘/尾盘）';
COMMENT ON COLUMN chen_xiaoqun_learning_records.limit_up_strong IS '是否强势涨停';
COMMENT ON COLUMN chen_xiaoqun_learning_records.position_risk IS '高位风险评分（0-100）';
COMMENT ON COLUMN chen_xiaoqun_learning_records.relay_feasibility IS '接力可行性（0-100）';
COMMENT ON COLUMN chen_xiaoqun_learning_records.sector_heat IS '板块热度（0-100）';
COMMENT ON COLUMN chen_xiaoqun_learning_records.sector_rotation_position IS '板块轮动位置（启动期/发酵期/高潮期/分化期/退潮期）';
COMMENT ON COLUMN chen_xiaoqun_learning_records.overall_score IS '陈小群策略综合评分（0-100）';
COMMENT ON COLUMN chen_xiaoqun_learning_records.action_advice IS '操作建议';
COMMENT ON COLUMN chen_xiaoqun_learning_records.is_applied IS '是否已应用学习结果';
