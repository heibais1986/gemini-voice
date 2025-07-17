# 生产环境验证码测试方案

## 概述

在生产环境中无法接入真实短信服务时，我们提供了多种验证码测试方案，确保功能可以正常测试和演示。

## 测试方案

### 方案1: 测试专用手机号

使用预设的测试手机号，这些号码会使用固定的验证码：

```javascript
// 测试手机号列表
const testPhones = [
  '13800138000', // 通用测试号码
  '13800138001', // 测试号码1  
  '13800138002', // 测试号码2
  '13800138003', // 测试号码3
  '18888888888', // 特殊测试号码
  '19999999999'  // 特殊测试号码
];

// 固定验证码: 123456
```

**使用方法:**
1. 在登录页面输入测试手机号（如：13800138000）
2. 点击"发送验证码"
3. 输入验证码：`123456`
4. 点击登录

### 方案2: 开发环境规则验证码

在开发环境中，验证码基于手机号后4位生成：

```javascript
// 示例：手机号 13812345678
// 验证码：005678 (后4位补齐6位)

// 示例：手机号 13800001234  
// 验证码：001234
```

**使用方法:**
1. 设置环境变量 `ENVIRONMENT=development`
2. 输入任意手机号
3. 验证码 = 手机号后4位，不足6位前面补0
4. 支持万能验证码：`123456`, `000000`, `888888`

### 方案3: 控制台输出验证码

所有环境都会在服务器控制台输出验证码：

```bash
📱 [测试模式] 验证码发送到 13800138000: 123456
📱 [开发模式] 验证码发送到 13812345678: 005678  
📱 [生产模式] 应该发送验证码到 13900000000: 847392
```

## 环境配置

### 开发环境 (development)
```bash
ENVIRONMENT=development
```
- 支持万能验证码
- 控制台输出验证码
- 基于手机号规则生成验证码

### 测试环境 (test)  
```bash
ENVIRONMENT=test
```
- 测试手机号使用固定验证码
- 控制台输出验证码
- 适合自动化测试

### 生产环境 (production)
```bash
ENVIRONMENT=production
```
- 测试手机号仍可使用固定验证码
- 其他号码需要集成真实短信服务
- 控制台输出验证码（用于调试）

## API 响应示例

### 测试手机号响应
```json
{
  "success": true,
  "message": "测试验证码已生成",
  "hint": "测试号码，验证码: 123456"
}
```

### 开发环境响应
```json
{
  "success": true,
  "message": "开发验证码已生成", 
  "hint": "开发模式，验证码: 005678",
  "code": "005678"
}
```

### 生产环境响应
```json
{
  "success": true,
  "message": "验证码已发送",
  "hint": "验证码已发送到您的手机"
}
```

## 前端集成

### 显示验证码提示
```javascript
// 发送验证码后显示提示
const response = await fetch('/api/auth/send-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '13800138000' })
});

const data = await response.json();
if (data.success) {
  // 显示提示信息
  showMessage(data.hint);
  
  // 开发环境直接显示验证码
  if (data.code) {
    console.log('验证码:', data.code);
  }
}
```

### 验证码输入提示
```javascript
// 根据手机号显示不同提示
function getCodeHint(phone) {
  const testPhones = ['13800138000', '13800138001', '13800138002'];
  
  if (testPhones.includes(phone)) {
    return '测试号码请输入: 123456';
  }
  
  if (isDevelopment) {
    const hint = phone.slice(-4).padStart(6, '0');
    return `开发模式请输入: ${hint}`;
  }
  
  return '请输入收到的6位验证码';
}
```

## 测试用例

### 基础功能测试
```bash
# 1. 测试手机号登录
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000"}'

curl -X POST http://localhost:3000/api/auth/login/phone \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","verificationCode":"123456"}'

# 2. 开发环境测试
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13812345678"}'

curl -X POST http://localhost:3000/api/auth/login/phone \
  -H "Content-Type: application/json" \
  -d '{"phone":"13812345678","verificationCode":"005678"}'
```

### 错误场景测试
```bash
# 1. 验证码错误
curl -X POST http://localhost:3000/api/auth/login/phone \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","verificationCode":"000000"}'

# 2. 验证码过期（5分钟后）
# 3. 手机号格式错误
# 4. 验证码为空
```

## 生产环境部署

### 集成真实短信服务

当需要集成真实短信服务时，修改 `VerificationCodeManager.sendCode()` 方法：

```javascript
// 生产环境 - 集成真实短信服务
if (this.isProduction && !this.isTestPhone(phone)) {
  try {
    // 腾讯云短信
    await this.sendSMSViaTencentCloud(phone, code);
    
    // 或阿里云短信  
    // await this.sendSMSViaAliyun(phone, code);
    
    return { success: true, message: '验证码已发送', method: 'sms' };
  } catch (error) {
    console.error('短信发送失败:', error);
    return { success: false, message: '验证码发送失败' };
  }
}
```

### 环境变量配置
```bash
# 生产环境
ENVIRONMENT=production
SMS_PROVIDER=tencent  # 或 aliyun
SMS_APP_ID=your_app_id
SMS_SECRET_KEY=your_secret_key
SMS_TEMPLATE_ID=your_template_id
```

## 注意事项

1. **安全性**: 测试手机号和万能验证码仅用于开发测试，生产环境应限制使用
2. **日志记录**: 生产环境不应在日志中输出真实用户的验证码
3. **限流保护**: 所有环境都应保持验证码发送的限流保护
4. **过期时间**: 验证码5分钟过期时间在所有环境保持一致
5. **监控告警**: 生产环境应监控短信发送成功率和异常情况

## 常见问题

### Q: 为什么测试手机号使用固定验证码？
A: 便于自动化测试和演示，避免依赖真实短信服务。

### Q: 开发环境的万能验证码安全吗？
A: 仅在开发环境使用，生产环境会被禁用。

### Q: 如何添加新的测试手机号？
A: 修改 `VerificationCodeManager.isTestPhone()` 方法中的数组。

### Q: 验证码在控制台输出是否安全？
A: 开发和测试环境可以，生产环境应谨慎使用并确保日志安全。
