
# 用户系统部署指南
## 概述
本指南将帮助您部署带有用户系统的 Gemini Playground，包括用户认证、支付系统和权限管理。
## 功能特性
### 🔐 用户认证系统
- **手机号登录**：支持短信验证码登录
- **微信登录**：支持微信扫码登录
- **会话管理**：安全的会话令牌管理
- **权限控制**：基于用户类型的权限管理
### 💰 支付系统
- **微信支付**：支持微信扫码支付
- **支付宝支付**：支持支付宝扫码支付
- **订单管理**：完整的订单生命周期管理
- **自动升级**：支付成功后自动升级为付费用户
### 👥 用户管理
- **免费用户**：需要输入自己的API Key，每日100次调用限制
- **付费用户**：使用服务器API Key，每日10,000次调用限制
- **使用统计**：详细的API使用统计和分析
## 部署步骤
### 1. 创建 Cloudflare D1 数据库
```bash
# 创建数据库
wrangler d1 create gemini-playground-db
# 记录返回的数据库ID，更新 wrangler.toml 中的 database_id
```
### 2. 初始化数据库
```bash
# 执行数据库初始化脚本
wrangler d1 execute gemini-playground-db --file=database/init.sql
```
### 3. 配置环境变量
编辑 `wrangler.toml` 文件，配置以下变量：
```toml
[vars]
# 网络配置
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com"
GEMINI_API_FALLBACK_URLS = "https://generativelanguage.googleapis.com"
# 用户系统配置
SERVER_GEMINI_API_KEY = "your-server-gemini-api-key"  # 服务器的Gemini API Key
JWT_SECRET = "your-jwt-secret-key"                     # JWT签名密钥
ENCRYPTION_KEY = "your-encryption-key"                 # 数据加密密钥
# 微信登录配置
WECHAT_APP_ID = "your-wechat-app-id"
WECHAT_APP_SECRET = "your-wechat-app-secret"
# 支付配置
ALIPAY_APP_ID = "your-alipay-app-id"
ALIPAY_PRIVATE_KEY = "your-alipay-private-key"
ALIPAY_PUBLIC_KEY = "your-alipay-public-key"
# 微信支付配置
WECHAT_PAY_MCH_ID = "your-wechat-pay-mch-id"
WECHAT_PAY_API_KEY = "your-wechat-pay-api-key"
```
### 4. 配置数据库绑定
确保 `wrangler.toml` 中的数据库配置正确：
```toml
[[d1_databases]]
binding = "DB"
database_name = "gemini-playground-db"
database_id = "your-database-id-here"  # 替换为实际的数据库ID
```
### 5. 部署应用
```bash
# 部署到 Cloudflare Workers
wrangler deploy
```
## 配置说明
### 必需配置
1. **SERVER_GEMINI_API_KEY**: 服务器使用的Gemini API Key，付费用户将使用此Key
2. **JWT_SECRET**: 用于签名JWT令牌的密钥，请使用强密码
3. **ENCRYPTION_KEY**: 用于加密用户API Key的密钥
### 可选配置
1. **微信登录**: 如需支持微信登录，需配置微信应用信息
2. **支付功能**: 如需支持在线支付，需配置支付宝和微信支付信息
## API 接口文档
### 用户认证
#### 手机号登录
```
POST /api/auth/login/phone
Content-Type: application/json
{
  "phone": "13800138000",
  "verificationCode": "123456"
}
```
#### 微信登录
```
POST /api/auth/login/wechat
Content-Type: application/json
{
  "code": "wechat_auth_code"
}
```
#### 登出
```
POST /api/auth/logout
Authorization: Bearer <session_token>
```
### 用户管理
#### 获取用户信息
```
GET /api/user/profile
Authorization: Bearer <session_token>
```
#### 更新API Key
```
PUT /api/user/api-key
Authorization: Bearer <session_token>
Content-Type: application/json
{
  "apiKey": "your-gemini-api-key"
}
```
#### 获取权限信息
```
GET /api/user/permission
Authorization: Bearer <session_token>
```
### 支付系统
#### 创建支付订单
```
POST /api/payment/create
Authorization: Bearer <session_token>
Content-Type: application/json
{
  "paymentMethod": "wechat",  // 或 "alipay"
  "amount": 20.00
}
```
#### 查询订单状态
```
GET /api/payment/status?orderNo=<order_number>
Authorization: Bearer <session_token>
```
## 前端集成
### 登录检查
前端会自动检查用户登录状态：
```javascript
// 检查用户是否已登录
const sessionToken = localStorage.getItem('sessionToken');
if (!sessionToken) {
    // 显示登录页面
    window.location.href = '/login.html';
}
```
### API 调用
所有API调用都需要包含认证头：
```javascript
const response = await fetch('/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
});
```
## 测试
### 网络连接测试
```bash
# Node.js 环境
npm run test:network
# Deno 环境
deno task test:network
```
### 功能测试
1. **用户注册/登录测试**
   - 访问 `/login.html`
   - 测试手机号登录（验证码：123456）
   - 测试微信登录（如已配置）
