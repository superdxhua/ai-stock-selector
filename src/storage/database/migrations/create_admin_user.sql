-- 创建管理员账户（如果不存在）

-- 注意：密码是明文存储的简化版本
-- 生产环境应使用bcrypt等加密方式

INSERT INTO users (id, username, email, password, role, membership_level, membership_expire_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin',
  'admin@example.com',
  'admin123',
  'admin',
  'paid',
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;

-- 显示创建的管理员账户信息
SELECT id, username, email, role, created_at
FROM users
WHERE username = 'admin';
