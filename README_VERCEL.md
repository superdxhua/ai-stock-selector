# 🚀 Vercel 部署快速开始

## 📦 已配置的文件

1. ✅ `vercel.json` - Vercel 配置文件
2. ✅ `.env.example` - 环境变量示例
3. ✅ `VERCEL_DEPLOYMENT.md` - 详细部署指南
4. ✅ `scripts/deploy-vercel.sh` - 快速部署脚本

## 🎯 快速部署（3 步完成）

### 第 1 步：准备环境变量

编辑 `.env.local` 文件，填入您的配置：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 豆包 API
DOUBAO_API_KEY=your-doubao-api-key
```

### 第 2 步：运行部署脚本

```bash
bash scripts/deploy-vercel.sh
```

脚本会自动：
- ✅ 检查依赖（Node.js、pnpm、Vercel CLI）
- ✅ 提示登录 Vercel
- ✅ 构建项目
- ✅ 部署到 Vercel

### 第 3 步：配置环境变量

部署完成后，在 Vercel Dashboard 中添加环境变量：

1. 访问 Vercel Dashboard
2. 进入项目设置 > Environment Variables
3. 添加以下变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DOUBAO_API_KEY`

4. 重新部署项目

## 📖 详细文档

查看完整部署指南：[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

## 💰 费用说明

### 免费额度

| 服务 | 免费额度 |
|------|---------|
| Vercel | 100GB 带宽/月 |
| Supabase | 500MB 存储 + 1GB 传输/月 |
| 豆包 API | 按量计费 |

### 预估成本

- **小型项目**（< 100 用户/天）：**免费**
- **中型项目**（100-1000 用户/天）：**$0-50/月**
- **大型项目**（> 1000 用户/天）：**$50-200/月**

## ⚠️ 重要提示

1. **不要在代码中硬编码敏感信息**
2. **定期轮换 API 密钥**
3. **监控 API 使用量**
4. **备份数据库**
5. **生产环境使用强密码**

## 🆘 常见问题

### Q: 部署失败怎么办？
A: 查看 VERCEL_DEPLOYMENT.md 的"常见问题"章节

### Q: 如何配置自定义域名？
A: 在 Vercel Dashboard > Settings > Domains 中添加

### Q: 数据库连接数不足？
A: 升级 Supabase 计划或优化查询

## 📞 技术支持

- **Vercel 文档**：https://vercel.com/docs
- **Supabase 文档**：https://supabase.com/docs
- **完整指南**：[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

---

**准备好了吗？运行 `bash scripts/deploy-vercel.sh` 开始部署吧！** 🚀
