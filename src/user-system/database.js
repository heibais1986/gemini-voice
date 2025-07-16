/**
 * 数据库操作类
 * 封装所有与D1数据库的交互操作
 */

export class Database {
  constructor(db) {
    this.db = db;
  }

  // 用户相关操作
  async createUser(userData) {
    const {
      phone,
      wechat_openid,
      wechat_unionid,
      username,
      avatar_url,
      email
    } = userData;

    const result = await this.db.prepare(`
      INSERT INTO users (phone, wechat_openid, wechat_unionid, username, avatar_url, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(phone, wechat_openid, wechat_unionid, username, avatar_url, email).run();

    if (result.success) {
      return await this.getUserById(result.meta.last_row_id);
    }
    throw new Error('Failed to create user');
  }

  async getUserById(id) {
    const result = await this.db.prepare(`
      SELECT * FROM users WHERE id = ? AND status = 'active'
    `).bind(id).first();
    return result;
  }

  async getUserByPhone(phone) {
    const result = await this.db.prepare(`
      SELECT * FROM users WHERE phone = ? AND status = 'active'
    `).bind(phone).first();
    return result;
  }

  async getUserByWechatOpenId(openid) {
    const result = await this.db.prepare(`
      SELECT * FROM users WHERE wechat_openid = ? AND status = 'active'
    `).bind(openid).first();
    return result;
  }

  async updateUser(id, updateData) {
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    
    if (fields.length === 0) return false;
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await this.db.prepare(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return result.success;
  }

  async updateLastLogin(userId) {
    const result = await this.db.prepare(`
      UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(userId).run();
    return result.success;
  }

  // 会话管理
  async createSession(userId, sessionToken, expiresAt, ipAddress, userAgent) {
    const result = await this.db.prepare(`
      INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `).bind(userId, sessionToken, expiresAt, ipAddress, userAgent).run();
    return result.success;
  }

  async getSessionByToken(sessionToken) {
    const result = await this.db.prepare(`
      SELECT s.*, u.* FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.status = 'active'
    `).bind(sessionToken).first();
    return result;
  }

  async deleteSession(sessionToken) {
    const result = await this.db.prepare(`
      DELETE FROM user_sessions WHERE session_token = ?
    `).bind(sessionToken).run();
    return result.success;
  }

  async cleanExpiredSessions() {
    const result = await this.db.prepare(`
      DELETE FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP
    `).run();
    return result.success;
  }

  // 支付订单管理
  async createPaymentOrder(orderData) {
    const {
      user_id,
      order_no,
      amount,
      payment_method,
      product_type,
      product_duration,
      expires_at
    } = orderData;

    const result = await this.db.prepare(`
      INSERT INTO payment_orders 
      (user_id, order_no, amount, payment_method, product_type, product_duration, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(user_id, order_no, amount, payment_method, product_type, product_duration, expires_at).run();

    if (result.success) {
      return await this.getPaymentOrderById(result.meta.last_row_id);
    }
    throw new Error('Failed to create payment order');
  }

  async getPaymentOrderById(id) {
    const result = await this.db.prepare(`
      SELECT * FROM payment_orders WHERE id = ?
    `).bind(id).first();
    return result;
  }

  async getPaymentOrderByOrderNo(orderNo) {
    const result = await this.db.prepare(`
      SELECT * FROM payment_orders WHERE order_no = ?
    `).bind(orderNo).first();
    return result;
  }

  async updatePaymentOrder(id, updateData) {
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    
    if (fields.length === 0) return false;
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await this.db.prepare(`
      UPDATE payment_orders SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return result.success;
  }

  // API使用统计
  async recordApiUsage(userId, apiCalls = 1, tokensUsed = 0, cost = 0) {
    const today = new Date().toISOString().split('T')[0];
    
    // 尝试更新现有记录
    const updateResult = await this.db.prepare(`
      UPDATE api_usage_stats 
      SET api_calls = api_calls + ?, tokens_used = tokens_used + ?, cost = cost + ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND date = ?
    `).bind(apiCalls, tokensUsed, cost, userId, today).run();

    // 如果没有更新任何记录，则插入新记录
    if (updateResult.changes === 0) {
      await this.db.prepare(`
        INSERT INTO api_usage_stats (user_id, date, api_calls, tokens_used, cost)
        VALUES (?, ?, ?, ?, ?)
      `).bind(userId, today, apiCalls, tokensUsed, cost).run();
    }
  }

  async getApiUsageStats(userId, startDate, endDate) {
    const result = await this.db.prepare(`
      SELECT * FROM api_usage_stats 
      WHERE user_id = ? AND date BETWEEN ? AND ?
      ORDER BY date DESC
    `).bind(userId, startDate, endDate).all();
    return result.results || [];
  }

  async getTodayApiUsage(userId) {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.db.prepare(`
      SELECT * FROM api_usage_stats WHERE user_id = ? AND date = ?
    `).bind(userId, today).first();
    return result || { api_calls: 0, tokens_used: 0, cost: 0 };
  }

  // 系统配置
  async getConfig(key) {
    const result = await this.db.prepare(`
      SELECT config_value FROM system_config WHERE config_key = ?
    `).bind(key).first();
    return result ? result.config_value : null;
  }

  async setConfig(key, value, description = '') {
    const result = await this.db.prepare(`
      INSERT OR REPLACE INTO system_config (config_key, config_value, description, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(key, value, description).run();
    return result.success;
  }

  // 登录日志
  async logLogin(userId, loginType, ipAddress, userAgent, status, errorMessage = null) {
    const result = await this.db.prepare(`
      INSERT INTO login_logs (user_id, login_type, ip_address, user_agent, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(userId, loginType, ipAddress, userAgent, status, errorMessage).run();
    return result.success;
  }

  // 检查用户是否为付费用户
  async isPremiumUser(userId) {
    const user = await this.getUserById(userId);
    if (!user) return false;
    
    if (user.user_type === 'premium' && user.premium_expires_at) {
      const expiresAt = new Date(user.premium_expires_at);
      return expiresAt > new Date();
    }
    return false;
  }

  // 升级用户为付费用户
  async upgradeToPremium(userId, expiresAt) {
    const result = await this.db.prepare(`
      UPDATE users 
      SET user_type = 'premium', premium_expires_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(expiresAt, userId).run();
    return result.success;
  }
}
