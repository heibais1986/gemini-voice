
# 路由和认证系统指南
## 🔄 路由逻辑概述
本项目实现了基于用户认证状态的智能路由系统，确保用户在访问网站时有良好的体验流程。
## 📋 路由规则
### 1. 根路径 (`/` 或 `/index.html`)
- **已登录用户**: 直接访问主应用页面
- **未登录用户**: 自动重定向到 `/login.html`
### 2. 登录页面 (`/login.html`)
- **已登录用户**: 自动重定向到主页 `/`
- **未登录用户**: 显示登录页面
### 3. 登出处理 (`/logout`)
- 清除服务器端会话
- 清除客户端Cookie
- 重定向到登录页面
### 4. 静态资源
- CSS、JS、图片等静态文件正常提供服务
- 不需要认证检查
### 5. API端点 (`/api/*`)
- 所有API请求都需要认证
- 未认证请求返回401错误
## 🔐 认证机制
### Cookie-based 认证
系统使用HTTP Cookie存储会话令牌，提供更好的用户体验：
```javascript
// Cookie设置
sessionToken=<token>; Path=/; Expires=<date>; HttpOnly; Secure; SameSite=Strict
```
### 双重存储策略
- **Cookie**: 用于服务器端路由判断
- **localStorage**: 用于客户端JavaScript访问
### 会话验证流程
1. 从Cookie或localStorage获取会话令牌
2. 调用 `/api/user/profile` 验证会话
3. 根据验证结果决定页面跳转
## 🚀 用户体验流程
### 首次访问
```
用户访问 / 
    ↓
检查Cookie中的sessionToken
    ↓
无令牌 → 重定向到 /login.html
    ↓
用户登录成功
    ↓
设置Cookie → 重定向到 /
    ↓
显示主应用页面
```
### 已登录用户
```
用户访问 /
    ↓
检查Cookie中的sessionToken
    ↓
验证会话有效性
    ↓
有效 → 显示主应用页面
无效 → 清除Cookie → 重定向到 /login.html
```
### 登出流程
```
用户点击登出
    ↓
调用 /api/auth/logout
    ↓
清除服务器端会话
    ↓
清除客户端Cookie
    ↓
重定向到 /login.html
```
## 🛠️ 技术实现
### 服务器端路由处理
```javascript
async function handlePageRouting(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  // 检查用户登录状态
  const authResult = await checkUserAuthFromCookie(request, env);
  switch (pathname) {
    case '/':
    case '/index.html':
      if (authResult.isAuthenticated) {
        return await serveStaticFile('index.html');
      } else {
        return Response.redirect('/login.html', 302);
      }
    case '/login.html':
      if (authResult.isAuthenticated) {
        return Response.redirect('/', 302);
      } else {
        return await serveStaticFile('login.html');
      }
    // ... 其他路由
  }
}
```
### 客户端认证检查
```javascript
class UserAuthManager {
  constructor() {
    this.sessionToken = this.getSessionTokenFromCookie() || 
                       localStorage.getItem('sessionToken');
  }
  async checkAuth() {
    if (!this.sessionToken) {
      this.redirectToLogin();
      return false;
    }
    // 验证会话...
  }
  redirectToLogin() {
    window.location.href = '/login.html';
  }
}
```
## 🔧 配置说明
### Cookie 配置
- **HttpOnly**: 防止XSS攻击
- **Secure**: 仅在HTTPS下传输
- **SameSite=Strict**: 防止CSRF攻击
- **Path=/**: 全站有效
- **过期时间**: 30天
### 会话管理
- 会话令牌：64位随机字符串
- 过期时间：30天
- 自动清理：定期清理过期会话
## 📱 前端集成
### 登录成功处理
```javascript
if (data.success) {
  this.sessionToken = data.sessionToken;
  localStorage.setItem('sessionToken', this.sessionToken);
  this.showMessage('登录成功，正在跳转...', 'success');
  setTimeout(() => {
    window.location.href = '/';
  }, 1000);
}
```
### API请求认证
```javascript
const response = await fetch('/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.sessionToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
});
```
## 🔍 调试和监控
### 日志记录
系统记录以下信息：
- 用户登录/登出事件
- 会话验证结果
- 路由跳转记录
- API访问日志
### 常见问题排查
1. **无限重定向循环**
   - 检查Cookie设置是否正确
   - 验证会话验证逻辑
2. **登录后仍然跳转到登录页**
   - 检查Cookie是否正确设置
   - 验证会话令牌格式
3. **API请求被拒绝**
   - 检查Authorization头是否正确
   - 验证会话令牌有效性
## 🚀 部署注意事项
### 环境变量
确保设置以下环境变量：
- `JWT_SECRET`: JWT签名密钥
- `ENCRYPTION_KEY`: 数据加密密钥
- `SERVER_GEMINI_API_KEY`: 服务器API密钥
### HTTPS要求
由于使用了Secure Cookie，必须在HTTPS环境下部署。
### 域名配置
确保Cookie的域名设置正确，特别是在使用自定义域名时。
## 🔄 升级指南
### 从旧版本升级
1. 清除所有现有会话
2. 更新数据库结构
3. 重新部署应用
4. 通知用户重新登录
### 兼容性处理
系统同时支持Cookie和localStorage，确保向后兼容。
## 📊 性能优化
### 缓存策略
- 静态文件：1小时缓存
- API响应：不缓存
- 用户信息：客户端缓存
### 网络优化
- 减少重定向次数
- 合并静态资源请求
- 使用CDN加速
这个路由系统确保了用户有流畅的登录体验，同时保证了应用的安全性。
# 路由和认证系统指南
## 🔄 路由逻辑概述
本项目实现了基于用户认证状态的智能路由系统，确保用户在访问网站时有良好的体验流程。
## 📋 路由规则
### 1. 根路径 (`/` 或 `/index.html`)
- **已登录用户**: 直接访问主应用页面
- **未登录用户**: 自动重定向到 `/login.html`
### 2. 登录页面 (`/login.html`)
- **已登录用户**: 自动重定向到主页 `/`
- **未登录用户**: 显示登录页面
### 3. 登出处理 (`/logout`)
- 清除服务器端会话
- 清除客户端Cookie
- 重定向到登录页面
### 4. 静态资源
- CSS、JS、图片等静态文件正常提供服务
- 不需要认证检查
### 5. API端点 (`/api/*`)
- 所有API请求都需要认证
- 未认证请求返回401错误
## 🔐 认证机制
### Cookie-based 认证
系统使用HTTP Cookie存储会话令牌，提供更好的用户体验：
```javascript
// Cookie设置
sessionToken=<token>; Path=/; Expires=<date>; HttpOnly; Secure; SameSite=Strict
```
### 双重存储策略
- **Cookie**: 用于服务器端路由判断
- **localStorage**: 用于客户端JavaScript访问
### 会话验证流程
1. 从Cookie或localStorage获取会话令牌
2. 调用 `/api/user/profile` 验证会话
3. 根据验证结果决定页面跳转
## 🚀 用户体验流程
### 首次访问
```
用户访问 / 
    ↓
检查Cookie中的sessionToken
    ↓
无令牌 → 重定向到 /login.html
    ↓
用户登录成功
    ↓
设置Cookie → 重定向到 /
    ↓
显示主应用页面
```
### 已登录用户
```
用户访问 /
    ↓
检查Cookie中的sessionToken
    ↓
验证会话有效性
    ↓
有效 → 显示主应用页面
无效 → 清除Cookie → 重定向到 /login.html
```
### 登出流程
```
用户点击登出
    ↓
调用 /api/auth/logout
    ↓
清除服务器端会话
    ↓
清除客户端Cookie
    ↓
重定向到 /login.html
```
## 🛠️ 技术实现
### 服务器端路由处理
```javascript
async function handlePageRouting(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  // 检查用户登录状态
  const authResult = await checkUserAuthFromCookie(request, env);
  switch (pathname) {
    case '/':
    case '/index.html':
      if (authResult.isAuthenticated) {
        return await serveStaticFile('index.html');
      } else {
        return Response.redirect('/login.html', 302);
      }
    case '/login.html':
      if (authResult.isAuthenticated) {
        return Response.redirect('/', 302);
      } else {
        return await serveStaticFile('login.html');
      }
    // ... 其他路由
  }
}
```
### 客户端认证检查
```javascript
class UserAuthManager {
  constructor() {
    this.sessionToken = this.getSessionTokenFromCookie() || 
                       localStorage.getItem('sessionToken');
  }
  async checkAuth() {
    if (!this.sessionToken) {
      this.redirectToLogin();
      return false;
    }
    // 验证会话...
  }
  redirectToLogin() {
    window.location.href = '/login.html';
  }
}
```
## 🔧 配置说明
### Cookie 配置
- **HttpOnly**: 防止XSS攻击
- **Secure**: 仅在HTTPS下传输
- **SameSite=Strict**: 防止CSRF攻击
- **Path=/**: 全站有效
- **过期时间**: 30天
### 会话管理
- 会话令牌：64位随机字符串
- 过期时间：30天
- 自动清理：定期清理过期会话
## 📱 前端集成
### 登录成功处理
```javascript
if (data.success) {
  this.sessionToken = data.sessionToken;
  localStorage.setItem('sessionToken', this.sessionToken);
  this.showMessage('登录成功，正在跳转...', 'success');
  setTimeout(() => {
    window.location.href = '/';
  }, 1000);
}
```
### API请求认证
```javascript
const response = await fetch('/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.sessionToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
});
```
## 🔍 调试和监控
### 日志记录
系统记录以下信息：
- 用户登录/登出事件
- 会话验证结果
- 路由跳转记录
- API访问日志
### 常见问题排查
1. **无限重定向循环**
   - 检查Cookie设置是否正确
   - 验证会话验证逻辑
2. **登录后仍然跳转到登录页**
   - 检查Cookie是否正确设置
   - 验证会话令牌格式
3. **API请求被拒绝**
   - 检查Authorization头是否正确
   - 验证会话令牌有效性
## 🚀 部署注意事项
### 环境变量
确保设置以下环境变量：
- `JWT_SECRET`: JWT签名密钥
- `ENCRYPTION_KEY`: 数据加密密钥
- `SERVER_GEMINI_API_KEY`: 服务器API密钥
### HTTPS要求
由于使用了Secure Cookie，必须在HTTPS环境下部署。
### 域名配置
确保Cookie的域名设置正确，特别是在使用自定义域名时。
## 🔄 升级指南
### 从旧版本升级
1. 清除所有现有会话
2. 更新数据库结构
3. 重新部署应用
4. 通知用户重新登录
### 兼容性处理
系统同时支持Cookie和localStorage，确保向后兼容。
## 📊 性能优化
### 缓存策略
- 静态文件：1小时缓存
- API响应：不缓存
- 用户信息：客户端缓存
### 网络优化
- 减少重定向次数
- 合并静态资源请求
- 使用CDN加速
这个路由系统确保了用户有流畅的登录体验，同时保证了应用的安全性。
# 路由和认证系统指南
## 🔄 路由逻辑概述
本项目实现了基于用户认证状态的智能路由系统，确保用户在访问网站时有良好的体验流程。
## 📋 路由规则
### 1. 根路径 (`/` 或 `/index.html`)
- **已登录用户**: 直接访问主应用页面
- **未登录用户**: 自动重定向到 `/login.html`
### 2. 登录页面 (`/login.html`)
- **已登录用户**: 自动重定向到主页 `/`
- **未登录用户**: 显示登录页面
### 3. 登出处理 (`/logout`)
- 清除服务器端会话
- 清除客户端Cookie
- 重定向到登录页面
### 4. 静态资源
- CSS、JS、图片等静态文件正常提供服务
- 不需要认证检查
### 5. API端点 (`/api/*`)
- 所有API请求都需要认证
- 未认证请求返回401错误
## 🔐 认证机制
### Cookie-based 认证
系统使用HTTP Cookie存储会话令牌，提供更好的用户体验：
```javascript
// Cookie设置
sessionToken=<token>; Path=/; Expires=<date>; HttpOnly; Secure; SameSite=Strict
```
### 双重存储策略
- **Cookie**: 用于服务器端路由判断
- **localStorage**: 用于客户端JavaScript访问
### 会话验证流程
1. 从Cookie或localStorage获取会话令牌
2. 调用 `/api/user/profile` 验证会话
3. 根据验证结果决定页面跳转
## 🚀 用户体验流程
### 首次访问
```
用户访问 / 
    ↓
检查Cookie中的sessionToken
    ↓
无令牌 → 重定向到 /login.html
    ↓
用户登录成功
    ↓
设置Cookie → 重定向到 /
    ↓
显示主应用页面
```
### 已登录用户
```
用户访问 /
    ↓
检查Cookie中的sessionToken
    ↓
验证会话有效性
    ↓
有效 → 显示主应用页面
无效 → 清除Cookie → 重定向到 /login.html
```
### 登出流程
```
用户点击登出
    ↓
调用 /api/auth/logout
    ↓
清除服务器端会话
    ↓
清除客户端Cookie
    ↓
重定向到 /login.html
```
## 🛠️ 技术实现
### 服务器端路由处理
```javascript
async function handlePageRouting(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  // 检查用户登录状态
  const authResult = await checkUserAuthFromCookie(request, env);
  switch (pathname) {
    case '/':
    case '/index.html':
      if (authResult.isAuthenticated) {
        return await serveStaticFile('index.html');
      } else {
        return Response.redirect('/login.html', 302);
      }
    case '/login.html':
      if (authResult.isAuthenticated) {
        return Response.redirect('/', 302);
      } else {
        return await serveStaticFile('login.html');
      }
    // ... 其他路由
  }
}
```
### 客户端认证检查
```javascript
class UserAuthManager {
  constructor() {
    this.sessionToken = this.getSessionTokenFromCookie() || 
                       localStorage.getItem('sessionToken');
  }
  async checkAuth() {
    if (!this.sessionToken) {
      this.redirectToLogin();
      return false;
    }
    // 验证会话...
  }
  redirectToLogin() {
    window.location.href = '/login.html';
  }
}
```
## 🔧 配置说明
### Cookie 配置
- **HttpOnly**: 防止XSS攻击
- **Secure**: 仅在HTTPS下传输
- **SameSite=Strict**: 防止CSRF攻击
- **Path=/**: 全站有效
- **过期时间**: 30天
### 会话管理
- 会话令牌：64位随机字符串
- 过期时间：30天
- 自动清理：定期清理过期会话
## 📱 前端集成
### 登录成功处理
```javascript
if (data.success) {
  this.sessionToken = data.sessionToken;
  localStorage.setItem('sessionToken', this.sessionToken);
  this.showMessage('登录成功，正在跳转...', 'success');
  setTimeout(() => {
    window.location.href = '/';
  }, 1000);
}
```
### API请求认证
```javascript
const response = await fetch('/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.sessionToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
});
```
## 🔍 调试和监控
### 日志记录
系统记录以下信息：
- 用户登录/登出事件
- 会话验证结果
- 路由跳转记录
- API访问日志
### 常见问题排查
1. **无限重定向循环**
   - 检查Cookie设置是否正确
   - 验证会话验证逻辑
2. **登录后仍然跳转到登录页**
   - 检查Cookie是否正确设置
   - 验证会话令牌格式
3. **API请求被拒绝**
   - 检查Authorization头是否正确
   - 验证会话令牌有效性
## 🚀 部署注意事项
### 环境变量
确保设置以下环境变量：
- `JWT_SECRET`: JWT签名密钥
- `ENCRYPTION_KEY`: 数据加密密钥
- `SERVER_GEMINI_API_KEY`: 服务器API密钥
### HTTPS要求
由于使用了Secure Cookie，必须在HTTPS环境下部署。
### 域名配置
确保Cookie的域名设置正确，特别是在使用自定义域名时。
## 🔄 升级指南
### 从旧版本升级
1. 清除所有现有会话
2. 更新数据库结构
3. 重新部署应用
4. 通知用户重新登录
### 兼容性处理
系统同时支持Cookie和localStorage，确保向后兼容。
## 📊 性能优化
### 缓存策略
- 静态文件：1小时缓存
- API响应：不缓存
- 用户信息：客户端缓存
### 网络优化
- 减少重定向次数
- 合并静态资源请求
- 使用CDN加速
这个路由系统确保了用户有流畅的登录体验，同时保证了应用的安全性。
# 路由和认证系统指南
## 🔄 路由逻辑概述
本项目实现了基于用户认证状态的智能路由系统，确保用户在访问网站时有良好的体验流程。
## 📋 路由规则
### 1. 根路径 (`/` 或 `/index.html`)
- **已登录用户**: 直接访问主应用页面
- **未登录用户**: 自动重定向到 `/login.html`
### 2. 登录页面 (`/login.html`)
- **已登录用户**: 自动重定向到主页 `/`
- **未登录用户**: 显示登录页面
### 3. 登出处理 (`/logout`)
- 清除服务器端会话
- 清除客户端Cookie
- 重定向到登录页面
### 4. 静态资源
- CSS、JS、图片等静态文件正常提供服务
- 不需要认证检查
### 5. API端点 (`/api/*`)
- 所有API请求都需要认证
- 未认证请求返回401错误
## 🔐 认证机制
### Cookie-based 认证
系统使用HTTP Cookie存储会话令牌，提供更好的用户体验：
```javascript
// Cookie设置
sessionToken=<token>; Path=/; Expires=<date>; HttpOnly; Secure; SameSite=Strict
```
### 双重存储策略
- **Cookie**: 用于服务器端路由判断
- **localStorage**: 用于客户端JavaScript访问
### 会话验证流程
1. 从Cookie或localStorage获取会话令牌
2. 调用 `/api/user/profile` 验证会话
3. 根据验证结果决定页面跳转
## 🚀 用户体验流程
### 首次访问
```
用户访问 / 
    ↓
检查Cookie中的sessionToken
    ↓
无令牌 → 重定向到 /login.html
    ↓
用户登录成功
    ↓
设置Cookie → 重定向到 /
    ↓
显示主应用页面
```
### 已登录用户
```
用户访问 /
    ↓
检查Cookie中的sessionToken
    ↓
验证会话有效性
    ↓
有效 → 显示主应用页面
无效 → 清除Cookie → 重定向到 /login.html
```
### 登出流程
```
用户点击登出
    ↓
调用 /api/auth/logout
    ↓
清除服务器端会话
    ↓
清除客户端Cookie
    ↓
重定向到 /login.html
```
## 🛠️ 技术实现
### 服务器端路由处理
```javascript
async function handlePageRouting(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  // 检查用户登录状态
  const authResult = await checkUserAuthFromCookie(request, env);
  switch (pathname) {
    case '/':
    case '/index.html':
      if (authResult.isAuthenticated) {
        return await serveStaticFile('index.html');
      } else {
        return Response.redirect('/login.html', 302);
      }
    case '/login.html':
      if (authResult.isAuthenticated) {
        return Response.redirect('/', 302);
      } else {
        return await serveStaticFile('login.html');
      }
    // ... 其他路由
  }
}
```
### 客户端认证检查
```javascript
class UserAuthManager {
  constructor() {
    this.sessionToken = this.getSessionTokenFromCookie() || 
                       localStorage.getItem('sessionToken');
  }
  async checkAuth() {
    if (!this.sessionToken) {
      this.redirectToLogin();
      return false;
    }
    // 验证会话...
  }
  redirectToLogin() {
    window.location.href = '/login.html';
  }
}
```
## 🔧 配置说明
### Cookie 配置
- **HttpOnly**: 防止XSS攻击
- **Secure**: 仅在HTTPS下传输
- **SameSite=Strict**: 防止CSRF攻击
- **Path=/**: 全站有效
- **过期时间**: 30天
### 会话管理
- 会话令牌：64位随机字符串
- 过期时间：30天
- 自动清理：定期清理过期会话
## 📱 前端集成
### 登录成功处理
```javascript
if (data.success) {
  this.sessionToken = data.sessionToken;
  localStorage.setItem('sessionToken', this.sessionToken);
  this.showMessage('登录成功，正在跳转...', 'success');
  setTimeout(() => {
    window.location.href = '/';
  }, 1000);
}
```
### API请求认证
```javascript
const response = await fetch('/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.sessionToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
});
```
## 🔍 调试和监控
### 日志记录
系统记录以下信息：
- 用户登录/登出事件
- 会话验证结果
- 路由跳转记录
- API访问日志
### 常见问题排查
1. **无限重定向循环**
   - 检查Cookie设置是否正确
   - 验证会话验证逻辑
2. **登录后仍然跳转到登录页**
   - 检查Cookie是否正确设置
   - 验证会话令牌格式
3. **API请求被拒绝**
   - 检查Authorization头是否正确
   - 验证会话令牌有效性
## 🚀 部署注意事项
### 环境变量
确保设置以下环境变量：
- `JWT_SECRET`: JWT签名密钥
- `ENCRYPTION_KEY`: 数据加密密钥
- `SERVER_GEMINI_API_KEY`: 服务器API密钥
### HTTPS要求
由于使用了Secure Cookie，必须在HTTPS环境下部署。
### 域名配置
确保Cookie的域名设置正确，特别是在使用自定义域名时。
## 🔄 升级指南
### 从旧版本升级
1. 清除所有现有会话
2. 更新数据库结构
3. 重新部署应用
4. 通知用户重新登录
### 兼容性处理
系统同时支持Cookie和localStorage，确保向后兼容。
## 📊 性能优化
### 缓存策略
- 静态文件：1小时缓存
- API响应：不缓存
- 用户信息：客户端缓存
### 网络优化
- 减少重定向次数
- 合并静态资源请求
- 使用CDN加速
这个路由系统确保了用户有流畅的登录体验，同时保证了应用的安全性。
# 路由和认证系统指南
## 🔄 路由逻辑概述
本项目实现了基于用户认证状态的智能路由系统，确保用户在访问网站时有良好的体验流程。
## 📋 路由规则
### 1. 根路径 (`/` 或 `/index.html`)
- **已登录用户**: 直接访问主应用页面
- **未登录用户**: 自动重定向到 `/login.html`
### 2. 登录页面 (`/login.html`)
- **已登录用户**: 自动重定向到主页 `/`
- **未登录用户**: 显示登录页面
### 3. 登出处理 (`/logout`)
- 清除服务器端会话
- 清除客户端Cookie
- 重定向到登录页面
### 4. 静态资源
- CSS、JS、图片等静态文件正常提供服务
- 不需要认证检查
### 5. API端点 (`/api/*`)
- 所有API请求都需要认证
- 未认证请求返回401错误
## 🔐 认证机制
### Cookie-based 认证
系统使用HTTP Cookie存储会话令牌，提供更好的用户体验：
```javascript
// Cookie设置
sessionToken=<token>; Path=/; Expires=<date>; HttpOnly; Secure; SameSite=Strict
```
### 双重存储策略
- **Cookie**: 用于服务器端路由判断
- **localStorage**: 用于客户端JavaScript访问
### 会话验证流程
1. 从Cookie或localStorage获取会话令牌
2. 调用 `/api/user/profile` 验证会话
3. 根据验证结果决定页面跳转
## 🚀 用户体验流程
### 首次访问
```
用户访问 / 
    ↓
检查Cookie中的sessionToken
    ↓
无令牌 → 重定向到 /login.html
    ↓
用户登录成功
    ↓
设置Cookie → 重定向到 /
    ↓
显示主应用页面
```
### 已登录用户
```
用户访问 /
    ↓
检查Cookie中的sessionToken
    ↓
验证会话有效性
    ↓
有效 → 显示主应用页面
无效 → 清除Cookie → 重定向到 /login.html
```
### 登出流程
```
用户点击登出
    ↓
调用 /api/auth/logout
    ↓
清除服务器端会话
    ↓
清除客户端Cookie
    ↓
重定向到 /login.html
```
## 🛠️ 技术实现
### 服务器端路由处理
```javascript
async function handlePageRouting(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  // 检查用户登录状态
  const authResult = await checkUserAuthFromCookie(request, env);
  switch (pathname) {
    case '/':
    case '/index.html':
      if (authResult.isAuthenticated) {
        return await serveStaticFile('index.html');
      } else {
        return Response.redirect('/login.html', 302);
      }
    case '/login.html':
      if (authResult.isAuthenticated) {
        return Response.redirect('/', 302);
      } else {
        return await serveStaticFile('login.html');
      }
    // ... 其他路由
  }
}
```
### 客户端认证检查
```javascript
class UserAuthManager {
  constructor() {
    this.sessionToken = this.getSessionTokenFromCookie() || 
                       localStorage.getItem('sessionToken');
  }
  async checkAuth() {
    if (!this.sessionToken) {
      this.redirectToLogin();
      return false;
    }
    // 验证会话...
  }
  redirectToLogin() {
    window.location.href = '/login.html';
  }
}
```
## 🔧 配置说明
### Cookie 配置
- **HttpOnly**: 防止XSS攻击
- **Secure**: 仅在HTTPS下传输
- **SameSite=Strict**: 防止CSRF攻击
- **Path=/**: 全站有效
- **过期时间**: 30天
### 会话管理
- 会话令牌：64位随机字符串
- 过期时间：30天
- 自动清理：定期清理过期会话
## 📱 前端集成
### 登录成功处理
```javascript
if (data.success) {
  this.sessionToken = data.sessionToken;
  localStorage.setItem('sessionToken', this.sessionToken);
  this.showMessage('登录成功，正在跳转...', 'success');
  setTimeout(() => {
    window.location.href = '/';
  }, 1000);
}
```
### API请求认证
```javascript
const response = await fetch('/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.sessionToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
});
```
## 🔍 调试和监控
### 日志记录
系统记录以下信息：
- 用户登录/登出事件
- 会话验证结果
- 路由跳转记录
- API访问日志
### 常见问题排查
1. **无限重定向循环**
   - 检查Cookie设置是否正确
   - 验证会话验证逻辑
2. **登录后仍然跳转到登录页**
   - 检查Cookie是否正确设置
   - 验证会话令牌格式
3. **API请求被拒绝**
   - 检查Authorization头是否正确
   - 验证会话令牌有效性
## 🚀 部署注意事项
### 环境变量
确保设置以下环境变量：
- `JWT_SECRET`: JWT签名密钥
- `ENCRYPTION_KEY`: 数据加密密钥
- `SERVER_GEMINI_API_KEY`: 服务器API密钥
### HTTPS要求
由于使用了Secure Cookie，必须在HTTPS环境下部署。
### 域名配置
确保Cookie的域名设置正确，特别是在使用自定义域名时。
## 🔄 升级指南
### 从旧版本升级
1. 清除所有现有会话
2. 更新数据库结构
3. 重新部署应用
4. 通知用户重新登录
### 兼容性处理
系统同时支持Cookie和localStorage，确保向后兼容。
## 📊 性能优化
### 缓存策略
- 静态文件：1小时缓存
- API响应：不缓存
- 用户信息：客户端缓存
### 网络优化
- 减少重定向次数
- 合并静态资源请求
- 使用CDN加速
这个路由系统确保了用户有流畅的登录体验，同时保证了应用的安全性。