2. **API 调用测试**
   - 登录后访问主页
   - 测试聊天功能
   - 检查API调用限制
3. **支付功能测试**
   - 创建支付订单
   - 测试支付流程
   - 验证用户升级
## 故障排除
### 常见问题
1. **数据库连接失败**
   - 检查数据库ID是否正确
   - 确认数据库已正确初始化
2. **用户登录失败**
   - 检查JWT密钥配置
   - 验证会话令牌是否有效
3. **API调用被拒绝**
   - 确认用户已登录
   - 检查API调用限制
   - 验证API Key配置
4. **支付功能异常**
   - 检查支付配置是否正确
   - 验证支付回调URL
   - 查看支付日志
### 日志查看
```bash
# 查看 Worker 日志
wrangler tail
# 查看数据库内容
wrangler d1 execute gemini-playground-db --command="SELECT * FROM users LIMIT 10"
```
## 安全建议
1. **密钥管理**
   - 使用强密码作为JWT密钥
   - 定期轮换加密密钥
   - 不要在代码中硬编码密钥
2. **数据保护**
   - 用户API Key采用加密存储
   - 敏感信息不记录在日志中
   - 定期清理过期会话
3. **访问控制**
   - 实施API调用限制
   - 监控异常访问模式
   - 及时处理安全事件
## 维护
### 定期任务
1. **清理过期会话**
2. **统计使用数据**
3. **备份数据库**
4. **更新系统配置**
### 监控指标
1. **用户活跃度**
2. **API调用量**
3. **支付成功率**
4. **系统错误率**
## 支持
如果在部署过程中遇到问题，请：
1. 查看部署日志
2. 检查配置文件
3. 运行网络测试
4. 查阅故障排除指南
更多技术支持，请参考项目文档或提交Issue。
# 用户系统部署指南
## 概述
本指南将帮助您部署带有用户系统的 Gemini Playground，包括用户认证、支付系统和权限管理。
## 功能特性
### 🔐 用户认证系统
- **手机号登录**：支持短信验证码登录
- **微信登录**：支持微信扫码登录
- **会话管理**：安全的会话令牌管理
- **权限控制**：基于用户类型的权限管理
### 💰 支付系统
- **微信支付**：支持微信扫码支付
- **支付宝支付**：支持支付宝扫码支付
- **订单管理**：完整的订单生命周期管理
- **自动升级**：支付成功后自动升级为付费用户
### 👥 用户管理
- **免费用户**：需要输入自己的API Key，每日100次调用限制
- **付费用户**：使用服务器API Key，每日10,000次调用限制
- **使用统计**：详细的API使用统计和分析
## 部署步骤
### 1. 创建 Cloudflare D1 数据库
```bash
# 创建数据库
wrangler d1 create gemini-playground-db
# 记录返回的数据库ID，更新 wrangler.toml 中的 database_id
```
### 2. 初始化数据库
```bash
# 执行数据库初始化脚本
wrangler d1 execute gemini-playground-db --file=database/init.sql
```
### 3. 配置环境变量和密钥
#### 3.1 配置公开变量
编辑 `wrangler.toml` 文件，配置非敏感的公开变量：
```toml
[vars]
# 网络配置
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com"
GEMINI_API_FALLBACK_URLS = "https://generativelanguage.googleapis.com"
# 非敏感的公开配置
WECHAT_APP_ID = "your-wechat-app-id"                   # 微信应用ID（公开信息）
ALIPAY_APP_ID = "your-alipay-app-id"                   # 支付宝应用ID（公开信息）
WECHAT_PAY_MCH_ID = "your-wechat-pay-mch-id"           # 微信支付商户号（公开信息）
```
#### 3.2 设置敏感密钥（推荐方式）
**使用自动化脚本设置密钥**：
```bash
# Linux/Mac 用户
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh
# Windows 用户
scripts\setup-secrets.bat
```
**手动设置密钥**：
```bash
# 必需的密钥
wrangler secret put SERVER_GEMINI_API_KEY    # 服务器的Gemini API Key
wrangler secret put JWT_SECRET               # JWT签名密钥
wrangler secret put ENCRYPTION_KEY           # 数据加密密钥
# 可选的密钥（根据需要设置）
wrangler secret put WECHAT_APP_SECRET        # 微信应用密钥
wrangler secret put ALIPAY_PRIVATE_KEY       # 支付宝应用私钥
wrangler secret put ALIPAY_PUBLIC_KEY        # 支付宝公钥
wrangler secret put WECHAT_PAY_API_KEY       # 微信支付API密钥
```
**查看已设置的密钥**：
```bash
wrangler secret list
```
### 4. 配置数据库绑定
确保 `wrangler.toml` 中的数据库配置正确：
```toml
[[d1_databases]]
binding = "DB"
database_name = "gemini-playground-db"
database_id = "your-database-id-here"  # 替换为实际的数据库ID
```
### 5. 部署应用
```bash
# 部署到 Cloudflare Workers
wrangler deploy
```
## 配置说明
### 必需配置
1. **SERVER_GEMINI_API_KEY**: 服务器使用的Gemini API Key，付费用户将使用此Key
2. **JWT_SECRET**: 用于签名JWT令牌的密钥，请使用强密码
3. **ENCRYPTION_KEY**: 用于加密用户API Key的密钥
### 可选配置
1. **微信登录**: 如需支持微信登录，需配置微信应用信息
2. **支付功能**: 如需支持在线支付，需配置支付宝和微信支付信息
## API 接口文档
### 用户认证
#### 手机号登录
```
POST /api/auth/login/phone
Content-Type: application/json
{
  "phone": "13800138000",
  "verificationCode": "123456"
}
```
#### 微信登录
```
POST /api/auth/login/wechat
Content-Type: application/json
{
  "code": "wechat_auth_code"
}
```
#### 登出
```
POST /api/auth/logout
Authorization: Bearer <session_token>
```
### 用户管理
#### 获取用户信息
```
GET /api/user/profile
Authorization: Bearer <session_token>
```
#### 更新API Key
```
PUT /api/user/api-key
Authorization: Bearer <session_token>
Content-Type: application/json
{
  "apiKey": "your-gemini-api-key"
}
```
#### 获取权限信息
```
GET /api/user/permission
Authorization: Bearer <session_token>
```
### 支付系统
#### 创建支付订单
```
POST /api/payment/create
Authorization: Bearer <session_token>
Content-Type: application/json
{
  "paymentMethod": "wechat",  // 或 "alipay"
  "amount": 20.00
}
```
#### 查询订单状态
```
GET /api/payment/status?orderNo=<order_number>
Authorization: Bearer <session_token>
```
## 前端集成
### 登录检查
前端会自动检查用户登录状态：
```javascript
// 检查用户是否已登录
const sessionToken = localStorage.getItem('sessionToken');
if (!sessionToken) {
    // 显示登录页面
    window.location.href = '/login.html';
}
```
### API 调用
所有API调用都需要包含认证头：
```javascript
const response = await fetch('/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
});
```
## 测试
### 网络连接测试
```bash
# Node.js 环境
npm run test:network
# Deno 环境
deno task test:network
```
### 功能测试
1. **用户注册/登录测试**
   - 访问 `/login.html`
   - 测试手机号登录（验证码：123456）
   - 测试微信登录（如已配置）
