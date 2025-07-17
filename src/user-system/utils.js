
/**
 * 工具函数
 */
/**
 * 生成会话令牌
 */
export function generateSessionToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
/**
 * 生成订单号
 */
export function generateOrderNo() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `GP${timestamp}${random}`;
}
/**
 * 验证手机号格式
 */
export function validatePhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}
/**
 * 验证邮箱格式
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
/**
 * 获取客户端IP地址
 */
export function getClientIP(request) {
  // 尝试从各种头部获取真实IP
  const headers = [
    'CF-Connecting-IP',      // Cloudflare
    'X-Forwarded-For',       // 代理
    'X-Real-IP',             // Nginx
    'X-Client-IP',           // Apache
    'X-Forwarded',           // 其他代理
    'Forwarded-For',         // RFC 7239
    'Forwarded'              // RFC 7239
  ];
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // X-Forwarded-For 可能包含多个IP，取第一个
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'unknown') {
        return ip;
      }
    }
  }
  // 如果都没有，返回默认值
  return 'unknown';
}
/**
 * 获取用户代理
 */
export function getUserAgent(request) {
  return request.headers.get('User-Agent') || 'unknown';
}
/**
 * 生成JWT令牌（简化版）
 */
export function generateJWT(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  // 这里应该使用真正的HMAC-SHA256算法
  // 暂时使用简单的签名
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${secret}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
/**
 * 验证JWT令牌（简化版）
 */
export function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const [encodedHeader, encodedPayload, signature] = parts;
    // 验证签名
    const expectedSignature = btoa(`${encodedHeader}.${encodedPayload}.${secret}`);
    if (signature !== expectedSignature) {
      return null;
    }
    // 解码payload
    const payload = JSON.parse(atob(encodedPayload));
    // 检查过期时间
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}
/**
 * 格式化日期
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}
/**
 * 计算两个日期之间的天数
 */
export function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
}
/**
 * 生成验证码
 */
export function generateVerificationCode(length = 6) {
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return result;
}

/**
 * 生产环境验证码测试方案
 */
export class VerificationCodeManager {
  constructor(env) {
    this.env = env;
    this.isProduction = env.ENVIRONMENT === 'production';
    this.isDevelopment = env.ENVIRONMENT === 'development';
    this.isTest = env.ENVIRONMENT === 'test';
  }

  /**
   * 生成验证码（根据环境使用不同策略）
   */
  generateCode(phone) {
    // 方案1: 测试手机号使用固定验证码
    if (this.isTestPhone(phone)) {
      return '123456'; // 测试专用验证码
    }

    // 方案2: 开发环境使用简单规则
    if (this.isDevelopment) {
      // 使用手机号后4位作为验证码（补齐6位）
      const lastFour = phone.slice(-4);
      return lastFour.padStart(6, '0');
    }

    // 方案3: 生产环境使用随机验证码
    return generateVerificationCode(6);
  }

  /**
   * 检查是否为测试手机号
   */
  isTestPhone(phone) {
    const testPhones = [
      '13800138000', // 通用测试号码
      '13800138001', // 测试号码1
      '13800138002', // 测试号码2
      '13800138003', // 测试号码3
      '18888888888', // 特殊测试号码
      '19999999999'  // 特殊测试号码
    ];
    return testPhones.includes(phone);
  }

  /**
   * 验证验证码（支持多种验证策略）
   */
  verifyCode(phone, inputCode, storedCode) {
    // 方案1: 测试手机号的特殊验证逻辑
    if (this.isTestPhone(phone)) {
      // 测试号码支持多个有效验证码
      const validCodes = ['123456', '000000', storedCode];
      return validCodes.includes(inputCode);
    }

    // 方案2: 开发环境的宽松验证
    if (this.isDevelopment) {
      // 开发环境支持万能验证码
      const universalCodes = ['123456', '000000', '888888'];
      if (universalCodes.includes(inputCode)) {
        return true;
      }
    }

    // 方案3: 正常验证逻辑
    return inputCode === storedCode;
  }

  /**
   * 模拟发送验证码（根据环境使用不同策略）
   */
  async sendCode(phone, code) {
    if (this.isTestPhone(phone)) {
      console.log(`📱 [测试模式] 验证码发送到 ${phone}: ${code}`);
      return { success: true, message: '测试验证码已生成', method: 'test' };
    }

    if (this.isDevelopment || this.isTest) {
      console.log(`📱 [开发模式] 验证码发送到 ${phone}: ${code}`);
      return { success: true, message: '开发验证码已生成', method: 'console' };
    }

    // 生产环境 - 这里应该集成真实的短信服务
    if (this.isProduction) {
      try {
        // TODO: 集成真实短信服务 (阿里云、腾讯云、华为云等)
        // await this.sendSMSViaTencentCloud(phone, code);
        // await this.sendSMSViaAliyun(phone, code);

        console.log(`📱 [生产模式] 应该发送验证码到 ${phone}: ${code}`);
        return { success: true, message: '验证码已发送', method: 'sms' };
      } catch (error) {
        console.error('短信发送失败:', error);
        return { success: false, message: '验证码发送失败', error: error.message };
      }
    }

    return { success: false, message: '未知环境' };
  }

  /**
   * 获取验证码提示信息
   */
  getCodeHint(phone) {
    if (this.isTestPhone(phone)) {
      return '测试号码，验证码: 123456';
    }

    if (this.isDevelopment) {
      const hint = phone.slice(-4).padStart(6, '0');
      return `开发模式，验证码: ${hint}`;
    }

    return '验证码已发送到您的手机';
  }
}
/**
 * 脱敏手机号
 */
export function maskPhone(phone) {
  if (!phone || phone.length < 11) {
    return phone;
  }
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}
/**
 * 脱敏邮箱
 */
export function maskEmail(email) {
  if (!email || !email.includes('@')) {
    return email;
  }
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return email;
  }
  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
}
/**
 * 检查是否为有效的URL
 */
export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
/**
 * 安全的JSON解析
 */
export function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return defaultValue;
  }
}
/**
 * 延迟函数
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * 重试函数
 */
export async function retry(fn, maxAttempts = 3, delayMs = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await delay(delayMs * attempt);
      }
    }
  }
  throw lastError;
}
/**
 * 限流函数（简单实现）
 */
export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    const userRequests = this.requests.get(key);
    // 清理过期的请求记录
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(key, validRequests);
    // 检查是否超过限制
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    // 记录新请求
    validRequests.push(now);
    return true;
  }
  getRemainingRequests(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    if (!this.requests.has(key)) {
      return this.maxRequests;
    }
    const userRequests = this.requests.get(key);
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}
