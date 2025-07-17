/**
 * 简化版本的main.js，用于测试认证功能
 * 移除了所有外部依赖，专注于认证逻辑
 */

// 用户认证管理
class UserAuthManager {
    constructor() {
        this.sessionToken = this.getSessionTokenFromCookie() || localStorage.getItem('sessionToken');
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    // 从Cookie获取会话令牌
    getSessionTokenFromCookie() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'sessionToken') {
                return decodeURIComponent(value);
            }
        }
        return null;
    }

    // 设置会话令牌到Cookie
    setSessionTokenToCookie(token, expiresAt) {
        const expires = new Date(expiresAt);
        document.cookie = `sessionToken=${encodeURIComponent(token)}; path=/; expires=${expires.toUTCString()}; secure; samesite=strict`;
        localStorage.setItem('sessionToken', token);
    }

    // 清除会话令牌
    clearSessionToken() {
        document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('sessionToken');
        this.sessionToken = null;
    }

    async checkAuth() {
        console.log('🔐 checkAuth() 开始执行...');
        console.log('📍 当前路径:', window.location.pathname);
        console.log('🎫 当前sessionToken:', this.sessionToken ? '存在' : '不存在');
        
        // 如果后端已经重定向到登录页，说明认证失败，不需要前端再次检查
        if (window.location.pathname === '/login.html') {
            console.log('📄 当前在登录页，跳过认证检查');
            return false;
        }
        
        // 如果有sessionToken，尝试获取用户信息
        if (this.sessionToken) {
            console.log('🎫 有sessionToken，验证有效性...');
            try {
                const response = await fetch('/api/user/profile', {
                    headers: {
                        'Authorization': `Bearer ${this.sessionToken}`
                    }
                });
                console.log('📡 API响应状态:', response.status);
                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data.user;
                    this.isAuthenticated = true;
                    this.updateUserUI();
                    this.hideLoginOverlay();
                    console.log('✅ 认证成功，用户:', data.user.username);
                    return true;
                } else {
                    // token无效，清除并显示登录提示
                    console.log('❌ token无效，清除认证信息');
                    this.clearSessionToken();
                    this.showLoginOverlay();
                    return false;
                }
            } catch (error) {
                console.error('❌ 认证检查失败:', error);
                this.showLoginOverlay();
                return false;
            }
        } else {
            // 没有token，显示登录提示
            console.log('❌ 没有sessionToken，显示登录遮罩');
            this.showLoginOverlay();
            return false;
        }
    }

    redirectToLogin() {
        // 优先显示登录遮罩，而不是直接重定向
        this.showLoginOverlay();
    }

    showLoginOverlay() {
        console.log('🔓 尝试显示登录遮罩...');
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            console.log('✅ 登录遮罩已显示');
        } else {
            console.error('❌ 找不到login-overlay元素');
        }
    }

    hideLoginOverlay() {
        console.log('🔒 隐藏登录遮罩...');
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            console.log('✅ 登录遮罩已隐藏');
        } else {
            console.error('❌ 找不到login-overlay元素');
        }
    }

    updateUserUI() {
        const userInfo = document.getElementById('user-info');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const userType = document.getElementById('user-type');
        const apiKeyInput = document.getElementById('api-key');

        if (this.currentUser) {
            if (userInfo) userInfo.style.display = 'flex';
            if (userName) userName.textContent = this.currentUser.username || '用户';
            if (userType) userType.textContent = this.currentUser.user_type === 'premium' ? '付费用户' : '免费用户';

            if (this.currentUser.avatar_url && userAvatar) {
                userAvatar.src = this.currentUser.avatar_url;
            }

            // 付费用户隐藏API Key输入框
            if (apiKeyInput) {
                if (this.currentUser.user_type === 'premium') {
                    apiKeyInput.style.display = 'none';
                } else {
                    apiKeyInput.style.display = 'block';
                }
            }
        } else {
            if (userInfo) userInfo.style.display = 'none';
            if (apiKeyInput) apiKeyInput.style.display = 'block';
        }
    }
}

// 创建用户认证管理器实例
const userAuth = new UserAuthManager();

// 检查页面元素是否存在（某些页面可能没有这些元素）
const goLoginBtn = document.getElementById('go-login');
if (goLoginBtn) {
    goLoginBtn.addEventListener('click', () => {
        window.location.href = '/login.html';
    });
}

// 简单的日志函数
function logSystem(message) {
    console.log('🔧 系统:', message);
    const logsContainer = document.getElementById('logs-container');
    if (logsContainer) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry system';
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logsContainer.appendChild(logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }
}

// 页面初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 页面初始化开始...');
    
    // 检查服务器是否要求认证
    const authRequired = document.querySelector('meta[name="auth-required"]');
    console.log('🔍 检查auth-required meta标签:', authRequired);
    if (authRequired) {
        console.log('📋 meta标签内容:', authRequired.content);
    }
    
    if (authRequired && authRequired.content === 'true') {
        console.log('✅ 发现auth-required=true，显示登录遮罩');
        userAuth.showLoginOverlay();
    } else {
        console.log('❌ 未发现auth-required=true，继续认证检查');
    }
    
    // 检查用户认证状态
    console.log('🔐 开始用户认证检查...');
    await userAuth.checkAuth();

    // 初始状态设置
    const connectButton = document.getElementById('connect-button');
    const micButton = document.getElementById('mic-button');
    const cameraButton = document.getElementById('camera-button');
    const screenButton = document.getElementById('screen-button');
    
    if (connectButton) connectButton.disabled = false;
    if (micButton) micButton.disabled = true;
    if (cameraButton) cameraButton.disabled = true;
    if (screenButton) screenButton.disabled = true;

    logSystem('应用已初始化（简化版本）');
    console.log('✅ 页面初始化完成');
});

// 导出给全局使用
window.userAuth = userAuth;
window.logSystem = logSystem;
