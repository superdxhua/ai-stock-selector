-- 策略股票历史记录表
CREATE TABLE IF NOT EXISTS strategy_stock_history (
  id BIGSERIAL PRIMARY KEY,
  stock_code VARCHAR(20) NOT NULL,
  stock_name VARCHAR(100) NOT NULL,
  strategy VARCHAR(50) NOT NULL, -- '5day-trend' 或 '5day-volume'
  score INTEGER NOT NULL, -- 评分 0-100
  price DECIMAL(10, 2) NOT NULL, -- 入选时的价格
  change_percent DECIMAL(5, 2) NOT NULL, -- 入选时的涨跌幅
  volume BIGINT NOT NULL, -- 入选时的成交量
  market_cap BIGINT NOT NULL, -- 入选时的市值
  date DATE NOT NULL, -- 入选日期
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stock_code, strategy, date)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_strategy_stock_history_date ON strategy_stock_history(date DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_stock_history_strategy ON strategy_stock_history(strategy);
CREATE INDEX IF NOT EXISTS idx_strategy_stock_history_stock ON strategy_stock_history(stock_code, strategy);
CREATE INDEX IF NOT EXISTS idx_strategy_stock_history_stock_date ON strategy_stock_history(stock_code, date DESC);

-- 注释
COMMENT ON TABLE strategy_stock_history IS '策略股票历史记录表';
COMMENT ON COLUMN strategy_stock_history.strategy IS '策略类型：5day-trend 或 5day-volume';
COMMENT ON COLUMN strategy_stock_history.score IS '策略评分：0-100分';
