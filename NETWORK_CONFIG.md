
# 网络配置指南
## 问题说明
由于网络环境变化，Google Gemini API (`generativelanguage.googleapis.com`) 在中国大陆地区可能无法直接访问，需要通过代理或其他方式才能正常使用。
## 解决方案
本项目已经添加了灵活的网络配置支持，可以通过环境变量配置自定义的API端点，解决网络访问问题。
## 配置方法
### 1. Cloudflare Worker 部署
编辑 `wrangler.toml` 文件中的 `[vars]` 部分：
```toml
[vars]
# 主要的Gemini API基础URL
GEMINI_API_BASE_URL = "https://docman.edu.kg"
# 备用域名列表，用逗号分隔
GEMINI_API_FALLBACK_URLS = "https://backup1.docman.edu.kg,https://backup2.docman.edu.kg,https://generativelanguage.googleapis.com"
```
### 2. Deno 部署
设置环境变量：
```bash
# Linux/Mac
export GEMINI_API_BASE_URL="https://your-proxy-domain.com"
export GEMINI_API_FALLBACK_URLS="https://backup1.com,https://backup2.com"
# Windows
set GEMINI_API_BASE_URL=https://your-proxy-domain.com
set GEMINI_API_FALLBACK_URLS=https://backup1.com,https://backup2.com
```
或者在启动时设置：
```bash
GEMINI_API_BASE_URL="https://your-proxy-domain.com" deno run --allow-net --allow-read src/deno_index.ts
```
## 配置选项说明
### GEMINI_API_BASE_URL
- **作用**: 设置主要的Gemini API基础URL
- **默认值**: `https://generativelanguage.googleapis.com`
- **示例**: `https://your-proxy-domain.com`
### GEMINI_API_FALLBACK_URLS
- **作用**: 设置备用的API端点列表，当主URL失败时自动尝试
- **格式**: 用逗号分隔的URL列表
- **默认值**: `https://generativelanguage.googleapis.com`
- **示例**: `https://backup1.com,https://backup2.com,https://generativelanguage.googleapis.com`
## 故障转移机制
项目实现了自动故障转移机制：
1. **HTTP API请求**: 首先尝试主URL，失败后依次尝试备用URL
2. **WebSocket连接**: 同样支持多个备用URL的自动切换
3. **超时处理**: WebSocket连接设置10秒超时，避免长时间等待
4. **错误日志**: 详细记录每次连接尝试的结果，便于调试
## 使用建议
1. **保留官方域名**: 建议在备用URL列表中保留官方域名，以防代理服务不可用
2. **多个备用域名**: 配置多个可靠的代理域名，提高服务可用性
3. **定期检查**: 定期检查配置的代理域名是否正常工作
4. **监控日志**: 通过日志监控网络连接状态，及时发现问题
## 代理服务搭建
如果需要搭建自己的代理服务，可以参考以下方案：
1. **Cloudflare Worker**: 创建一个简单的代理Worker
2. **Nginx反向代理**: 在海外服务器上配置Nginx反向代理
3. **第三方代理服务**: 使用可靠的第三方Gemini API代理服务
## 故障排除
### 连接失败
- 检查网络连接
- 验证代理域名是否可访问
- 查看控制台日志了解具体错误信息
### API密钥错误
- 确认API密钥正确
- 检查API密钥是否有相应权限
### 超时问题
- 检查网络延迟
- 考虑增加超时时间（需要修改代码）
- 尝试使用更快的代理服务
## 更新日志
- 添加了可配置的API基础URL支持
- 实现了自动故障转移机制
- 支持多个备用域名配置
- 改进了错误处理和日志记录
# 网络配置指南
## 问题说明
由于网络环境变化，Google Gemini API (`generativelanguage.googleapis.com`) 在中国大陆地区可能无法直接访问，需要通过代理或其他方式才能正常使用。
## 解决方案
本项目已经添加了灵活的网络配置支持，可以通过环境变量配置自定义的API端点，解决网络访问问题。
## 配置方法
### 1. Cloudflare Worker 部署
编辑 `wrangler.toml` 文件中的 `[vars]` 部分：
```toml
[vars]
# 主要的Gemini API基础URL
GEMINI_API_BASE_URL = "https://your-proxy-domain.com"
# 备用域名列表，用逗号分隔
GEMINI_API_FALLBACK_URLS = "https://backup1.com,https://backup2.com,https://generativelanguage.googleapis.com"
```
### 2. Deno 部署
设置环境变量：
```bash
# Linux/Mac
export GEMINI_API_BASE_URL="https://your-proxy-domain.com"
export GEMINI_API_FALLBACK_URLS="https://backup1.com,https://backup2.com"
# Windows
set GEMINI_API_BASE_URL=https://your-proxy-domain.com
set GEMINI_API_FALLBACK_URLS=https://backup1.com,https://backup2.com
```
或者在启动时设置：
```bash
GEMINI_API_BASE_URL="https://your-proxy-domain.com" deno run --allow-net --allow-read src/deno_index.ts
```
## 配置选项说明
### GEMINI_API_BASE_URL
- **作用**: 设置主要的Gemini API基础URL
- **默认值**: `https://generativelanguage.googleapis.com`
- **示例**: `https://your-proxy-domain.com`
### GEMINI_API_FALLBACK_URLS
- **作用**: 设置备用的API端点列表，当主URL失败时自动尝试
- **格式**: 用逗号分隔的URL列表
- **默认值**: `https://generativelanguage.googleapis.com`
- **示例**: `https://backup1.com,https://backup2.com,https://generativelanguage.googleapis.com`
## 故障转移机制
项目实现了自动故障转移机制：
1. **HTTP API请求**: 首先尝试主URL，失败后依次尝试备用URL
2. **WebSocket连接**: 同样支持多个备用URL的自动切换
3. **超时处理**: WebSocket连接设置10秒超时，避免长时间等待
4. **错误日志**: 详细记录每次连接尝试的结果，便于调试
## 使用建议
1. **保留官方域名**: 建议在备用URL列表中保留官方域名，以防代理服务不可用
2. **多个备用域名**: 配置多个可靠的代理域名，提高服务可用性
3. **定期检查**: 定期检查配置的代理域名是否正常工作
4. **监控日志**: 通过日志监控网络连接状态，及时发现问题
## 代理服务搭建
如果需要搭建自己的代理服务，可以参考以下方案：
1. **Cloudflare Worker**: 创建一个简单的代理Worker
2. **Nginx反向代理**: 在海外服务器上配置Nginx反向代理
3. **第三方代理服务**: 使用可靠的第三方Gemini API代理服务
## 故障排除
### 连接失败
- 检查网络连接
- 验证代理域名是否可访问
- 查看控制台日志了解具体错误信息
### API密钥错误
- 确认API密钥正确
- 检查API密钥是否有相应权限
### 超时问题
- 检查网络延迟
- 考虑增加超时时间（需要修改代码）
- 尝试使用更快的代理服务
## 更新日志
- 添加了可配置的API基础URL支持
- 实现了自动故障转移机制
- 支持多个备用域名配置
- 改进了错误处理和日志记录
