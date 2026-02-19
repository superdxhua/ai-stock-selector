-- 用户扩展表（添加会员相关字段）
-- 注意：如果已有users表，需要执行ALTER TABLE

-- 为现有用户表添加会员字段
ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS membership_level VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS membership_expire_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_check_in_date DATE;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_users_membership_level ON users(membership_level);
CREATE INDEX IF NOT EXISTS idx_users_membership_expire_at ON users(membership_expire_at);

-- 添加注释
COMMENT ON COLUMN users.membership_level IS '会员等级：free(免费), silver(白银), gold(黄金), platinum(铂金)';
COMMENT ON COLUMN users.membership_expire_at IS '会员过期时间';
COMMENT ON COLUMN users.points IS '用户积分';
COMMENT ON COLUMN users.last_check_in_date IS '最后签到日期';

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
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- 添加注释
COMMENT ON TABLE orders IS '订单表';
COMMENT ON COLUMN orders.order_no IS '订单号';
COMMENT ON COLUMN orders.package_id IS '套餐ID';
COMMENT ON COLUMN orders.package_name IS '套餐名称';
COMMENT ON COLUMN orders.amount IS '订单金额';
COMMENT ON COLUMN orders.payment_method IS '支付方式：points(积分), shoukuiba(收款吧), wangpu(旺铺管家), alipay(支付宝)';
COMMENT ON COLUMN orders.payment_info IS '支付信息（JSON格式）';
COMMENT ON COLUMN orders.status IS '订单状态：pending(待支付), paid(已支付), cancelled(已取消), expired(已过期)';
COMMENT ON COLUMN orders.paid_at IS '支付时间';
COMMENT ON COLUMN orders.expired_at IS '订单过期时间';

-- ========================================
-- 积分记录表
-- ========================================
CREATE TABLE IF NOT EXISTS point_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    points INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    related_id UUID,  -- 关联订单ID或其他ID
    record_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_point_records_user_id ON point_records(user_id);
CREATE INDEX IF NOT EXISTS idx_point_records_created_at ON point_records(created_at);
CREATE INDEX IF NOT EXISTS idx_point_records_record_type ON point_records(record_type);

-- 添加注释
COMMENT ON TABLE point_records IS '积分记录表';
COMMENT ON COLUMN point_records.points IS '积分变化（正数为增加，负数为减少）';
COMMENT ON COLUMN point_records.balance_after IS '变化后的积分余额';
COMMENT ON COLUMN point_records.reason IS '积分变动原因';
COMMENT ON COLUMN point_records.record_type IS '记录类型：earn(获得), consume(消费), refund(退款), admin(管理员操作)';

