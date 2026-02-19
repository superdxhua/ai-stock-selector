# 订阅支付系统使用说明

## 功能概述

本系统已成功实现完整的订阅支付功能，包括：

### ✅ 已完成功能

1. **数据库表结构**
   - `users` - 用户表（扩展会员相关字段）
   - `orders` - 订单表
   - `point_records` - 积分记录表
   - `membership_records` - 会员开通记录表
   - `check_in_records` - 每日签到记录表
   - `invitation_records` - 邀请记录表
   - `system_configs` - 系统配置表（套餐配置）

2. **会员套餐**
   - 免费版：每日3次分析
   - 7天体验：¥9.9
   - 周会员：¥29.9
   - 月会员：¥79.9
   - 季会员：¥199.9
   - 年会员：¥599.9

3. **支付方式**
   - 积分兑换
   - 收款吧支付
   - 旺铺管家支付
   - 支付宝个人转账
   - 银行转账

4. **积分系统**
   - 每日签到：+10积分
   - 邀请好友：+100积分
   - 分享朋友圈：+20积分
   - 观看广告：+30积分
   - 完成任务：+50积分

5. **管理功能**
   - 订单管理
   - 订单审核
   - 订单统计

## 快速开始

### 1. 访问支付页面

创建一个新页面来展示支付功能：

```typescript
// src/app/payment/page.tsx

import PaymentPage from '@/components/PaymentPage';

export default function Page() {
  return <PaymentPage />;
}
```

### 2. 访问管理员后台

创建管理员页面：

```typescript
// src/app/admin/orders/page.tsx

import AdminOrdersPage from '@/components/AdminOrdersPage';

export default function Page() {
  return <AdminOrdersPage />;
}
```

### 3. 在主导航中添加链接

在主页面导航中添加：

```typescript
// src/app/page.tsx 或导航组件中

<nav>
  <Link href="/payment">升级会员</Link>
  <Link href="/admin/orders">订单管理</Link>
</nav>
```

## API接口文档

### 订单相关

#### 创建订单
```
POST /api/orders/create
Headers: x-user-id: <用户ID>
Body: {
  "packageId": "trial",
  "paymentMethod": "shoukuiba"
}
```

#### 查询订单
```
GET /api/orders/:orderId
Headers: x-user-id: <用户ID>
```

### 管理员相关

#### 获取订单列表
```
GET /api/admin/orders?status=pending&page=1&limit=20
```

#### 订单统计
```
GET /api/admin/orders/stats
```

#### 审核通过订单
```
POST /api/admin/orders/approve
Body: {
  "orderId": "<订单ID>",
  "adminToken": "admin-token-123456"
}
```

#### 拒绝订单
```
POST /api/admin/orders/reject
Body: {
  "orderId": "<订单ID>",
  "adminToken": "admin-token-123456",
  "reason": "支付金额不符"
}
```

### 用户相关

#### 每日签到
```
POST /api/check-in
Headers: x-user-id: <用户ID>
```

#### 获取签到信息
```
GET /api/check-in
Headers: x-user-id: <用户ID>
```

## 测试流程

### 测试积分兑换

1. 访问支付页面
2. 选择"7天体验"套餐
3. 选择"积分兑换"支付方式
4. 确认支付
5. 系统自动扣除积分并开通会员

### 测试扫码支付

1. 访问支付页面
2. 选择任意付费套餐
3. 选择"收款吧"或"旺铺管家"支付方式
4. 系统创建订单并显示收款码
5. 用户扫码支付
6. 管理员在后台审核订单
7. 审核通过后自动开通会员

### 测试管理员审核

1. 访问管理员后台
2. 查看"待审核"订单
3. 点击"通过"或"拒绝"按钮
4. 系统自动更新订单状态
5. 审核通过后自动开通会员

## 注意事项

### ⚠️ 重要提醒

1. **管理员Token**
   - 当前使用简化版Token：`admin-token-123456`
   - 实际应用中应该使用更安全的认证方式

2. **用户ID**
   - 当前使用演示用户ID：`demo-user-id`
   - 实际应用中应该从session或token中获取

3. **收款码**
   - 需要准备收款吧和旺铺管家的收款码图片
   - 存放到 `/public/payment/` 目录
   - 文件名：`shoukuiba-qr.png`, `wangpu-qr.png`

4. **客服联系方式**
   - 在支付页面显示的客服联系方式需要更新
   - 当前显示为：微信：xxx

5. **订单过期时间**
   - 当前设置为2小时后过期
   - 可在代码中调整

## 数据库迁移

需要执行以下SQL文件来创建数据库表：

```bash
# 执行数据库迁移
psql -U your_username -d your_database -f src/storage/database/migrations/add_payment_system.sql
```

或者通过Supabase Dashboard执行：
1. 打开SQL Editor
2. 复制 `src/storage/database/migrations/add_payment_system.sql` 内容
3. 执行SQL

## 配置说明

### 修改会员套餐

编辑 `system_configs` 表中的 `membership_packages` 记录：

```sql
UPDATE system_configs
SET value = '{
  "free": {
    "id": "free",
    "name": "免费版",
    "price": 0,
    ...
  }
}'
WHERE key = 'membership_packages';
```

### 修改积分规则

编辑 `system_configs` 表中的 `point_rules` 记录：

```sql
UPDATE system_configs
SET value = '{
  "dailyCheckIn": {
    "basePoints": 10,
    ...
  }
}'
WHERE key = 'point_rules';
```

## 安全建议

### 🔒 生产环境必须做的

1. **管理员认证**
   - 使用JWT或Session认证
   - 添加IP白名单
   - 记录操作日志

2. **用户认证**
   - 实现完整的用户登录/注册
   - 使用JWT Token
   - 添加过期时间

3. **支付安全**
   - 添加支付金额验证
   - 防止重复支付
   - 添加支付回调验证

4. **数据验证**
   - 验证所有输入数据
   - 防止SQL注入
   - 防止XSS攻击

## 下一步优化

### 待实现功能

1. **用户系统**
   - [ ] 用户注册/登录
   - [ ] 个人中心
   - [ ] 密码修改
   - [ ] 实名认证

2. **支付功能**
   - [ ] 集成官方支付（支付宝/微信）
   - [ ] 自动对账
   - [ ] 发票开具
   - [ ] 退款处理

3. **会员功能**
   - [ ] 会员权益展示
   - [ ] 会员专属功能
   - [ ] 会员等级升级
   - [ ] 会员续费提醒

4. **营销功能**
   - [ ] 优惠券系统
   - [ ] 拼团功能
   - [ ] 邀请有礼
   - [ ] 积分商城

## 故障排查

### 常见问题

1. **订单创建失败**
   - 检查套餐配置是否正确
   - 检查用户ID是否正确
   - 查看浏览器控制台错误

2. **审核失败**
   - 检查管理员Token是否正确
   - 检查订单状态是否为pending
   - 查看服务器日志

3. **会员未开通**
   - 检查订单状态是否为paid
   - 查看membership_records表
   - 查看users表membership_expire_at字段

## 联系支持

如有问题，请联系：
- 技术支持：xxx
- 商务合作：xxx

---

**最后更新时间：2025-02-19**