2. **API 调用测试**
   - 登录后访问主页
   - 测试聊天功能
   - 检查API调用限制
3. **支付功能测试**
   - 创建支付订单
   - 测试支付流程
   - 验证用户升级
## 故障排除
### 常见问题
1. **数据库连接失败**
   - 检查数据库ID是否正确
   - 确认数据库已正确初始化
2. **用户登录失败**
   - 检查JWT密钥配置
   - 验证会话令牌是否有效
3. **API调用被拒绝**
   - 确认用户已登录
   - 检查API调用限制
   - 验证API Key配置
4. **支付功能异常**
   - 检查支付配置是否正确
   - 验证支付回调URL
   - 查看支付日志
### 日志查看
```bash
# 查看 Worker 日志
wrangler tail
# 查看数据库内容
wrangler d1 execute gemini-playground-db --command="SELECT * FROM users LIMIT 10"
```
## 安全建议
1. **密钥管理**
   - 使用强密码作为JWT密钥
   - 定期轮换加密密钥
   - 不要在代码中硬编码密钥
2. **数据保护**
   - 用户API Key采用加密存储
   - 敏感信息不记录在日志中
   - 定期清理过期会话
3. **访问控制**
   - 实施API调用限制
   - 监控异常访问模式
   - 及时处理安全事件
## 维护
### 定期任务
1. **清理过期会话**
2. **统计使用数据**
3. **备份数据库**
4. **更新系统配置**
### 监控指标
1. **用户活跃度**
2. **API调用量**
3. **支付成功率**
4. **系统错误率**
## 支持
如果在部署过程中遇到问题，请：
1. 查看部署日志
2. 检查配置文件
3. 运行网络测试
4. 查阅故障排除指南
更多技术支持，请参考项目文档或提交Issue。
