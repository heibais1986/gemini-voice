
# 使用示例
## 网络连接测试
在部署或使用前，建议先测试网络连接：
### Node.js/npm 环境
```bash
# 设置API密钥
export GEMINI_API_KEY="your-gemini-api-key"
# 测试默认连接
npm run test:network
# 测试自定义URL
export GEMINI_API_BASE_URL="https://your-proxy-domain.com"
npm run test:network
```
### Deno 环境
```bash
# 设置API密钥
export GEMINI_API_KEY="your-gemini-api-key"
# 测试默认连接
deno task test:network
# 测试自定义URL
export GEMINI_API_BASE_URL="https://your-proxy-domain.com"
deno task test:network
```
## 配置示例
### 1. 使用代理服务
如果你有一个代理服务运行在 `https://gemini-proxy.example.com`：
**Cloudflare Worker (wrangler.toml):**
```toml
[vars]
GEMINI_API_BASE_URL = "https://gemini-proxy.example.com"
GEMINI_API_FALLBACK_URLS = "https://gemini-proxy.example.com,https://backup-proxy.example.com,https://generativelanguage.googleapis.com"
```
**Deno 环境变量:**
```bash
export GEMINI_API_BASE_URL="https://gemini-proxy.example.com"
export GEMINI_API_FALLBACK_URLS="https://gemini-proxy.example.com,https://backup-proxy.example.com,https://generativelanguage.googleapis.com"
```
### 2. 多个备用域名
配置多个备用域名以提高可用性：
```toml
[vars]
GEMINI_API_BASE_URL = "https://primary-proxy.com"
GEMINI_API_FALLBACK_URLS = "https://primary-proxy.com,https://backup1.com,https://backup2.com,https://generativelanguage.googleapis.com"
```
### 3. 仅使用官方域名
如果网络环境允许直连：
```toml
[vars]
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com"
GEMINI_API_FALLBACK_URLS = "https://generativelanguage.googleapis.com"
```
## API 使用示例
### 1. 聊天完成 (Chat Completions)
```bash
curl --location 'https://your-domain.com/v1/chat/completions' \
--header 'Authorization: Bearer YOUR-GEMINI-API-KEY' \
--header 'Content-Type: application/json' \
--data '{
    "messages": [
        {
            "role": "user",
            "content": "你好，请介绍一下自己"
        }
    ],
    "model": "gemini-2.5-flash"
}'
```
### 2. 流式响应
```bash
curl --location 'https://your-domain.com/v1/chat/completions' \
--header 'Authorization: Bearer YOUR-GEMINI-API-KEY' \
--header 'Content-Type: application/json' \
--data '{
    "messages": [
        {
            "role": "user",
            "content": "写一首关于春天的诗"
        }
    ],
    "model": "gemini-2.5-flash",
    "stream": true
}'
```
### 3. 获取模型列表
```bash
curl --location 'https://your-domain.com/v1/models' \
--header 'Authorization: Bearer YOUR-GEMINI-API-KEY'
```
### 4. 文本嵌入
```bash
curl --location 'https://your-domain.com/v1/embeddings' \
--header 'Authorization: Bearer YOUR-GEMINI-API-KEY' \
--header 'Content-Type: application/json' \
--data '{
    "input": ["这是一个测试文本"],
    "model": "text-embedding-004"
}'
```
## 客户端集成示例
### ChatBox 配置
1. 打开 ChatBox 设置
2. 选择 "自定义 API"
3. 设置：
   - API Host: `https://your-domain.com`
   - API Key: `your-gemini-api-key`
   - Model: `gemini-2.5-flash`
### Cursor 编程助手配置
1. 打开 Cursor 设置
2. 选择 "Models"
3. 添加自定义模型：
   - Base URL: `https://your-domain.com/v1`
   - API Key: `your-gemini-api-key`
   - Model: `gemini-2.5-flash`
## 故障排除
### 常见错误及解决方法
1. **连接超时**
   ```
   Error: Connection timeout
   ```
   - 检查网络连接
   - 尝试使用代理
   - 增加超时时间
2. **API 密钥错误**
   ```
   Error: 401 Unauthorized
   ```
   - 验证 API 密钥是否正确
   - 检查 API 密钥权限
3. **域名解析失败**
   ```
   Error: DNS resolution failed
   ```
   - 检查域名是否正确
   - 尝试使用备用域名
4. **所有端点失败**
   ```
   Error: All API endpoints failed
   ```
   - 检查网络连接
   - 验证所有配置的域名
   - 考虑使用不同的代理服务
