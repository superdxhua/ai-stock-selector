# 管理员登录系统使用文档

## 功能概述

实现完整的管理员登录系统，包括登录页面、登录验证、状态管理和登出功能。

## 功能特性

### 1. 登录页面
- 现代化的登录界面设计
- 用户名和密码输入
- 表单验证
- 错误提示
- 加载状态显示

### 2. 登录验证
- 用户名和密码验证
- 管理员权限检查
- Token生成
- 登录信息保存

### 3. 状态管理
- React Context管理登录状态
- LocalStorage持久化
- 自动恢复登录状态
- 登出功能

### 4. 权限控制
- 根据登录状态显示不同功能
- 同花顺策略仅管理员可见
- 登录/登出按钮切换

## 文件结构

### 前端页面
```
src/
├── app/
│   ├── admin/
│   │   └── login/
│   │       └── page.tsx          # 登录页面
│   ├── layout.tsx                # 添加AdminAuthProvider
│   └── page.tsx                  # 主页（集成登录功能）
├── contexts/
│   └── AdminAuthContext.tsx      # 登录状态管理
└── components/
    ├── AdminOrdersPage.tsx       # 管理员订单页面
    └── SubscriptionPage.tsx      # 订阅页面
```

### API接口
```
src/app/api/admin/
├── login/
│   └── route.ts                  # 登录API
└── logout/
    └── route.ts                  # 登出API
```

### 数据库迁移
```
src/storage/database/migrations/
└── create_admin_user.sql         # 创建管理员账户
```

## API接口文档

### 登录API

**请求**
```http
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**成功响应**
```json
{
  "success": true,
  "data": {
    "token": "base64_encoded_token",
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  },
  "message": "登录成功"
}
```

**失败响应**
```json
{
  "success": false,
  "error": "用户名或密码错误"
}
```

### 登出API

**请求**
```http
POST /api/admin/logout
```

**响应**
```json
{
  "success": true,
  "message": "登出成功"
}
```

## 使用说明

### 1. 创建管理员账户

执行数据库迁移脚本创建管理员账户：

```bash
psql -U your_username -d your_database \
  -f src/storage/database/migrations/create_admin_user.sql
```

或在 Supabase Dashboard 中执行：

```sql
INSERT INTO users (id, username, email, password, role, membership_level)
VALUES (
  gen_random_uuid(),
  'admin',
  'admin@example.com',
  'admin123',
  'admin',
  'paid'
);
```

### 2. 登录流程

1. 访问登录页面：`http://localhost:5000/admin/login`
2. 输入用户名和密码：
   - 用户名：`admin`
   - 密码：`admin123`
3. 点击"登录"按钮
4. 登录成功后自动跳转到首页

### 3. 登出流程

1. 在导航栏右上角点击"登出"按钮
2. 清除本地存储的登录信息
3. 返回未登录状态

## 测试账号

```
用户名: admin
密码: admin123
角色: admin
```

## 权限说明

### 管理员登录后
- ✅ 可以查看所有功能
- ✅ 可以查看"🌸 同花顺"策略
- ✅ 可以访问"⚙️ 订单管理"
- ✅ 可以查看"💎 订阅会员"
- ✅ 导航栏显示"登出"按钮

### 未登录用户
- ❌ 无法查看"🌸 同花顺"策略
- ✅ 可以查看其他公开功能
- ✅ 导航栏显示"🔐 管理员登录"按钮

## 代码示例

### 使用AdminAuthContext

```typescript
import { useAdminAuth } from "@/contexts/AdminAuthContext";

function MyComponent() {
  const { isAdminLoggedIn, adminUser, logout } = useAdminAuth();
  
  if (isAdminLoggedIn) {
    return <div>欢迎, {adminUser?.username}</div>;
  }
  
  return <div>请先登录</div>;
}
```

### 检查管理员权限

```typescript
import { isAdminUser } from "@/lib/subscription-system";

// 检查用户是否为管理员
const isAdmin = await isAdminUser(userId);
```

## 安全建议

### 当前实现（简化版）
- 密码明文存储（不推荐生产环境）
- Token使用Base64编码（不推荐生产环境）
- 无Token过期机制
- 无密码加密

### 生产环境建议

1. **密码加密**
   - 使用bcrypt或argon2加密密码
   - 示例：
   ```typescript
   import bcrypt from 'bcrypt';
   
   const hashedPassword = await bcrypt.hash(password, 10);
   const isValid = await bcrypt.compare(password, hashedPassword);
   ```

2. **JWT Token**
   - 使用jsonwebtoken生成JWT
   - 设置过期时间
   - 示例：
   ```typescript
   import jwt from 'jsonwebtoken';
   
   const token = jwt.sign(
     { userId: user.id, role: user.role },
     process.env.JWT_SECRET,
     { expiresIn: '24h' }
   );
   ```

3. **HTTPS**
   - 使用HTTPS保护传输安全
   - 防止中间人攻击

4. **登录限制**
   - 添加登录尝试次数限制
   - 添加验证码功能
   - 添加IP黑名单

5. **会话管理**
   - 实现会话过期机制
   - 添加刷新Token功能
   - 实现"记住我"功能

6. **审计日志**
   - 记录所有登录/登出操作
   - 记录管理员操作日志
   - 定期审查日志

## 常见问题

### Q: 登录后没有显示同花顺策略？

A: 请确保：
1. 用户角色为 `admin`
2. 已正确登录
3. 刷新页面（如果缓存问题）

### Q: 如何修改管理员密码？

A: 执行SQL：
```sql
UPDATE users
SET password = 'new_password'
WHERE username = 'admin';
```

### Q: Token过期了怎么办？

A: 当前简化版Token不会过期。生产环境应实现JWT和刷新Token机制。

### Q: 如何添加更多管理员？

A: 执行SQL：
```sql
INSERT INTO users (username, email, password, role)
VALUES (
  'admin2',
  'admin2@example.com',
  'password123',
  'admin'
);
```

## 后续优化

1. ✅ 实现密码加密（bcrypt）
2. ✅ 使用JWT替代Base64 Token
3. ✅ 添加Token过期机制
4. ✅ 实现刷新Token
5. ✅ 添加登录限制和验证码
6. ✅ 实现操作审计日志
7. ✅ 添加"记住我"功能
8. ✅ 实现双因素认证（2FA）
9. ✅ 添加管理员管理界面
10. ✅ 实现更细粒度的权限控制

---

**最后更新时间：2025-02-19**
