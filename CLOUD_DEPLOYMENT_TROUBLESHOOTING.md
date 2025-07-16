# 🔧 云端部署故障排除指南
## 概述
本指南专门解决在云端平台（如Cloudflare Workers、Deno Deploy等）部署时遇到的常见问题。
## 🚨 常见错误及解决方案
### 1. npm error: Please resolve the package.json conflict and retry
**错误原因**：
- package.json格式问题
- 项目名称不一致
- package-lock.json与package.json冲突
- 依赖版本冲突
**解决方案**：
#### 方案A：使用简化的package.json
如果遇到复杂的依赖冲突，可以使用简化版本：
```json
{
  "name": "gemini-voice",
  "version": "2.0.0",
  "description": "Gemini 2.5 Playground with user system",
  "main": "src/index.js",
  "private": true,
  "scripts": {
    "deploy": "wrangler deploy",
    "dev": "wrangler dev",
    "start": "wrangler dev"
  },
  "author": "heibais1986",
  "license": "MIT",
  "devDependencies": {
    "wrangler": "^3.60.3"
  }
}
```
#### 方案B：清理并重新生成
```bash
# 删除冲突文件
rm package-lock.json
rm -rf node_modules
# 使用简化的package.json
cp package.json.minimal package.json
# 重新安装依赖
npm install
```
#### 方案C：检查项目名称一致性
确保以下文件中的项目名称一致：
- `package.json` 中的 `name` 字段
- `wrangler.toml` 中的 `name` 字段
### 2. 数据库相关错误
**错误信息**：
- "Database not found"
- "Invalid database_id"
**解决方案**：
1. **创建数据库**：
   ```bash
   wrangler d1 create gemini-voice-db
   ```
2. **更新wrangler.toml**：
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "gemini-voice-db"
   database_id = "your-actual-database-id"
   ```
3. **初始化数据库**：
   ```bash
   wrangler d1 execute gemini-voice-db --file=database/init.sql
   ```
### 3. 静态资源问题
**错误信息**：
- "Assets directory not found"
- "Static files not loading"
**解决方案**：
1. **检查assets配置**：
   ```toml
   # wrangler.toml
   assets = { directory = "./src/static" }
   ```
2. **确保目录存在**：
   ```
   src/
   └── static/
       ├── index.html
       ├── login.html
       ├── css/
       └── js/
   ```
### 4. 环境变量问题
**错误信息**：
- "Environment variable not found"
- "Secrets not accessible"
**解决方案**：
1. **检查wrangler.toml中的vars**：
   ```toml
   [vars]
   GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com"
   APP_NAME = "Gemini Voice"
   ```
2. **设置Secrets**：
   ```bash
   wrangler secret put SERVER_GEMINI_API_KEY
   wrangler secret put JWT_SECRET
   wrangler secret put ENCRYPTION_KEY
   ```
### 5. 兼容性问题
**错误信息**：
- "nodejs_compat not supported"
- "Module not found"
**解决方案**：
1. **检查compatibility_flags**：
   ```toml
   compatibility_flags = ["nodejs_compat"]
   compatibility_date = "2024-12-30"
   ```
2. **使用Web标准API**：
   - 避免使用Node.js特有的模块
   - 使用Fetch API而不是http模块
   - 使用Web Crypto API
## 🛠️ 部署平台特定问题
### Cloudflare Workers
**常见问题**：
1. **Worker size limit exceeded**
   - 解决：优化代码，移除不必要的依赖
   - 使用代码分割和懒加载
2. **CPU time limit exceeded**
   - 解决：优化算法，使用异步处理
   - 避免长时间运行的同步操作
3. **Memory limit exceeded**
   - 解决：优化内存使用，及时释放资源
   - 使用流式处理大数据
### Deno Deploy
**常见问题**：
1. **Import map not found**
   - 解决：检查deno.json配置
   - 确保所有导入路径正确
2. **Permission denied**
   - 解决：检查权限配置
   - 确保有必要的网络和文件访问权限
## 🔍 调试技巧
### 1. 本地测试
```bash
# Cloudflare Workers本地测试
wrangler dev --local
# Deno本地测试
deno run --allow-net --allow-read src/deno_index.ts
```
### 2. 查看日志
```bash
# Cloudflare Workers日志
wrangler tail
# 检查部署状态
wrangler status
```
### 3. 验证配置
```bash
# 验证wrangler.toml
wrangler validate
# 检查secrets
wrangler secret list
# 检查数据库
wrangler d1 list
```
## 📋 部署前检查清单
- [ ] package.json格式正确且无冲突
- [ ] 项目名称在所有配置文件中一致
- [ ] 数据库已创建并初始化
- [ ] 必要的Secrets已设置
- [ ] 静态资源目录存在且配置正确
- [ ] 兼容性标志设置正确
- [ ] 本地测试通过
## 🆘 紧急修复
如果部署仍然失败，可以尝试以下紧急修复：
### 最小化配置
1. **使用最简package.json**：
   ```bash
   cp package.json.minimal package.json
   ```
2. **简化wrangler.toml**：
   ```toml
   name = "gemini-voice"
   main = "src/index.js"
   compatibility_date = "2024-12-30"
   [vars]
   GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com"
   ```
3. **移除可选功能**：
   - 暂时禁用数据库功能
   - 移除复杂的静态资源配置
   - 简化路由逻辑
### 分步部署
1. **第一步**：部署基本API代理功能
2. **第二步**：添加静态资源服务
3. **第三步**：集成数据库功能
4. **第四步**：添加用户系统
## 📞 获取帮助
如果问题仍然存在：
1. **检查官方文档**：
   - [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
   - [Deno Deploy文档](https://deno.com/deploy/docs)
2. **查看错误日志**：
   - 复制完整的错误信息
   - 检查浏览器控制台
   - 查看部署平台的日志
3. **社区支持**：
   - GitHub Issues
   - Discord社区
   - Stack Overflow
通过以上步骤，应该能够解决大部分云端部署问题。记住，部署问题通常是配置问题，仔细检查每个配置项是关键。
