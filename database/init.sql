
-- 数据库初始化脚本
-- 此脚本用于插入初始数据，通常在执行 schema.sql 之后运行。
-- 注意：此脚本会先删除所有数据！
-- 删除已存在的表（如果存在）
DROP TABLE IF EXISTS login_logs;
DROP TABLE IF EXISTS api_usage_stats;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS payment_orders;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS system_config;

-- 注意：表的创建语句已移至 schema.sql 文件。
-- 这里只负责插入初始数据。
>>>>>>> Stashed changes
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
('max_daily_api_calls_premium', '10000', '付费用户每日API调用限制'),
('site_title', 'Gemini Playground', '网站标题'),
('site_description', '智能多模态对话平台', '网站描述'),
('maintenance_mode', 'false', '维护模式开关'),
('registration_enabled', 'true', '是否允许新用户注册'),
('payment_enabled', 'true', '是否启用支付功能');
-- 创建测试用户（可选，用于开发测试）
-- INSERT INTO users (phone, username, user_type, created_at) VALUES
-- ('13800138000', '测试用户', 'free', CURRENT_TIMESTAMP);
-- 创建管理员用户（可选）
-- INSERT INTO users (phone, username, user_type, premium_expires_at, created_at) VALUES
-- ('13900139000', '管理员', 'premium', '2025-12-31 23:59:59', CURRENT_TIMESTAMP);
-- 显示初始化结果
SELECT 'Database initialization completed successfully!' as message;
SELECT 'System config entries:' as info;
SELECT config_key, config_value, description FROM system_config;
>>>>>>> Stashed changes
