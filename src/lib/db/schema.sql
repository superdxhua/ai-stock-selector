-- 股票信息表
CREATE TABLE IF NOT EXISTS stocks (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE, -- 股票代码
  name VARCHAR(100) NOT NULL, -- 股票名称
  sector VARCHAR(50) NOT NULL, -- 所属板块
  description TEXT, -- 描述
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_stocks_code ON stocks(code);
CREATE INDEX IF NOT EXISTS idx_stocks_sector ON stocks(sector);

-- 注释
COMMENT ON TABLE stocks IS '股票信息表';
COMMENT ON COLUMN stocks.code IS '股票代码（6位数字）';
COMMENT ON COLUMN stocks.name IS '股票名称';
COMMENT ON COLUMN stocks.sector IS '所属板块（银行、房地产、白酒等）';

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
