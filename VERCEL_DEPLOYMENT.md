# 🚀 Vercel 部署指南

本文档详细说明如何将"牛股选股智能体"项目部署到 Vercel 平台。

## 📋 目录

- [前置准备](#前置准备)
- [部署步骤](#部署步骤)
- [环境变量配置](#环境变量配置)
- [验证部署](#验证部署)
- [常见问题](#常见问题)
- [成本估算](#成本估算)

---

## 🎯 前置准备

### 1. 账号准备

- **Vercel 账号**：访问 [vercel.com](https://vercel.com) 注册（免费）
- **GitHub 账号**：用于连接代码仓库（可选，但推荐）

### 2. 所需密钥和配置

#### Supabase 配置
1. 访问 [supabase.com](https://supabase.com) 注册/登录
2. 创建新项目
3. 获取以下信息：
   - **Project URL**：格式如 `https://your-project.supabase.co`
   - **Service Role Key**：在 Project Settings > API 中获取

#### 豆包 API 配置
1. 访问 [豆包开放平台](https://platform.volcengine.com/)
2. 创建 API Key
3. 保存 API Key

### 3. 数据库初始化

在 Supabase SQL Editor 中执行以下 SQL 创建必要表：

```sql
-- 创建用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE,
  membership_level TEXT DEFAULT 'free',
  membership_end_date TIMESTAMP WITH TIME ZONE,
  points INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建订单表
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  package_id TEXT,
  amount DECIMAL(10, 2),
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建选股历史表
CREATE TABLE strategy_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy TEXT NOT NULL,
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  price DECIMAL(10, 2),
  score INTEGER,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建股票跟踪表
CREATE TABLE stock_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  tracking_start_price DECIMAL(10, 2),
  evaluation TEXT,
  final_price DECIMAL(10, 2),
  final_change_percent DECIMAL(10, 2),
  final_total_change DECIMAL(10, 2),
  final_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  tracking_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_strategy_history_strategy ON strategy_history(strategy);
CREATE INDEX idx_strategy_history_date ON strategy_history(date);
CREATE INDEX idx_stock_tracking_user_id ON stock_tracking(user_id);
CREATE INDEX idx_stock_tracking_tracking_date ON stock_tracking(tracking_date);
```

---

## 📦 部署步骤

### 方法一：通过 Vercel CLI 部署（推荐）

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登录 Vercel

```bash
vercel login
```

按照提示选择登录方式（GitHub、GitLab 等）。

#### 3. 初始化项目

在项目根目录执行：

```bash
vercel init
```

按照提示配置：
- Project Name: `bull-stock-selector`
- Framework Preset: Next.js
- Directory: `.`
- Link to existing project: No

#### 4. 配置环境变量

方式 1：通过命令行配置（不推荐，会有记录）
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DOUBAO_API_KEY
```

方式 2：通过 Vercel Dashboard 配置（推荐）
- 访问 Vercel Dashboard
- 进入项目设置
- 在 Environment Variables 中添加以下变量：
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DOUBAO_API_KEY`

#### 5. 部署到生产环境

```bash
vercel --prod
```

部署完成后，Vercel 会返回一个生产环境的 URL。

---

### 方法二：通过 GitHub 集成部署（推荐团队使用）

#### 1. 推送代码到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/bull-stock-selector.git
git push -u origin main
```

#### 2. 在 Vercel 中导入项目

1. 访问 [vercel.com/new](https://vercel.com/new)
2. 选择 "Import Project"
3. 选择 GitHub 仓库
4. 配置项目：
   - Framework: Next.js
   - Root Directory: `.`

#### 3. 配置环境变量

在项目设置中添加环境变量（同上）。

#### 4. 部署

点击 "Deploy" 按钮，Vercel 会自动构建和部署。

---

## 🔐 环境变量配置

### 必需变量

| 变量名 | 说明 | 示例 | 敏感 |
|--------|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` | 否 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务密钥 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | 是 |
| `DOUBAO_API_KEY` | 豆包 API 密钥 | `your-api-key-here` | 是 |

### 可选变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `SKOUFA_PAY_CODE` | 支付二维码地址 | `https://example.com/qrcode.png` |
| `ADMIN_USERNAME` | 管理员用户名 | `admin` |
| `ADMIN_PASSWORD` | 管理员密码 | `your-secure-password` |

### 配置建议

1. **敏感变量**（API 密钥）应该使用 Vercel 的 "Secret" 类型
2. 生产环境和开发环境应该使用不同的变量
3. 定期轮换 API 密钥
4. 不要在代码中硬编码敏感信息

---

## ✅ 验证部署

### 1. 检查部署状态

访问 Vercel Dashboard，查看部署日志是否成功。

### 2. 测试网站

打开生产环境 URL，测试以下功能：

- [ ] 首页正常加载
- [ ] 扫码注册页面可访问
- [ ] AI 对话功能正常
- [ ] 策略选股功能正常
- [ ] 订阅会员功能正常

### 3. 测试 API

使用 `curl` 测试 API 端点：

```bash
# 测试用户登录
curl -X POST https://your-domain.vercel.app/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000"}'

# 测试股票信息
curl https://your-domain.vercel.app/api/stock/info?code=000001
```

### 4. 检查日志

在 Vercel Dashboard 中查看：
- Function Logs：API 调用日志
- Build Logs：构建日志
- Runtime Logs：运行时日志

---

## ❓ 常见问题

### Q1: 构建失败怎么办？

**原因**：可能是依赖安装失败或环境变量缺失。

**解决方案**：
1. 检查 Build Log 中的错误信息
2. 确认所有环境变量已正确配置
3. 检查 `pnpm-lock.yaml` 是否存在

### Q2: API 调用返回 500 错误

**原因**：可能是环境变量未正确加载或数据库连接失败。

**解决方案**：
1. 检查 Function Logs
2. 确认 Supabase URL 和密钥正确
3. 检查数据库表是否已创建

### Q3: 图片无法加载

**原因**：Next.js 图片域名未配置。

**解决方案**：
确保 `next.config.ts` 中已配置图片域名：
```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'lf-coze-web-cdn.coze.cn',
      pathname: '/**',
    },
  ],
}
```

### Q4: 超时错误

**原因**：API 函数执行时间超过 Vercel 限制（免费版 10 秒，Pro 版 60 秒）。

**解决方案**：
1. 优化 API 查询性能
2. 使用缓存减少重复计算
3. 升级到 Vercel Pro 计划（支持更长的执行时间）

### Q5: 数据库连接数不足

**原因**：Supabase 免费套餐连接数限制（2 个并发连接）。

**解决方案**：
1. 使用连接池
2. 优化数据库查询，减少连接时间
3. 升级 Supabase 计划

---

## 💰 成本估算

### Vercel 免费额度

| 资源 | 免费额度 |
|------|---------|
| 带宽 | 100GB/月 |
| 构建时间 | 6,000 分钟/月 |
| Serverless 函数执行 | 100GB-Hours/月 |
| 部署 | 无限 |

### Supabase 免费额度

| 资源 | 免费额度 |
|------|---------|
| 存储 | 500MB |
| 数据库传输 | 1GB/月 |
| 并发连接 | 2 个 |
| 行数 | 50,000 行 |

### 豆包 API 费用

根据使用量计费，建议设置预算限制。

### 预估月度成本

- **小型项目**（< 100 用户/天）：**免费**
- **中型项目**（100-1000 用户/天）：**$0-50**
- **大型项目**（> 1000 用户/天）：**$50-200+**

---

## 🎉 部署完成

恭喜！您的"牛股选股智能体"已成功部署到 Vercel。

### 下一步

1. **配置自定义域名**（可选）
   - 在 Vercel 项目设置中添加自定义域名
   - 配置 DNS 记录

2. **设置监控和告警**
   - 配置 Vercel Analytics
   - 设置错误告警

3. **备份策略**
   - 定期备份 Supabase 数据库
   - 保存 API 密钥

4. **性能优化**
   - 启用 CDN 缓存
   - 优化图片和静态资源
   - 使用 Vercel Edge Functions

---

## 📞 技术支持

- **Vercel 文档**：[vercel.com/docs](https://vercel.com/docs)
- **Supabase 文档**：[supabase.com/docs](https://supabase.com/docs)
- **豆包开放平台**：[platform.volcengine.com](https://platform.volcengine.com/)

---

## 📝 更新日志

- **2024-02-19**：创建初始部署指南
