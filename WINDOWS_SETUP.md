# 🪟 Windows 用户设置指南

## 概述

本指南专门为Windows用户提供密钥设置的解决方案。由于Windows批处理脚本的限制，我们提供了多种设置方式。

## 🚨 批处理脚本闪退问题解决

如果您遇到 `setup-secrets.bat` 脚本闪退的问题，这通常是由于以下原因：

1. **字符编码问题**：Windows批处理对UTF-8字符支持有限
2. **权限问题**：脚本可能需要管理员权限
3. **环境变量问题**：某些环境变量可能导致脚本异常退出

## 🔧 解决方案

### 方案1：使用PowerShell脚本（推荐）

PowerShell在Windows上更稳定，支持更好的错误处理：

```powershell
# 在项目根目录打开PowerShell
npm run setup-secrets:ps1

# 或者直接运行
powershell -ExecutionPolicy Bypass -File scripts\setup-secrets.ps1
```

**优势**：
- ✅ 更好的错误处理
- ✅ 支持安全密码输入
- ✅ 自动生成随机密钥
- ✅ 彩色输出，用户体验更好

### 方案2：使用简化批处理脚本

我们提供了一个简化版的批处理脚本：

```cmd
npm run setup-secrets:win-simple

# 或者直接运行
scripts\setup-secrets-simple.bat
```

**特点**：
- ✅ 移除了复杂的Unicode字符
- ✅ 简化了逻辑流程
- ✅ 更好的错误处理

### 方案3：手动设置（最稳定）

如果脚本仍然有问题，可以手动设置密钥：

```cmd
# 1. 检查wrangler是否已安装
wrangler --version

# 2. 检查登录状态
wrangler whoami

# 3. 手动设置每个密钥
wrangler secret put SERVER_GEMINI_API_KEY
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY

# 4. 查看已设置的密钥
wrangler secret list
```

### 方案4：使用Git Bash（如果已安装）

如果您安装了Git for Windows，可以使用Git Bash运行Linux脚本：

```bash
# 在Git Bash中运行
npm run setup-secrets
```

## 📋 详细步骤

### 使用PowerShell脚本（推荐方式）

1. **打开PowerShell**：
   - 按 `Win + X`，选择"Windows PowerShell"
   - 或者在开始菜单搜索"PowerShell"

2. **导航到项目目录**：
   ```powershell
   cd C:\path\to\your\gemini-playground
   ```

3. **运行脚本**：
   ```powershell
   npm run setup-secrets:ps1
   ```

4. **按照提示操作**：
   - 脚本会自动检查wrangler安装和登录状态
   - 对于JWT_SECRET和ENCRYPTION_KEY，可以选择自动生成
   - 对于SERVER_GEMINI_API_KEY，需要手动输入您的Gemini API Key

### 手动设置步骤

如果所有脚本都有问题，请按以下步骤手动设置：

1. **打开命令提示符或PowerShell**

2. **导航到项目目录**

3. **检查环境**：
   ```cmd
   wrangler --version
   wrangler whoami
   ```

4. **设置必需密钥**：

   **SERVER_GEMINI_API_KEY**：
   ```cmd
   wrangler secret put SERVER_GEMINI_API_KEY
   ```
   输入您的Gemini API Key

   **JWT_SECRET**：
   ```cmd
   wrangler secret put JWT_SECRET
   ```
   输入一个64位随机字符串，或使用在线生成器

   **ENCRYPTION_KEY**：
   ```cmd
   wrangler secret put ENCRYPTION_KEY
   ```
   输入一个32位随机字符串

5. **验证设置**：
   ```cmd
   wrangler secret list
   ```

## 🔑 密钥生成工具

如果需要生成随机密钥，可以使用以下方法：

### 在线生成器
- [Random.org](https://www.random.org/strings/)
- [LastPass Password Generator](https://www.lastpass.com/password-generator)

### PowerShell生成
```powershell
# 生成64位JWT密钥
[System.Web.Security.Membership]::GeneratePassword(64, 10)

# 生成32位加密密钥
[System.Web.Security.Membership]::GeneratePassword(32, 5)
```

### Node.js生成
```javascript
// 在Node.js中生成
const crypto = require('crypto');

// 64位JWT密钥
console.log(crypto.randomBytes(64).toString('base64').replace(/[=+/]/g, '').substring(0, 64));

// 32位加密密钥
console.log(crypto.randomBytes(32).toString('base64').replace(/[=+/]/g, '').substring(0, 32));
```

## 🐛 常见问题

### Q: PowerShell提示"执行策略"错误
**A**: 运行以下命令临时允许脚本执行：
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### Q: wrangler命令不存在
**A**: 安装wrangler CLI：
```cmd
npm install -g wrangler
```

### Q: 未登录到Cloudflare
**A**: 登录Cloudflare：
```cmd
wrangler login
```

### Q: 密钥设置失败
**A**: 检查网络连接和Cloudflare权限：
```cmd
wrangler whoami
wrangler secret list
```

## 📚 相关文档

- [快速部署指南](QUICK_DEPLOY.md)
- [密钥管理指南](SECRETS_MANAGEMENT.md)
- [部署检查清单](DEPLOYMENT_CHECKLIST.md)

## 💡 提示

1. **推荐使用PowerShell脚本**，它提供最好的Windows兼容性
2. **如果遇到问题，优先尝试手动设置**，这是最可靠的方法
3. **保存好生成的密钥**，以备将来需要更新时使用
4. **定期检查密钥状态**：`wrangler secret list`

通过以上方法，Windows用户应该能够成功设置所有必需的密钥。如果仍有问题，请参考手动设置方法或联系技术支持。
