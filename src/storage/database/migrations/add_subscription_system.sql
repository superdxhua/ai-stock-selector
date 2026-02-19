-- ========================================
-- 简化的订阅系统数据库表结构
-- ========================================

-- 用户扩展表（添加会员相关字段）
ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS membership_level VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS membership_expire_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_users_membership_level ON users(membership_level);
CREATE INDEX IF NOT EXISTS idx_users_membership_expire_at ON users(membership_expire_at);

-- 添加注释
COMMENT ON COLUMN users.membership_level IS '会员等级：free(免费), trial(试用期), paid(付费)';
COMMENT ON COLUMN users.membership_expire_at IS '会员过期时间';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间';

-- ========================================
-- 订单表
-- ========================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    order_no VARCHAR(32) UNIQUE NOT NULL,
    package_id VARCHAR(50) NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_info JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 添加注释
COMMENT ON TABLE orders IS '订单表';
COMMENT ON COLUMN orders.order_no IS '订单号';
COMMENT ON COLUMN orders.package_id IS '套餐ID';
COMMENT ON COLUMN orders.package_name IS '套餐名称';
COMMENT ON COLUMN orders.amount IS '支付金额';
COMMENT ON COLUMN orders.payment_method IS '支付方式：wechat(微信), alipay(支付宝)';
COMMENT ON COLUMN orders.payment_info IS '支付信息（JSON）';
COMMENT ON COLUMN orders.status IS '订单状态：pending(待支付), paid(已支付), cancelled(已取消), expired(已过期)';
COMMENT ON COLUMN orders.paid_at IS '支付时间';
COMMENT ON COLUMN orders.expired_at IS '过期时间';

-- ========================================
-- 会员开通记录表
-- ========================================
CREATE TABLE IF NOT EXISTS membership_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    order_id UUID,
    package_id VARCHAR(50) NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    days INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_membership_records_user_id ON membership_records(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_records_order_id ON membership_records(order_id);
CREATE INDEX IF NOT EXISTS idx_membership_records_start_date ON membership_records(start_date);
CREATE INDEX IF NOT EXISTS idx_membership_records_end_date ON membership_records(end_date);

-- 添加注释
COMMENT ON TABLE membership_records IS '会员开通记录表';
COMMENT ON COLUMN membership_records.package_id IS '套餐ID';
COMMENT ON COLUMN membership_records.package_name IS '套餐名称';
COMMENT ON COLUMN membership_records.days IS '会员天数';
COMMENT ON COLUMN membership_records.start_date IS '开始日期';
COMMENT ON COLUMN membership_records.end_date IS '结束日期';
COMMENT ON COLUMN membership_records.status IS '状态：active(生效), expired(已过期)';

-- ========================================
-- 触发器：自动更新 updated_at
-- ========================================

-- 用户表触发器
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- 订单表触发器
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON orders;
CREATE TRIGGER trigger_update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();
