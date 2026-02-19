-- 添加用户角色字段
ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 添加注释
COMMENT ON COLUMN users.role IS '用户角色：admin(管理员), user(普通用户)';

-- 更新现有用户为普通用户（如果有演示管理员账号，可以单独设置）
UPDATE users SET role = 'user' WHERE role IS NULL;
