/**
 * 登录页面JavaScript
 */
class LoginManager {
    constructor() {
        this.sessionToken = localStorage.getItem('sessionToken');
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkLoginStatus();
    }

    bindEvents() {
        // 标签切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 手机号登录
        document.getElementById('phoneLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePhoneLogin();
        });

        // 发送验证码
        document.getElementById('sendCodeBtn').addEventListener('click', () => {
            this.sendVerificationCode();
        });

        // 微信登录二维码生成
        document.getElementById('generateQRBtn').addEventListener('click', () => {
            this.generateWechatQR();
        });

        // 用户操作按钮
        const apiKeyBtn = document.getElementById('apiKeyBtn');
        if (apiKeyBtn) {
            apiKeyBtn.addEventListener('click', () => {
                this.showApiKeyModal();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // 模态框关闭
        const closeApiKeyModal = document.getElementById('closeApiKeyModal');
        if (closeApiKeyModal) {
            closeApiKeyModal.addEventListener('click', () => {
                this.hideApiKeyModal();
            });
        }

        // API Key 表单提交
        const apiKeyForm = document.getElementById('apiKeyForm');
        if (apiKeyForm) {
            apiKeyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveApiKey();
            });
        }

        // 取消按钮
        const cancelApiKey = document.getElementById('cancelApiKey');
        if (cancelApiKey) {
            cancelApiKey.addEventListener('click', () => {
                this.hideApiKeyModal();
            });
        }
    }

