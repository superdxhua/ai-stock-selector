# 同花顺策略管理员权限说明

## 功能概述

同花顺策略功能已设置为仅对**管理员用户**可见，普通用户无法在导航栏中看到同花顺策略按钮。

## 实现原理

### 1. 用户角色系统

数据库中添加了用户角色字段：
- `role` 字段：`admin`（管理员）或 `user`（普通用户）
- 默认值：`user`

### 2. 前端权限控制

前端页面根据用户角色动态显示导航按钮：
- 管理员用户：显示所有功能按钮，包括"🌸 同花顺"
- 普通用户：不显示"🌸 同花顺"按钮

### 3. API检查

所有相关API都会检查用户角色：
- `/api/user/info` - 返回用户完整信息（角色+会员状态）
- `/api/user/membership` - 返回会员状态
- 其他受保护资源可添加角色验证

## 设置管理员用户

### 方法1：直接修改数据库

```sql
-- 将指定用户设置为管理员
UPDATE users
SET role = 'admin'
WHERE id = 'your-user-id';
```

### 方法2：通过Supabase Dashboard

1. 登录Supabase Dashboard
2. 进入Table Editor
3. 选择 `users` 表
4. 找到目标用户
5. 将 `role` 字段修改为 `admin`

### 方法3：通过API（需要实现）

```bash
# 设置管理员API（需要先实现）
POST /api/admin/set-admin
Headers: {
  "x-admin-token": "admin-token-123456",
  "Content-Type": "application/json"
}
Body: {
  "userId": "your-user-id"
}
```

## API接口

### 获取用户信息

```bash
GET /api/user/info
Headers: {
  "x-user-id": "demo-user-id"
}

响应:
{
  "success": true,
  "data": {
    "role": "user",
    "isAdmin": false,
    "membership": {
      "isMember": false,
      "canViewStrategy": false,
      "daysLeft": 0,
      "isTrial": false,
      ...
    }
  }
}
```

### 获取会员状态

```bash
GET /api/user/membership
Headers: {
  "x-user-id": "demo-user-id"
}

响应:
{
  "success": true,
  "data": {
    "isMember": false,
    "canViewStrategy": false,
    "daysLeft": 0,
    "isTrial": false,
    ...
  }
}
```

## 数据库表结构

### users 表

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user',  -- admin 或 user
  membership_level VARCHAR(20) DEFAULT 'free',
  membership_expire_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 前端实现

```typescript
// src/app/page.tsx

const [isAdmin, setIsAdmin] = useState(false);

// 加载用户角色
useEffect(() => {
  checkUserRole();
}, []);

const checkUserRole = async () => {
  try {
    const response = await fetch("/api/user/info", {
      headers: {
        "x-user-id": "demo-user-id",
      },
    });
    const result = await response.json();
    if (result.success) {
      setIsAdmin(result.data.isAdmin);
    }
  } catch (error) {
    console.error("获取用户角色失败:", error);
  }
};

// 导航栏中
{isAdmin && (
  <button onClick={() => setActiveTab("tonghuashun")}>
    🌸 同花顺
  </button>
)}
```

## 安全建议

1. **管理员Token验证**：
   - 当前使用简化版Token：`admin-token-123456`
   - 生产环境应使用更安全的认证方式（JWT、Session等）

2. **API权限控制**：
   - 所有敏感操作都应验证管理员权限
   - 添加操作日志记录

3. **前端权限控制**：
   - 仅作为用户体验优化
   - 不能替代后端权限验证

4. **用户认证**：
   - 实现完整的用户登录注册系统
   - 使用HTTPS保护传输安全

## 测试步骤

### 测试普通用户

1. 确认用户的 `role` 字段为 `user`
2. 访问首页
3. 检查导航栏，不应看到"🌸 同花顺"按钮

### 测试管理员用户

1. 将用户的 `role` 字段修改为 `admin`
2. 刷新页面
3. 检查导航栏，应看到"🌸 同花顺"按钮
4. 点击按钮应能正常访问同花顺策略页面

## 常见问题

### Q: 如何恢复为普通用户？

A: 将用户的 `role` 字段改回 `user` 即可。

### Q: 为什么修改角色后看不到变化？

A: 请确保：
1. 数据库更新成功
2. 刷新了浏览器页面
3. 清除了浏览器缓存（如果需要）

### Q: 可以有多个管理员吗？

A: 可以，将多个用户的 `role` 字段设置为 `admin` 即可。

### Q: 如何保护管理员账户？

A: 建议：
1. 使用强密码
2. 定期更换密码
3. 启用双重认证（如果支持）
4. 限制管理员账户数量

## 后续优化

1. 实现管理员登录页面
2. 添加操作审计日志
3. 实现更细粒度的权限控制
4. 添加管理员权限管理界面
5. 实现角色继承和权限组

---

**最后更新时间：2025-02-19**