-- ========================================
-- 会员开通记录表
-- ========================================
CREATE TABLE IF NOT EXISTS membership_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    package_id VARCHAR(50) NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    membership_level VARCHAR(20) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(10, 2),
    payment_method VARCHAR(50),
    order_id UUID,
    source VARCHAR(20) DEFAULT 'purchase',  -- purchase(购买), points(积分兑换), admin(管理员赠送)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_membership_records_user_id ON membership_records(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_records_start_date ON membership_records(start_date);
CREATE INDEX IF NOT EXISTS idx_membership_records_end_date ON membership_records(end_date);

-- 添加注释
COMMENT ON TABLE membership_records IS '会员开通记录表';
COMMENT ON COLUMN membership_records.source IS '来源：purchase(购买), points(积分兑换), admin(管理员赠送)';

-- ========================================
-- 每日签到记录表
-- ========================================
CREATE TABLE IF NOT EXISTS check_in_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    check_in_date DATE NOT NULL,
    points_earned INTEGER DEFAULT 10,
    consecutive_days INTEGER DEFAULT 1,
    bonus_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, check_in_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_check_in_records_user_id ON check_in_records(user_id);
CREATE INDEX IF NOT EXISTS idx_check_in_records_check_in_date ON check_in_records(check_in_date);

-- 添加注释
COMMENT ON TABLE check_in_records IS '每日签到记录表';
COMMENT ON COLUMN check_in_records.points_earned IS '获得的基础积分';
COMMENT ON COLUMN check_in_records.consecutive_days IS '连续签到天数';
COMMENT ON COLUMN check_in_records.bonus_points IS '连续签到奖励积分';

-- ========================================
-- 邀请记录表
-- ========================================
CREATE TABLE IF NOT EXISTS invitation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID NOT NULL,
    invitee_id UUID NOT NULL,
    invitation_code VARCHAR(20),
    points_earned INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_invitation_records_inviter_id ON invitation_records(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitation_records_invitee_id ON invitation_records(invitee_id);

-- 添加注释
COMMENT ON TABLE invitation_records IS '邀请记录表';
COMMENT ON COLUMN invitation_records.points_earned IS '邀请者获得的积分';
COMMENT ON COLUMN invitation_records.status IS '状态：completed(已完成), pending(待完成)';

-- ========================================
-- 系统配置表（套餐配置）
-- ========================================
CREATE TABLE IF NOT EXISTS system_configs (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE system_configs IS '系统配置表';

-- ========================================
-- 初始化套餐配置
-- ========================================
INSERT INTO system_configs (key, value, description) VALUES
(
    'membership_packages',
    '{
        "free": {
            "id": "free",
            "name": "免费版",
            "price": 0,
            "duration": 0,
            "dailyQuota": 3,
            "features": ["每日3次选股分析", "基础技术指标", "实时行情"],
            "pointsCost": 0
        },
        "trial": {
            "id": "trial",
            "name": "7天体验",
            "price": 9.9,
            "originalPrice": 19.9,
            "duration": 7,
            "dailyQuota": -1,
            "features": ["无限制选股分析", "陈小群策略分析", "多维度因子分析", "数据导出"],
            "paymentMethods": ["points", "shoukuiba", "wangpu"],
            "pointsCost": 500
        },
        "weekly": {
            "id": "weekly",
            "name": "周会员",
            "price": 29.9,
            "originalPrice": 59.9,
            "duration": 7,
            "dailyQuota": -1,
            "features": ["体验版全部功能", "优先客服支持", "策略回测功能"],
            "paymentMethods": ["points", "shoukuiba", "wangpu", "alipay-personal"],
            "pointsCost": 1500
        },
        "monthly": {
            "id": "monthly",
            "name": "月会员",
            "price": 79.9,
            "originalPrice": 159.9,
            "duration": 30,
            "dailyQuota": -1,
            "features": ["周会员全部功能", "VIP专属客服", "高级技术指标", "实时预警"],
            "paymentMethods": ["points", "shoukuiba", "wangpu", "alipay-personal", "bank-transfer"],
            "pointsCost": 5000
        },
        "quarterly": {
            "id": "quarterly",
            "name": "季会员",
            "price": 199.9,
            "originalPrice": 399.9,
            "duration": 90,
            "dailyQuota": -1,
            "features": ["月会员全部功能", "专属投资顾问", "定期策略报告", "线下沙龙"],
            "paymentMethods": ["alipay-personal", "bank-transfer"],
            "pointsCost": 12000
        },
        "yearly": {
            "id": "yearly",
            "name": "年会员",
            "price": 599.9,
            "originalPrice": 1199.9,
            "duration": 365,
            "dailyQuota": -1,
            "features": ["季会员全部功能", "全年策略跟踪", "一对一指导", "线下课程"],
            "paymentMethods": ["alipay-personal", "bank-transfer"],
            "pointsCost": 40000
        }
    }',
    '会员套餐配置'
),
(
    'point_rules',
    '{
        "dailyCheckIn": {
            "basePoints": 10,
            "consecutiveBonus": {
                "7": 20,
                "30": 100
            }
        },
        "inviteFriend": {
            "points": 100
        },
        "shareToMoments": {
            "points": 20,
            "dailyLimit": 3
        },
        "watchAd": {
            "points": 30,
            "dailyLimit": 10
        },
        "completeTask": {
            "points": 50
        }
    }',
    '积分规则配置'
);

-- ========================================
-- 创建更新时间触发器
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为orders表添加触发器
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为system_configs表添加触发器
CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
