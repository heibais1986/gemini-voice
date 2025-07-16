# 🚀 快速部署指南

## 概述

本指南将帮助您在5分钟内完成Gemini Playground的安全部署，使用Cloudflare Secrets管理敏感信息。

## ⚡ 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) (v16+)
- [Cloudflare账户](https://dash.cloudflare.com/)
- [Gemini API Key](https://aistudio.google.com/app/apikey)

### 1️⃣ 安装和登录

```bash
# 安装wrangler CLI
npm install -g wrangler

# 登录Cloudflare
wrangler login

# 克隆项目
git clone <your-repo-url>
cd gemini-playground

# 安装依赖
npm install
```

### 2️⃣ 创建数据库

```bash
# 创建D1数据库
wrangler d1 create gemini-playground-db

# 复制返回的database_id，更新wrangler.toml中的database_id字段
```

### 3️⃣ 初始化数据库

```bash
# 执行数据库初始化脚本
wrangler d1 execute gemini-playground-db --file=database/init.sql
```

### 4️⃣ 设置密钥（重要！）

**选择一种方式设置密钥：**

#### 方式A: 自动化脚本（推荐）

```bash
# Linux/Mac用户
npm run setup-secrets

# Windows用户
npm run setup-secrets:win
```

#### 方式B: 手动设置

```bash
# 设置必需的密钥
wrangler secret put SERVER_GEMINI_API_KEY    # 输入您的Gemini API Key
wrangler secret put JWT_SECRET               # 输入64位随机字符串
wrangler secret put ENCRYPTION_KEY           # 输入32位随机字符串
```

#### 方式C: 快速生成并设置

```bash
# 自动生成并设置JWT_SECRET
openssl rand -base64 64 | tr -d "=+/" | cut -c1-64 | wrangler secret put JWT_SECRET

# 自动生成并设置ENCRYPTION_KEY
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32 | wrangler secret put ENCRYPTION_KEY

# 手动设置Gemini API Key
wrangler secret put SERVER_GEMINI_API_KEY
```

### 5️⃣ 配置公开变量

编辑 `wrangler.toml`，更新database_id：

```toml
[[d1_databases]]
binding = "DB"
database_name = "gemini-playground-db"
database_id = "your-actual-database-id-here"  # 替换为步骤2中获得的ID
```

### 6️⃣ 部署

```bash
# 部署到Cloudflare Workers
wrangler deploy
```

### 7️⃣ 验证部署

```bash
# 查看已设置的密钥
wrangler secret list

# 测试网络连接
npm run test:network
```

## ✅ 部署检查清单

部署完成后，请检查以下项目：

- [ ] 数据库已创建并初始化
- [ ] 所有必需密钥已设置（SERVER_GEMINI_API_KEY, JWT_SECRET, ENCRYPTION_KEY）
- [ ] wrangler.toml中的database_id已更新
- [ ] 部署成功，无错误信息
- [ ] 可以访问部署的URL
- [ ] 登录功能正常工作
- [ ] API调用功能正常

## 🔧 常见问题

### Q: 部署失败，提示数据库连接错误
**A**: 检查wrangler.toml中的database_id是否正确，确保数据库已创建。

### Q: 登录后提示"JWT验证失败"
**A**: 检查JWT_SECRET是否已正确设置：`wrangler secret list`

### Q: API调用被拒绝
**A**: 检查SERVER_GEMINI_API_KEY是否已设置且有效。

### Q: 忘记设置了哪些密钥
**A**: 运行 `wrangler secret list` 查看已设置的密钥。

## 🔐 安全提醒

1. **不要在代码中硬编码密钥**
2. **定期轮换密钥**
3. **使用强随机密钥**
4. **不要将.env文件提交到Git**
5. **定期检查访问日志**

## 📱 测试部署

部署完成后，访问您的Worker URL：

1. **首次访问**: 应该自动跳转到登录页面
2. **登录测试**: 使用手机号登录（验证码：123456）
3. **功能测试**: 登录后测试聊天功能
4. **权限测试**: 验证付费/免费用户的不同体验

## 🔄 更新部署

```bash
# 更新代码后重新部署
git pull
npm install
wrangler deploy

# 更新数据库结构（如有需要）
wrangler d1 execute gemini-playground-db --file=database/migration.sql
```

## 📊 监控和维护

```bash
# 查看实时日志
wrangler tail

# 查看密钥列表
npm run secrets:list

# 查看数据库内容
wrangler d1 execute gemini-playground-db --command="SELECT COUNT(*) FROM users"
```

## 🆘 获取帮助

如果遇到问题：

1. 查看 [完整部署指南](USER_SYSTEM_DEPLOYMENT.md)
2. 查看 [密钥管理指南](SECRETS_MANAGEMENT.md)
3. 查看 [故障排除指南](TROUBLESHOOTING.md)
4. 提交Issue到GitHub仓库

---

🎉 **恭喜！您的Gemini Playground已成功部署！**

现在您可以享受安全、功能完整的多模态AI对话平台了。
