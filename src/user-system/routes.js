
/**
 * 用户系统API路由处理器
 */
import { AuthService } from './auth.js';
import { PaymentService } from './payment.js';
import { getClientIP, getUserAgent, validatePhone, RateLimiter } from './utils.js';
// 创建限流器
const loginLimiter = new RateLimiter(5, 60000); // 每分钟最多5次登录尝试
const apiLimiter = new RateLimiter(100, 60000);  // 每分钟最多100次API调用
export class UserRoutes {
  constructor(db, env) {
    this.authService = new AuthService(db, env);
    this.paymentService = new PaymentService(db, env);
    this.env = env;
  }
  /**
   * 处理用户系统相关的API请求
   */
  async handleRequest(request, pathname) {
    const method = request.method;
    const ipAddress = getClientIP(request);
    // 限流检查
    if (!apiLimiter.isAllowed(ipAddress)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many requests'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    try {
      switch (true) {
        // 手机号登录
        case pathname === '/api/auth/login/phone' && method === 'POST':
          return await this.handlePhoneLogin(request);
        // 微信登录
        case pathname === '/api/auth/login/wechat' && method === 'POST':
          return await this.handleWechatLogin(request);
        // 登出
        case pathname === '/api/auth/logout' && method === 'POST':
          return await this.handleLogout(request);
        // 获取用户信息
        case pathname === '/api/user/profile' && method === 'GET':
          return await this.handleGetProfile(request);
        // 更新用户API Key
        case pathname === '/api/user/api-key' && method === 'PUT':
          return await this.handleUpdateApiKey(request);
        // 获取用户权限信息
        case pathname === '/api/user/permission' && method === 'GET':
          return await this.handleGetPermission(request);
        // 创建支付订单
        case pathname === '/api/payment/create' && method === 'POST':
          return await this.handleCreatePayment(request);
        // 支付回调
        case pathname === '/api/payment/callback/wechat' && method === 'POST':
          return await this.handleWechatCallback(request);
        case pathname === '/api/payment/callback/alipay' && method === 'POST':
          return await this.handleAlipayCallback(request);
        // 查询订单状态
        case pathname === '/api/payment/status' && method === 'GET':
          return await this.handlePaymentStatus(request);
        // 获取用户统计信息
        case pathname === '/api/user/stats' && method === 'GET':
          return await this.handleGetStats(request);
        default:
          return new Response(JSON.stringify({
            success: false,
            error: 'Not found'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    } catch (error) {
      console.error('User system error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  /**
   * 手机号登录
   */
  async handlePhoneLogin(request) {
    const ipAddress = getClientIP(request);
    // 登录限流
    if (!loginLimiter.isAllowed(ipAddress)) {
      return this.errorResponse('Too many login attempts', 429);
    }
    try {
      const { phone, verificationCode } = await request.json();
      if (!phone || !verificationCode) {
        return this.errorResponse('Phone and verification code are required');
      }
      if (!validatePhone(phone)) {
        return this.errorResponse('Invalid phone number format');
      }
      const userAgent = getUserAgent(request);
      const result = await this.authService.loginWithPhone(phone, verificationCode, ipAddress, userAgent);
      if (result.success) {
        return this.successResponse({
          user: result.user,
          sessionToken: result.sessionToken,
          expiresAt: result.expiresAt
        });
      } else {
        return this.errorResponse(result.error);
      }
    } catch (error) {
      return this.errorResponse('Invalid request data');
    }
  }
  /**
   * 微信登录
   */
  async handleWechatLogin(request) {
    const ipAddress = getClientIP(request);
    // 登录限流
    if (!loginLimiter.isAllowed(ipAddress)) {
      return this.errorResponse('Too many login attempts', 429);
    }
    try {
      const { code } = await request.json();
      if (!code) {
        return this.errorResponse('Wechat code is required');
      }
      const userAgent = getUserAgent(request);
      const result = await this.authService.loginWithWechat(code, ipAddress, userAgent);
      if (result.success) {
        return this.successResponse({
          user: result.user,
          sessionToken: result.sessionToken,
          expiresAt: result.expiresAt
        });
      } else {
        return this.errorResponse(result.error);
      }
    } catch (error) {
      return this.errorResponse('Invalid request data');
    }
  }
  /**
   * 登出
   */
  async handleLogout(request) {
    try {
      const sessionToken = this.getSessionToken(request);
      if (!sessionToken) {
        return this.errorResponse('No session token provided');
      }
      const result = await this.authService.logout(sessionToken);
      return this.successResponse({ message: 'Logged out successfully' });
    } catch (error) {
      return this.errorResponse('Logout failed');
    }
  }
  /**
   * 获取用户信息
   */
  async handleGetProfile(request) {
    const authResult = await this.authenticateRequest(request);
    if (!authResult.success) {
      return this.errorResponse(authResult.error, 401);
    }
    return this.successResponse({ user: authResult.user });
  }
  /**
   * 更新用户API Key
   */
  async handleUpdateApiKey(request) {
    const authResult = await this.authenticateRequest(request);
    if (!authResult.success) {
      return this.errorResponse(authResult.error, 401);
    }
    try {
      const { apiKey } = await request.json();
      if (!apiKey) {
        return this.errorResponse('API key is required');
      }
      const result = await this.authService.updateUserApiKey(authResult.user.id, apiKey);
      if (result.success) {
        return this.successResponse({ message: 'API key updated successfully' });
      } else {
        return this.errorResponse(result.error);
      }
    } catch (error) {
      return this.errorResponse('Invalid request data');
    }
  }
  /**
   * 获取用户权限信息
   */
  async handleGetPermission(request) {
    const authResult = await this.authenticateRequest(request);
    if (!authResult.success) {
      return this.errorResponse(authResult.error, 401);
    }
    const permission = await this.authService.checkUserPermission(authResult.user.id);
    return this.successResponse({ permission });
  }
  /**
   * 创建支付订单
   */
  async handleCreatePayment(request) {
    const authResult = await this.authenticateRequest(request);
    if (!authResult.success) {
      return this.errorResponse(authResult.error, 401);
    }
    try {
      const { paymentMethod, amount } = await request.json();
      if (!paymentMethod || !['wechat', 'alipay'].includes(paymentMethod)) {
        return this.errorResponse('Invalid payment method');
      }
      let result;
      if (paymentMethod === 'wechat') {
        result = await this.paymentService.createWechatPayOrder(authResult.user.id, amount);
      } else {
        result = await this.paymentService.createAlipayOrder(authResult.user.id, amount);
      }
      if (result.success) {
        return this.successResponse({
          order: result.order,
          paymentData: result.paymentData
        });
      } else {
        return this.errorResponse(result.error);
      }
    } catch (error) {
      return this.errorResponse('Invalid request data');
    }
  }
  /**
   * 微信支付回调
   */
  async handleWechatCallback(request) {
    try {
      const callbackData = await request.json();
      const result = await this.paymentService.handlePaymentCallback('wechat', callbackData);
      if (result.success) {
        return this.successResponse({ message: 'Payment processed successfully' });
      } else {
        return this.errorResponse(result.error);
      }
    } catch (error) {
      return this.errorResponse('Invalid callback data');
    }
  }
  /**
   * 支付宝支付回调
   */
  async handleAlipayCallback(request) {
    try {
      const callbackData = await request.json();
      const result = await this.paymentService.handlePaymentCallback('alipay', callbackData);
      if (result.success) {
        return this.successResponse({ message: 'Payment processed successfully' });
      } else {
        return this.errorResponse(result.error);
      }
    } catch (error) {
      return this.errorResponse('Invalid callback data');
    }
  }
  /**
   * 查询支付状态
   */
  async handlePaymentStatus(request) {
    const authResult = await this.authenticateRequest(request);
    if (!authResult.success) {
      return this.errorResponse(authResult.error, 401);
    }
    const url = new URL(request.url);
    const orderNo = url.searchParams.get('orderNo');
    if (!orderNo) {
      return this.errorResponse('Order number is required');
    }
    const result = await this.paymentService.queryOrderStatus(orderNo);
    if (result.success) {
      return this.successResponse({ order: result.order });
    } else {
      return this.errorResponse(result.error);
    }
  }
  /**
   * 获取用户统计信息
   */
  async handleGetStats(request) {
    const authResult = await this.authenticateRequest(request);
    if (!authResult.success) {
      return this.errorResponse(authResult.error, 401);
    }
    // 这里可以添加获取用户统计信息的逻辑
    return this.successResponse({
      stats: {
        totalApiCalls: 0,
        todayApiCalls: 0,
        remainingCalls: 0
      }
    });
  }
  /**
   * 认证请求
   */
  async authenticateRequest(request) {
    const sessionToken = this.getSessionToken(request);
    if (!sessionToken) {
      return { success: false, error: 'No session token provided' };
    }
    const result = await this.authService.validateSession(sessionToken);
    if (!result.valid) {
      return { success: false, error: result.error };
    }
    return { success: true, user: result.user };
  }
  /**
   * 从请求中获取会话令牌
   */
  getSessionToken(request) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }
  /**
   * 成功响应
   */
  successResponse(data) {
    return new Response(JSON.stringify({
      success: true,
      ...data
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  /**
   * 错误响应
   */
  errorResponse(error, status = 400) {
    return new Response(JSON.stringify({
      success: false,
      error: error
    }), {
      status: status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
