
-- Gemini Playground 用户系统数据库设计
-- 使用 Cloudflare D1 数据库
-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(20) UNIQUE,
    wechat_openid VARCHAR(100) UNIQUE,
    wechat_unionid VARCHAR(100),
    username VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    email VARCHAR(255),
    user_type TEXT CHECK(user_type IN ('free', 'premium')) DEFAULT 'free',
    api_key TEXT,
    premium_expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    status TEXT CHECK(status IN ('active', 'suspended', 'deleted')) DEFAULT 'active'
);

-- 支付订单表
CREATE TABLE payment_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_no VARCHAR(64) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    payment_method TEXT CHECK(payment_method IN ('wechat', 'alipay')) NOT NULL,
    payment_status TEXT CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
    third_party_order_id VARCHAR(100),
    product_type VARCHAR(50) DEFAULT 'premium_yearly',
    product_duration INTEGER DEFAULT 365,
    paid_at DATETIME,                            -- 支付时间
    expires_at DATETIME,                         -- 到期时间
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
-- 用户会话表
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,  -- 会话令牌
    expires_at DATETIME NOT NULL,                -- 过期时间
    ip_address VARCHAR(45),                      -- IP地址
    user_agent TEXT,                             -- 用户代理
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
-- API使用统计表
CREATE TABLE api_usage_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,                          -- 统计日期
    api_calls INTEGER DEFAULT 0,                 -- API调用次数
    tokens_used INTEGER DEFAULT 0,               -- 使用的Token数量
    cost DECIMAL(10,4) DEFAULT 0,                -- 成本（仅付费用户）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, date)
);
-- 系统配置表
CREATE TABLE system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,     -- 配置键
    config_value TEXT,                           -- 配置值
    description TEXT,                            -- 描述
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 用户登录日志表
CREATE TABLE login_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    login_type TEXT CHECK(login_type IN ('phone', 'wechat')) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status TEXT CHECK(status IN ('success', 'failed')) NOT NULL,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
-- 创建索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_wechat_openid ON users(wechat_openid);
CREATE INDEX idx_users_premium_expires ON users(premium_expires_at);
CREATE INDEX idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_status ON payment_orders(payment_status);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_api_usage_user_date ON api_usage_stats(user_id, date);
CREATE INDEX idx_login_logs_user_id ON login_logs(user_id);
-- 插入默认系统配置
INSERT INTO system_config (config_key, config_value, description) VALUES
('premium_price', '20.00', '年费价格（元）'),
('premium_duration_days', '365', '年费有效期（天）'),
('server_api_key', '', '服务器API Key（加密存储）'),
('wechat_app_id', '', '微信小程序/公众号AppID'),
('wechat_app_secret', '', '微信小程序/公众号AppSecret'),
('alipay_app_id', '', '支付宝应用ID'),
('alipay_private_key', '', '支付宝应用私钥'),
('max_daily_api_calls_free', '100', '免费用户每日API调用限制'),
('max_daily_api_calls_premium', '10000', '付费用户每日API调用限制');
>>>>>>> Stashed changes
