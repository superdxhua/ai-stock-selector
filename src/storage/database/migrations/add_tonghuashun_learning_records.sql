-- 同花顺策略学习记录表
CREATE TABLE IF NOT EXISTS tonghuashun_learning_records (
  id BIGSERIAL PRIMARY KEY,
  strategy_type VARCHAR(50) NOT NULL,
  analyze_date TIMESTAMP WITH TIME ZONE NOT NULL,
  stock_count INTEGER NOT NULL,
  learned_features JSONB NOT NULL,
  avg_consecutive_rises NUMERIC(5,2),
  avg_5_day_change NUMERIC(5,2),
  avg_limit_up_ratio NUMERIC(5,2),
  avg_volume_ratio NUMERIC(5,2),
  avg_price_above_cyc NUMERIC(5,2),
  avg_macd_golden_cross NUMERIC(5,2),
  recommendations JSONB,
  is_applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP WITH TIME ZONE,
  learning_score NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tonghuashun_learning_strategy_date 
  ON tonghuashun_learning_records (strategy_type, analyze_date DESC);

CREATE INDEX IF NOT EXISTS idx_tonghuashun_learning_applied 
  ON tonghuashun_learning_records (is_applied);
