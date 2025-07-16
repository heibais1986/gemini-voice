# 🔐 密钥管理指南
## 概述
本指南详细说明如何安全地管理Gemini Playground项目中的敏感信息，使用Cloudflare Secrets确保密钥安全。
## 🚨 安全原则
### 为什么不能将密钥放在wrangler.toml中？
1. **版本控制风险**: wrangler.toml文件通常会被提交到Git仓库，密钥会暴露给所有有权访问代码的人
2. **日志泄露**: 构建日志、部署日志可能会意外显示配置文件内容
3. **权限管理**: 无法精确控制谁可以访问特定的密钥
4. **密钥轮换**: 更新密钥需要修改代码并重新部署
### Cloudflare Secrets的优势
1. **加密存储**: 密钥在Cloudflare中加密存储
2. **访问控制**: 只有授权的Cloudflare账户可以访问
3. **运行时注入**: 密钥在Worker运行时动态注入，不出现在代码中
4. **审计日志**: Cloudflare提供密钥访问的审计日志
## 📋 密钥分类
### 必需密钥
| 密钥名称 | 用途 | 安全级别 | 示例值 |
|---------|------|----------|--------|
| `SERVER_GEMINI_API_KEY` | 服务器使用的Gemini API Key | 🔴 高 | `AIza...` |
| `JWT_SECRET` | JWT令牌签名密钥 | 🔴 高 | 64位随机字符串 |
| `ENCRYPTION_KEY` | 用户API Key加密密钥 | 🔴 高 | 32位随机字符串 |
### 可选密钥
| 密钥名称 | 用途 | 安全级别 | 何时需要 |
|---------|------|----------|----------|
| `WECHAT_APP_SECRET` | 微信应用密钥 | 🟡 中 | 启用微信登录时 |
| `ALIPAY_PRIVATE_KEY` | 支付宝私钥 | 🔴 高 | 启用支付宝支付时 |
| `ALIPAY_PUBLIC_KEY` | 支付宝公钥 | 🟡 中 | 启用支付宝支付时 |
| `WECHAT_PAY_API_KEY` | 微信支付API密钥 | 🔴 高 | 启用微信支付时 |
## 🛠️ 设置方法
### 方法1: 使用自动化脚本（推荐）
**Linux/Mac用户**:
```bash
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh
```
**Windows用户**:
```cmd
scripts\setup-secrets.bat
```
脚本功能：
- ✅ 自动检查wrangler CLI安装和登录状态
- ✅ 自动生成安全的JWT_SECRET和ENCRYPTION_KEY
- ✅ 交互式设置所有必需和可选密钥
- ✅ 提供详细的设置指导和安全提醒
### 方法2: 手动设置
```bash
# 设置必需密钥
echo "your-server-gemini-api-key" | wrangler secret put SERVER_GEMINI_API_KEY
echo "your-jwt-secret-64-chars" | wrangler secret put JWT_SECRET
echo "your-encryption-key-32-chars" | wrangler secret put ENCRYPTION_KEY
# 设置可选密钥
echo "your-wechat-app-secret" | wrangler secret put WECHAT_APP_SECRET
echo "your-alipay-private-key" | wrangler secret put ALIPAY_PRIVATE_KEY
```
### 方法3: 交互式设置
```bash
# 交互式输入（密钥不会显示在终端中）
wrangler secret put SERVER_GEMINI_API_KEY
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY
```
## 🔑 密钥生成建议
### JWT_SECRET生成
```bash
# 使用OpenSSL生成64位随机字符串
openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
# 使用Node.js生成
node -e "console.log(require('crypto').randomBytes(64).toString('base64').replace(/[=+/]/g, '').substring(0, 64))"
```
### ENCRYPTION_KEY生成
```bash
# 使用OpenSSL生成32位随机字符串
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
# 使用Node.js生成
node -e "console.log(require('crypto').randomBytes(32).toString('base64').replace(/[=+/]/g, '').substring(0, 32))"
```
## 📊 密钥管理操作
### 查看已设置的密钥
```bash
wrangler secret list
```
### 更新密钥
```bash
# 更新现有密钥
echo "new-secret-value" | wrangler secret put SECRET_NAME
```
### 删除密钥
```bash
wrangler secret delete SECRET_NAME
```
### 批量操作
```bash
# 删除所有密钥（谨慎使用）
wrangler secret list --json | jq -r '.[].name' | xargs -I {} wrangler secret delete {}
```
## 🔄 密钥轮换策略
### 定期轮换
建议定期轮换以下密钥：
1. **JWT_SECRET**: 每6个月轮换一次
2. **ENCRYPTION_KEY**: 每年轮换一次（需要重新加密所有用户API Key）
3. **API密钥**: 根据提供商建议轮换
### 轮换步骤
1. **生成新密钥**
2. **更新Cloudflare Secrets**
3. **部署新版本**
4. **验证功能正常**
5. **撤销旧密钥**
### 紧急轮换
如果怀疑密钥泄露：
1. **立即更新所有相关密钥**
2. **强制所有用户重新登录**
3. **检查访问日志**
4. **通知相关人员**
## 🛡️ 安全最佳实践
### 开发环境
1. **使用不同的密钥**: 开发、测试、生产环境使用不同的密钥
2. **最小权限原则**: 只给开发人员必要的密钥访问权限
3. **定期审计**: 定期检查谁有权访问密钥
### 生产环境
1. **监控访问**: 监控密钥的访问和使用情况
2. **备份策略**: 安全地备份密钥（如果需要）
3. **事故响应**: 制定密钥泄露的应急响应计划
### 团队协作
1. **文档化**: 记录每个密钥的用途和负责人
2. **权限管理**: 使用Cloudflare的团队功能管理访问权限
3. **变更记录**: 记录密钥的变更历史
## 🚨 故障排除
### 常见问题
1. **密钥未生效**
   - 检查密钥名称是否正确
   - 确认已重新部署Worker
   - 验证密钥值是否正确
2. **wrangler命令失败**
   - 检查是否已登录: `wrangler whoami`
   - 检查权限: 确认有Worker编辑权限
   - 检查网络: 确认可以访问Cloudflare API
3. **密钥格式错误**
   - 检查密钥是否包含特殊字符
   - 确认密钥长度符合要求
   - 验证密钥编码格式
### 调试技巧
```bash
# 检查Worker环境变量
wrangler dev --local=false
# 查看部署日志
wrangler tail
# 测试密钥访问
wrangler dev --local=false --var TEST_MODE=true
```
## 📚 相关资源
- [Cloudflare Workers Secrets文档](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler CLI文档](https://developers.cloudflare.com/workers/wrangler/)
- [密钥管理最佳实践](https://owasp.org/www-project-cheat-sheets/cheatsheets/Key_Management_Cheat_Sheet.html)
## 🔍 审计清单
部署前检查：
- [ ] 所有必需密钥已设置
- [ ] 密钥强度符合要求
- [ ] wrangler.toml中无敏感信息
- [ ] 测试环境密钥与生产环境分离
- [ ] 团队成员权限配置正确
- [ ] 密钥轮换计划已制定
通过遵循这些最佳实践，您可以确保Gemini Playground项目的密钥安全，避免敏感信息泄露的风险。
