
# 更新日志
## [2025-01-16] 网络访问优化更新
### 🚀 新功能
- **可配置API端点**: 支持通过环境变量自定义Gemini API基础URL
- **自动故障转移**: 主URL失败时自动尝试备用URL列表
- **网络连接测试**: 添加了网络连接测试工具
- **详细日志记录**: 改进了连接过程的日志输出
### 🔧 技术改进
#### Cloudflare Worker 支持
- 在 `wrangler.toml` 中添加了 `GEMINI_API_BASE_URL` 和 `GEMINI_API_FALLBACK_URLS` 配置
- 修改了 `src/api_proxy/worker.mjs` 以支持可配置的基础URL
- 实现了带重试机制的 `fetchWithFallback` 函数
- 更新了 WebSocket 处理逻辑以支持故障转移
#### Deno 支持
- 修改了 `src/deno_index.ts` 以支持环境变量配置
- 实现了与 Cloudflare Worker 相同的故障转移机制
- 添加了环境变量读取和处理逻辑
#### 核心功能
- **HTTP API代理**: 支持 `/chat/completions`, `/embeddings`, `/models` 端点的故障转移
- **WebSocket代理**: 支持实时通信的故障转移机制
- **超时处理**: WebSocket连接设置10秒超时
- **错误处理**: 改进了错误信息和状态码处理
### 📝 新增文件
- `NETWORK_CONFIG.md`: 详细的网络配置指南
- `USAGE_EXAMPLES.md`: 使用示例和故障排除指南
- `test/network-test.js`: 网络连接测试脚本
- `CHANGELOG.md`: 更新日志
### 🔄 修改的文件
- `wrangler.toml`: 添加了网络配置变量
- `src/index.js`: 更新了WebSocket和API处理逻辑
- `src/api_proxy/worker.mjs`: 添加了故障转移机制
- `src/deno_index.ts`: 添加了环境变量支持
- `package.json`: 添加了网络测试脚本
- `deno.json`: 添加了网络测试任务
- `README.MD`: 更新了部署说明和网络配置信息
### 🌐 环境变量
#### GEMINI_API_BASE_URL
- **作用**: 设置主要的Gemini API基础URL
- **默认值**: `https://generativelanguage.googleapis.com`
- **示例**: `https://your-proxy-domain.com`
#### GEMINI_API_FALLBACK_URLS
- **作用**: 设置备用API端点列表，用逗号分隔
- **默认值**: `https://generativelanguage.googleapis.com`
- **示例**: `https://backup1.com,https://backup2.com,https://generativelanguage.googleapis.com`
### 📋 使用方法
#### Cloudflare Worker
```toml
[vars]
GEMINI_API_BASE_URL = "https://your-proxy-domain.com"
GEMINI_API_FALLBACK_URLS = "https://backup1.com,https://backup2.com"
```
#### Deno
```bash
export GEMINI_API_BASE_URL="https://your-proxy-domain.com"
export GEMINI_API_FALLBACK_URLS="https://backup1.com,https://backup2.com"
```
#### 网络测试
```bash
# Node.js
npm run test:network
# Deno
deno task test:network
```
### 🐛 问题修复
- 解决了中国大陆地区无法直接访问 `generativelanguage.googleapis.com` 的问题
- 改进了网络连接的稳定性和可靠性
- 优化了错误处理和用户反馈
### 💡 使用建议
1. **保留官方域名**: 在备用URL列表中保留官方域名作为最后选项
2. **多个备用域名**: 配置多个可靠的代理域名提高可用性
3. **定期测试**: 使用网络测试工具定期检查连接状态
4. **监控日志**: 通过日志监控网络连接状态
### 🔮 未来计划
- 添加更多的网络优化选项
- 支持自定义超时时间配置
- 添加连接质量监控
- 实现智能路由选择
# 更新日志
## [2025-01-16] 网络访问优化更新
### 🚀 新功能
- **可配置API端点**: 支持通过环境变量自定义Gemini API基础URL
- **自动故障转移**: 主URL失败时自动尝试备用URL列表
- **网络连接测试**: 添加了网络连接测试工具
- **详细日志记录**: 改进了连接过程的日志输出
### 🔧 技术改进
#### Cloudflare Worker 支持
- 在 `wrangler.toml` 中添加了 `GEMINI_API_BASE_URL` 和 `GEMINI_API_FALLBACK_URLS` 配置
- 修改了 `src/api_proxy/worker.mjs` 以支持可配置的基础URL
- 实现了带重试机制的 `fetchWithFallback` 函数
- 更新了 WebSocket 处理逻辑以支持故障转移
#### Deno 支持
- 修改了 `src/deno_index.ts` 以支持环境变量配置
- 实现了与 Cloudflare Worker 相同的故障转移机制
- 添加了环境变量读取和处理逻辑
#### 核心功能
- **HTTP API代理**: 支持 `/chat/completions`, `/embeddings`, `/models` 端点的故障转移
- **WebSocket代理**: 支持实时通信的故障转移机制
- **超时处理**: WebSocket连接设置10秒超时
- **错误处理**: 改进了错误信息和状态码处理
### 📝 新增文件
- `NETWORK_CONFIG.md`: 详细的网络配置指南
- `USAGE_EXAMPLES.md`: 使用示例和故障排除指南
- `test/network-test.js`: 网络连接测试脚本
- `CHANGELOG.md`: 更新日志
### 🔄 修改的文件
- `wrangler.toml`: 添加了网络配置变量
- `src/index.js`: 更新了WebSocket和API处理逻辑
- `src/api_proxy/worker.mjs`: 添加了故障转移机制
- `src/deno_index.ts`: 添加了环境变量支持
- `package.json`: 添加了网络测试脚本
- `deno.json`: 添加了网络测试任务
- `README.MD`: 更新了部署说明和网络配置信息
### 🌐 环境变量
#### GEMINI_API_BASE_URL
- **作用**: 设置主要的Gemini API基础URL
- **默认值**: `https://generativelanguage.googleapis.com`
- **示例**: `https://your-proxy-domain.com`
#### GEMINI_API_FALLBACK_URLS
- **作用**: 设置备用API端点列表，用逗号分隔
- **默认值**: `https://generativelanguage.googleapis.com`
- **示例**: `https://backup1.com,https://backup2.com,https://generativelanguage.googleapis.com`
### 📋 使用方法
#### Cloudflare Worker
```toml
[vars]
GEMINI_API_BASE_URL = "https://your-proxy-domain.com"
GEMINI_API_FALLBACK_URLS = "https://backup1.com,https://backup2.com"
```
#### Deno
```bash
export GEMINI_API_BASE_URL="https://your-proxy-domain.com"
export GEMINI_API_FALLBACK_URLS="https://backup1.com,https://backup2.com"
```
#### 网络测试
```bash
# Node.js
npm run test:network
# Deno
deno task test:network
```
### 🐛 问题修复
- 解决了中国大陆地区无法直接访问 `generativelanguage.googleapis.com` 的问题
- 改进了网络连接的稳定性和可靠性
- 优化了错误处理和用户反馈
### 💡 使用建议
1. **保留官方域名**: 在备用URL列表中保留官方域名作为最后选项
2. **多个备用域名**: 配置多个可靠的代理域名提高可用性
3. **定期测试**: 使用网络测试工具定期检查连接状态
4. **监控日志**: 通过日志监控网络连接状态
### 🔮 未来计划
- 添加更多的网络优化选项
- 支持自定义超时时间配置
- 添加连接质量监控
- 实现智能路由选择