    switchTab(tabName) {
        // 隐藏所有标签内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // 移除所有按钮的活动状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 显示选中的标签内容
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    async handlePhoneLogin() {
        const phone = document.getElementById('phoneInput').value;
        const code = document.getElementById('verificationCode').value;

        if (!phone || !code) {
            this.showMessage('请输入手机号和验证码', 'error');
            return;
        }

        try {
            const response = await fetch('/api/auth/phone-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, code })
            });

            const data = await response.json();

            if (response.ok) {
                this.handleLoginSuccess(data);
            } else {
                this.showMessage(data.message || '登录失败', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('网络错误，请重试', 'error');
        }
    }

    async sendVerificationCode() {
        const phone = document.getElementById('phoneInput').value;
        const sendBtn = document.getElementById('sendCodeBtn');

        if (!phone) {
            this.showMessage('请输入手机号', 'error');
            return;
        }

        if (!/^1[3-9]\d{9}$/.test(phone)) {
            this.showMessage('请输入正确的手机号', 'error');
            return;
        }

        try {
            sendBtn.disabled = true;
            sendBtn.textContent = '发送中...';

            const response = await fetch('/api/auth/send-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone })
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('验证码已发送', 'success');
                this.startCountdown(sendBtn);
            } else {
                this.showMessage(data.message || '发送失败', 'error');
                sendBtn.disabled = false;
                sendBtn.textContent = '发送验证码';
            }
        } catch (error) {
            console.error('Send code error:', error);
            this.showMessage('网络错误，请重试', 'error');
            sendBtn.disabled = false;
            sendBtn.textContent = '发送验证码';
        }
    }

    startCountdown(button) {
        let countdown = 60;
        const timer = setInterval(() => {
            button.textContent = `${countdown}秒后重试`;
            countdown--;

            if (countdown < 0) {
                clearInterval(timer);
                button.disabled = false;
                button.textContent = '发送验证码';
            }
        }, 1000);
    }

    async generateWechatQR() {
        const generateBtn = document.getElementById('generateQRBtn');
        const qrContainer = document.getElementById('qrContainer');

        try {
            generateBtn.disabled = true;
            generateBtn.textContent = '生成中...';

            const response = await fetch('/api/auth/wechat-qr', {
                method: 'POST'
            });

            const data = await response.json();

            if (response.ok) {
                this.displayQRCode(data.qrCode, data.scene);
                this.pollWechatLogin(data.scene);
            } else {
                this.showMessage(data.message || '生成二维码失败', 'error');
            }
        } catch (error) {
            console.error('Generate QR error:', error);
            this.showMessage('网络错误，请重试', 'error');
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '生成二维码';
        }
    }

    displayQRCode(qrCodeUrl, scene) {
        const qrContainer = document.getElementById('qrContainer');
        qrContainer.innerHTML = `
            <div class="qr-code">
                <img src="${qrCodeUrl}" alt="微信登录二维码">
                <p>请使用微信扫描二维码登录</p>
                <div class="qr-status" id="qrStatus">等待扫描...</div>
            </div>
        `;
        qrContainer.style.display = 'block';
    }

    async pollWechatLogin(scene) {
        const maxAttempts = 60; // 5分钟
        let attempts = 0;

        const poll = async () => {
            if (attempts >= maxAttempts) {
                document.getElementById('qrStatus').textContent = '二维码已过期，请重新生成';
                return;
            }

            try {
                const response = await fetch(`/api/auth/wechat-status/${scene}`);
                const data = await response.json();

                if (response.ok) {
                    if (data.status === 'scanned') {
                        document.getElementById('qrStatus').textContent = '已扫描，请在手机上确认';
                    } else if (data.status === 'confirmed') {
                        this.handleLoginSuccess(data);
                        return;
                    }
                }

                attempts++;
                setTimeout(poll, 5000); // 每5秒检查一次
            } catch (error) {
                console.error('Poll wechat login error:', error);
                attempts++;
                setTimeout(poll, 5000);
            }
        };

        poll();
    }

    handleLoginSuccess(data) {
        console.log('🎉 处理登录成功:', data);

        // 保存会话令牌
        localStorage.setItem('sessionToken', data.sessionToken);
        console.log('💾 会话令牌已保存到localStorage');

        // 设置Cookie（7天过期）
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        document.cookie = `sessionToken=${encodeURIComponent(data.sessionToken)}; path=/; expires=${expires.toUTCString()}; samesite=strict`;
        console.log('🍪 会话令牌已保存到Cookie');

        this.showMessage('登录成功！', 'success');

        // 延迟跳转到主页
        setTimeout(() => {
            console.log('🔄 跳转到主页...');
            window.location.href = '/';
        }, 1000);
    }

    checkLoginStatus() {
        if (this.sessionToken) {
            // 验证会话令牌
            this.verifySession();
        }
    }

    async verifySession() {
        try {
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.showUserDashboard(data.user);
            } else {
                // 会话无效，清除令牌
                localStorage.removeItem('sessionToken');
                this.sessionToken = null;
            }
        } catch (error) {
            console.error('Session verification error:', error);
            localStorage.removeItem('sessionToken');
            this.sessionToken = null;
        }
    }

    showUserDashboard(user) {
        // 隐藏登录表单
        document.getElementById('loginContainer').style.display = 'none';

        // 显示用户仪表板
        const dashboard = document.getElementById('userDashboard');
        dashboard.style.display = 'block';

        // 更新用户信息
        document.getElementById('userName').textContent = user.username || '用户';

        // 所有用户都显示API Key设置按钮
        const apiKeyBtn = document.getElementById('apiKeyBtn');
        if (apiKeyBtn) {
            apiKeyBtn.style.display = 'block';
        }
    }

    showApiKeyModal() {
        const modal = document.getElementById('apiKeyModal');
        if (modal) {
            modal.style.display = 'block';
            // 加载当前保存的API Key
            const savedApiKey = localStorage.getItem('gemini_api_key');
            const apiKeyInput = document.getElementById('apiKey');
            if (savedApiKey && apiKeyInput) {
                apiKeyInput.value = savedApiKey;
            }
        }
    }

    hideApiKeyModal() {
        const modal = document.getElementById('apiKeyModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 付费相关方法已移除

    saveApiKey() {
        const apiKeyInput = document.getElementById('apiKey');
        if (!apiKeyInput) {
            this.showMessage('找不到API Key输入框', 'error');
            return;
        }

        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            this.showMessage('请输入API Key', 'error');
            return;
        }

        localStorage.setItem('gemini_api_key', apiKey);
        this.showMessage('API Key已保存', 'success');
        this.hideApiKeyModal();
    }

    logout() {
        localStorage.removeItem('sessionToken');
        document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.reload();
    }

    showMessage(message, type) {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;

        // 添加到页面
        document.body.appendChild(messageEl);

        // 3秒后自动移除
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});