### 调试技巧
1. **查看日志**: 检查控制台输出了解连接尝试过程
2. **网络测试**: 使用 `test:network` 命令测试连接
3. **逐步测试**: 先测试单个域名，再测试故障转移
4. **监控延迟**: 注意网络延迟对用户体验的影响
# 使用示例
## 网络连接测试
在部署或使用前，建议先测试网络连接：
### Node.js/npm 环境
```bash
# 设置API密钥
export GEMINI_API_KEY="your-gemini-api-key"
# 测试默认连接
npm run test:network
# 测试自定义URL
export GEMINI_API_BASE_URL="https://your-proxy-domain.com"
npm run test:network
```
### Deno 环境
```bash
# 设置API密钥
export GEMINI_API_KEY="your-gemini-api-key"
# 测试默认连接
deno task test:network
# 测试自定义URL
export GEMINI_API_BASE_URL="https://your-proxy-domain.com"
deno task test:network
```
## 配置示例
### 1. 使用代理服务
如果你有一个代理服务运行在 `https://gemini-proxy.example.com`：
**Cloudflare Worker (wrangler.toml):**
```toml
[vars]
GEMINI_API_BASE_URL = "https://gemini-proxy.example.com"
GEMINI_API_FALLBACK_URLS = "https://gemini-proxy.example.com,https://backup-proxy.example.com,https://generativelanguage.googleapis.com"
```
**Deno 环境变量:**
```bash
export GEMINI_API_BASE_URL="https://gemini-proxy.example.com"
export GEMINI_API_FALLBACK_URLS="https://gemini-proxy.example.com,https://backup-proxy.example.com,https://generativelanguage.googleapis.com"
```
### 2. 多个备用域名
配置多个备用域名以提高可用性：
```toml
[vars]
GEMINI_API_BASE_URL = "https://primary-proxy.com"
GEMINI_API_FALLBACK_URLS = "https://primary-proxy.com,https://backup1.com,https://backup2.com,https://generativelanguage.googleapis.com"
```
### 3. 仅使用官方域名
如果网络环境允许直连：
```toml
[vars]
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com"
GEMINI_API_FALLBACK_URLS = "https://generativelanguage.googleapis.com"
```
## API 使用示例
### 1. 聊天完成 (Chat Completions)
```bash
curl --location 'https://your-domain.com/v1/chat/completions' \
--header 'Authorization: Bearer YOUR-GEMINI-API-KEY' \
--header 'Content-Type: application/json' \
--data '{
    "messages": [
        {
            "role": "user",
            "content": "你好，请介绍一下自己"
        }
    ],
    "model": "gemini-2.5-flash"
}'
```
### 2. 流式响应
```bash
curl --location 'https://your-domain.com/v1/chat/completions' \
--header 'Authorization: Bearer YOUR-GEMINI-API-KEY' \
--header 'Content-Type: application/json' \
--data '{
    "messages": [
        {
            "role": "user",
            "content": "写一首关于春天的诗"
        }
    ],
    "model": "gemini-2.5-flash",
    "stream": true
}'
```
### 3. 获取模型列表
```bash
curl --location 'https://your-domain.com/v1/models' \
--header 'Authorization: Bearer YOUR-GEMINI-API-KEY'
```
### 4. 文本嵌入
```bash
curl --location 'https://your-domain.com/v1/embeddings' \
--header 'Authorization: Bearer YOUR-GEMINI-API-KEY' \
--header 'Content-Type: application/json' \
--data '{
    "input": ["这是一个测试文本"],
    "model": "text-embedding-004"
}'
```
## 客户端集成示例
### ChatBox 配置
1. 打开 ChatBox 设置
2. 选择 "自定义 API"
3. 设置：
   - API Host: `https://your-domain.com`
   - API Key: `your-gemini-api-key`
   - Model: `gemini-2.5-flash`
### Cursor 编程助手配置
1. 打开 Cursor 设置
2. 选择 "Models"
3. 添加自定义模型：
   - Base URL: `https://your-domain.com/v1`
   - API Key: `your-gemini-api-key`
   - Model: `gemini-2.5-flash`
## 故障排除
### 常见错误及解决方法
1. **连接超时**
   ```
   Error: Connection timeout
   ```
   - 检查网络连接
   - 尝试使用代理
   - 增加超时时间
2. **API 密钥错误**
   ```
   Error: 401 Unauthorized
   ```
   - 验证 API 密钥是否正确
   - 检查 API 密钥权限
3. **域名解析失败**
   ```
   Error: DNS resolution failed
   ```
   - 检查域名是否正确
   - 尝试使用备用域名
4. **所有端点失败**
   ```
   Error: All API endpoints failed
   ```
   - 检查网络连接
   - 验证所有配置的域名
   - 考虑使用不同的代理服务
### 调试技巧
1. **查看日志**: 检查控制台输出了解连接尝试过程
2. **网络测试**: 使用 `test:network` 命令测试连接
3. **逐步测试**: 先测试单个域名，再测试故障转移
4. **监控延迟**: 注意网络延迟对用户体验的影响
