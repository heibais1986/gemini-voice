<<<<<<<
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



        document.getElementById('upgradeBtn').addEventListener('click', () => {



            this.showPaymentModal();



        });







        document.getElementById('apiKeyBtn').addEventListener('click', () => {



            this.showApiKeyModal();



        });







        document.getElementById('logoutBtn').addEventListener('click', () => {



            this.logout();



        });







        // 模态框关闭



        document.getElementById('closePaymentModal').addEventListener('click', () => {



            this.hidePaymentModal();



        });







        document.getElementById('closeApiKeyModal').addEventListener('click', () => {



            this.hideApiKeyModal();



        });







        // 支付方式选择



        document.querySelectorAll('.payment-btn').forEach(btn => {



            btn.addEventListener('click', (e) => {



                this.handlePayment(e.target.dataset.method);



            });



        });







        // API Key 表单



        document.getElementById('apiKeyForm').addEventListener('submit', (e) => {



            e.preventDefault();



            this.saveApiKey();



        });







        document.getElementById('cancelApiKey').addEventListener('click', () => {



            this.hideApiKeyModal();



        });







        // 消息关闭



        document.getElementById('closeMessage').addEventListener('click', () => {



            this.hideMessage();



        });







        // 点击模态框外部关闭



        window.addEventListener('click', (e) => {



            if (e.target.classList.contains('modal')) {



                e.target.style.display = 'none';



            }



        });



    }







    switchTab(tab) {



        // 更新标签按钮状态



        document.querySelectorAll('.tab-btn').forEach(btn => {



            btn.classList.remove('active');



        });



        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');







        // 更新内容显示



        document.querySelectorAll('.tab-content').forEach(content => {



            content.classList.remove('active');



        });



        document.getElementById(`${tab}Tab`).classList.add('active');



    }







    async checkLoginStatus() {



        if (!this.sessionToken) {



            this.showLoginForm();



            return;



        }







        try {



            const response = await fetch('/api/user/profile', {



                headers: {



                    'Authorization': `Bearer ${this.sessionToken}`



                }



            });







            if (response.ok) {



                const data = await response.json();



                this.showUserInfo(data.user);



            } else {



                localStorage.removeItem('sessionToken');



                this.sessionToken = null;



                this.showLoginForm();



            }



        } catch (error) {



            console.error('Check login status failed:', error);



            this.showLoginForm();



        }



    }







    async handlePhoneLogin() {



        const phone = document.getElementById('phone').value;



        const verificationCode = document.getElementById('verificationCode').value;







        if (!phone || !verificationCode) {



            this.showMessage('请填写完整信息', 'error');



            return;



        }







        this.showLoading();







        try {



            const response = await fetch('/api/auth/login/phone', {



                method: 'POST',



                headers: {



                    'Content-Type': 'application/json'



                },



                body: JSON.stringify({



                    phone: phone,



                    verificationCode: verificationCode



                })



            });







            const data = await response.json();







            if (data.success) {



                this.sessionToken = data.sessionToken;



                localStorage.setItem('sessionToken', this.sessionToken);



                this.showUserInfo(data.user);



                this.showMessage('登录成功', 'success');



            } else {



                this.showMessage(data.error || '登录失败', 'error');



            }



        } catch (error) {



            console.error('Phone login failed:', error);



            this.showMessage('登录失败，请重试', 'error');



        } finally {



            this.hideLoading();



        }



    }







    async sendVerificationCode() {



        const phone = document.getElementById('phone').value;



        



        if (!phone) {



            this.showMessage('请输入手机号', 'error');



            return;



        }







        const btn = document.getElementById('sendCodeBtn');



        btn.disabled = true;



        



        // 倒计时



        let countdown = 60;



        const timer = setInterval(() => {



            btn.textContent = `${countdown}秒后重试`;



            countdown--;



            



            if (countdown < 0) {



                clearInterval(timer);



                btn.disabled = false;



                btn.textContent = '发送验证码';



            }



        }, 1000);







        // 这里应该调用发送短信验证码的API



        // 暂时模拟成功



        this.showMessage('验证码已发送（测试环境请使用：123456）', 'success');



    }







    generateWechatQR() {



        // 这里应该生成微信登录二维码



        // 暂时显示提示



        this.showMessage('微信登录功能开发中', 'error');



    }







    async logout() {



        if (!this.sessionToken) return;







        try {



            await fetch('/api/auth/logout', {



                method: 'POST',



                headers: {



                    'Authorization': `Bearer ${this.sessionToken}`



                }



            });



        } catch (error) {



            console.error('Logout failed:', error);



        }







        localStorage.removeItem('sessionToken');



        this.sessionToken = null;



        this.showLoginForm();



        this.showMessage('已退出登录', 'success');



    }







    async saveApiKey() {



        const apiKey = document.getElementById('apiKey').value;



        



        if (!apiKey) {



            this.showMessage('请输入API Key', 'error');



            return;



        }







        this.showLoading();







        try {



            const response = await fetch('/api/user/api-key', {



                method: 'PUT',



                headers: {



                    'Content-Type': 'application/json',



                    'Authorization': `Bearer ${this.sessionToken}`



                },



                body: JSON.stringify({ apiKey })



            });







            const data = await response.json();







            if (data.success) {



                this.hideApiKeyModal();



                this.showMessage('API Key 保存成功', 'success');



                // 刷新用户信息



                this.checkLoginStatus();



            } else {



                this.showMessage(data.error || 'API Key 保存失败', 'error');



            }



        } catch (error) {



            console.error('Save API key failed:', error);



            this.showMessage('保存失败，请重试', 'error');



        } finally {



            this.hideLoading();



        }



    }







    async handlePayment(method) {



        this.showLoading();







        try {



            const response = await fetch('/api/payment/create', {



                method: 'POST',



                headers: {



                    'Content-Type': 'application/json',



                    'Authorization': `Bearer ${this.sessionToken}`



                },



                body: JSON.stringify({



                    paymentMethod: method,



                    amount: 20.00



                })



            });







            const data = await response.json();







            if (data.success) {



                this.hidePaymentModal();



                this.showMessage(`${method === 'wechat' ? '微信' : '支付宝'}支付订单已创建`, 'success');



                // 这里应该跳转到支付页面或显示支付二维码



            } else {



                this.showMessage(data.error || '创建支付订单失败', 'error');



            }



        } catch (error) {



            console.error('Create payment failed:', error);



            this.showMessage('创建支付订单失败，请重试', 'error');



        } finally {



            this.hideLoading();



        }



    }







    showLoginForm() {



        document.getElementById('loginForm').style.display = 'block';



        document.getElementById('userInfo').style.display = 'none';



    }







    showUserInfo(user) {



        document.getElementById('loginForm').style.display = 'none';



        document.getElementById('userInfo').style.display = 'block';







        // 更新用户信息显示



        document.getElementById('userName').textContent = user.username || '用户';



        document.getElementById('userType').textContent = user.user_type === 'premium' ? '付费用户' : '免费用户';



        



        if (user.avatar_url) {



            document.getElementById('userAvatar').src = user.avatar_url;



        } else {



            document.getElementById('userAvatar').src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDIwQzI0LjQxODMgMjAgMjggMTYuNDE4MyAyOCAxMkMyOCA3LjU4MTcyIDI0LjQxODMgNCAyMCA0QzE1LjU4MTcgNCA0IDcuNTgxNzIgNCAxMkM0IDE2LjQxODMgMTUuNTgxNyAyMCAyMCAyMFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMCAyNEMxMi4yNjggMjQgNiAzMC4yNjggNiAzOFY0MEgzNFYzOEMzNCAzMC4yNjggMjcuNzMyIDI0IDIwIDI0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cjwvc3ZnPgo=';



        }







        if (user.premium_expires_at) {



            const expiryDate = new Date(user.premium_expires_at);



            document.getElementById('userExpiry').textContent = `到期时间：${expiryDate.toLocaleDateString()}`;



        } else {



            document.getElementById('userExpiry').textContent = '';



        }







        // 根据用户类型显示/隐藏升级按钮



        const upgradeBtn = document.getElementById('upgradeBtn');



        if (user.user_type === 'premium') {



            upgradeBtn.style.display = 'none';



        } else {



            upgradeBtn.style.display = 'block';



        }



    }







    showPaymentModal() {



        document.getElementById('paymentModal').style.display = 'block';



    }







    hidePaymentModal() {



        document.getElementById('paymentModal').style.display = 'none';



    }







    showApiKeyModal() {



        document.getElementById('apiKeyModal').style.display = 'block';



    }







    hideApiKeyModal() {



        document.getElementById('apiKeyModal').style.display = 'none';



        document.getElementById('apiKeyForm').reset();



    }







    showLoading() {



        document.getElementById('loading').style.display = 'flex';



    }







    hideLoading() {



        document.getElementById('loading').style.display = 'none';



    }







    showMessage(text, type = 'info') {



        const messageEl = document.getElementById('message');



        const messageText = document.getElementById('messageText');



        



        messageText.textContent = text;



        messageEl.className = `message ${type}`;



        messageEl.style.display = 'flex';







        // 3秒后自动隐藏



        setTimeout(() => {



            this.hideMessage();



        }, 3000);



    }







    hideMessage() {



        document.getElementById('message').style.display = 'none';



    }



}







// 页面加载完成后初始化



document.addEventListener('DOMContentLoaded', () => {



    new LoginManager();



});



=======
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

        document.getElementById('upgradeBtn').addEventListener('click', () => {

            this.showPaymentModal();

        });



        document.getElementById('apiKeyBtn').addEventListener('click', () => {

            this.showApiKeyModal();

        });



        document.getElementById('logoutBtn').addEventListener('click', () => {

            this.logout();

        });



        // 模态框关闭

        document.getElementById('closePaymentModal').addEventListener('click', () => {

            this.hidePaymentModal();

        });



        document.getElementById('closeApiKeyModal').addEventListener('click', () => {

            this.hideApiKeyModal();

        });



        // 支付方式选择

        document.querySelectorAll('.payment-btn').forEach(btn => {

            btn.addEventListener('click', (e) => {

                this.handlePayment(e.target.dataset.method);

            });

        });



        // API Key 表单

        document.getElementById('apiKeyForm').addEventListener('submit', (e) => {

            e.preventDefault();

            this.saveApiKey();

        });



        document.getElementById('cancelApiKey').addEventListener('click', () => {

            this.hideApiKeyModal();

        });



        // 消息关闭

        document.getElementById('closeMessage').addEventListener('click', () => {

            this.hideMessage();

        });



        // 点击模态框外部关闭

        window.addEventListener('click', (e) => {

            if (e.target.classList.contains('modal')) {

                e.target.style.display = 'none';

            }

        });

    }



    switchTab(tab) {

        // 更新标签按钮状态

        document.querySelectorAll('.tab-btn').forEach(btn => {

            btn.classList.remove('active');

        });

        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');



        // 更新内容显示

        document.querySelectorAll('.tab-content').forEach(content => {

            content.classList.remove('active');

        });

        document.getElementById(`${tab}Tab`).classList.add('active');

    }



    async checkLoginStatus() {

        if (!this.sessionToken) {

            this.showLoginForm();

            return;

        }



        try {

            const response = await fetch('/api/user/profile', {

                headers: {

                    'Authorization': `Bearer ${this.sessionToken}`

                }

            });



            if (response.ok) {

                const data = await response.json();

                this.showUserInfo(data.user);

            } else {

                localStorage.removeItem('sessionToken');

                this.sessionToken = null;

                this.showLoginForm();

            }

        } catch (error) {

            console.error('Check login status failed:', error);

            this.showLoginForm();

        }

    }



    async handlePhoneLogin() {

        const phone = document.getElementById('phone').value;

        const verificationCode = document.getElementById('verificationCode').value;



        if (!phone || !verificationCode) {

            this.showMessage('请填写完整信息', 'error');

            return;

        }



        this.showLoading();



        try {

            const response = await fetch('/api/auth/login/phone', {

                method: 'POST',

                headers: {

                    'Content-Type': 'application/json'

                },

                body: JSON.stringify({

                    phone: phone,

                    verificationCode: verificationCode

                })

            });



            const data = await response.json();



            if (data.success) {

                this.sessionToken = data.sessionToken;

                localStorage.setItem('sessionToken', this.sessionToken);

                this.showMessage('登录成功，正在跳转...', 'success');



                // 延迟跳转，让用户看到成功消息

                setTimeout(() => {

                    window.location.href = '/';

                }, 1000);

            } else {

                this.showMessage(data.error || '登录失败', 'error');

            }

        } catch (error) {

            console.error('Phone login failed:', error);

            this.showMessage('登录失败，请重试', 'error');

        } finally {

            this.hideLoading();

        }

    }



    async sendVerificationCode() {

        const phone = document.getElementById('phone').value;

        

        if (!phone) {

            this.showMessage('请输入手机号', 'error');

            return;

        }



        const btn = document.getElementById('sendCodeBtn');

        btn.disabled = true;

        

        // 倒计时

        let countdown = 60;

        const timer = setInterval(() => {

            btn.textContent = `${countdown}秒后重试`;

            countdown--;

            

            if (countdown < 0) {

                clearInterval(timer);

                btn.disabled = false;

                btn.textContent = '发送验证码';

            }

        }, 1000);



        // 这里应该调用发送短信验证码的API

        // 暂时模拟成功

        this.showMessage('验证码已发送（测试环境请使用：123456）', 'success');

    }



    generateWechatQR() {

        // 这里应该生成微信登录二维码

        // 暂时显示提示

        this.showMessage('微信登录功能开发中', 'error');

    }



    async logout() {

        if (!this.sessionToken) return;



        try {

            await fetch('/api/auth/logout', {

                method: 'POST',

                headers: {

                    'Authorization': `Bearer ${this.sessionToken}`

                }

            });

        } catch (error) {

            console.error('Logout failed:', error);

        }



        localStorage.removeItem('sessionToken');

        this.sessionToken = null;

        this.showLoginForm();

        this.showMessage('已退出登录', 'success');

    }



    async saveApiKey() {

        const apiKey = document.getElementById('apiKey').value;

        

        if (!apiKey) {

            this.showMessage('请输入API Key', 'error');

            return;

        }



        this.showLoading();



        try {

            const response = await fetch('/api/user/api-key', {

                method: 'PUT',

                headers: {

                    'Content-Type': 'application/json',

                    'Authorization': `Bearer ${this.sessionToken}`

                },

                body: JSON.stringify({ apiKey })

            });



            const data = await response.json();



            if (data.success) {

                this.hideApiKeyModal();

                this.showMessage('API Key 保存成功', 'success');

                // 刷新用户信息

                this.checkLoginStatus();

            } else {

                this.showMessage(data.error || 'API Key 保存失败', 'error');

            }

        } catch (error) {

            console.error('Save API key failed:', error);

            this.showMessage('保存失败，请重试', 'error');

        } finally {

            this.hideLoading();

        }

    }



    async handlePayment(method) {

        this.showLoading();



        try {

            const response = await fetch('/api/payment/create', {

                method: 'POST',

                headers: {

                    'Content-Type': 'application/json',

                    'Authorization': `Bearer ${this.sessionToken}`

                },

                body: JSON.stringify({

                    paymentMethod: method,

                    amount: 20.00

                })

            });



            const data = await response.json();



            if (data.success) {

                this.hidePaymentModal();

                this.showMessage(`${method === 'wechat' ? '微信' : '支付宝'}支付订单已创建`, 'success');

                // 这里应该跳转到支付页面或显示支付二维码

            } else {

                this.showMessage(data.error || '创建支付订单失败', 'error');

            }

        } catch (error) {

            console.error('Create payment failed:', error);

            this.showMessage('创建支付订单失败，请重试', 'error');

        } finally {

            this.hideLoading();

        }

    }



    showLoginForm() {

        document.getElementById('loginForm').style.display = 'block';

        document.getElementById('userInfo').style.display = 'none';

    }



    showUserInfo(user) {

        document.getElementById('loginForm').style.display = 'none';

        document.getElementById('userInfo').style.display = 'block';



        // 更新用户信息显示

        document.getElementById('userName').textContent = user.username || '用户';

        document.getElementById('userType').textContent = user.user_type === 'premium' ? '付费用户' : '免费用户';

        

        if (user.avatar_url) {

            document.getElementById('userAvatar').src = user.avatar_url;

        } else {

            document.getElementById('userAvatar').src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDIwQzI0LjQxODMgMjAgMjggMTYuNDE4MyAyOCAxMkMyOCA3LjU4MTcyIDI0LjQxODMgNCAyMCA0QzE1LjU4MTcgNCA0IDcuNTgxNzIgNCAxMkM0IDE2LjQxODMgMTUuNTgxNyAyMCAyMCAyMFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMCAyNEMxMi4yNjggMjQgNiAzMC4yNjggNiAzOFY0MEgzNFYzOEMzNCAzMC4yNjggMjcuNzMyIDI0IDIwIDI0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cjwvc3ZnPgo=';

        }



        if (user.premium_expires_at) {

            const expiryDate = new Date(user.premium_expires_at);

            document.getElementById('userExpiry').textContent = `到期时间：${expiryDate.toLocaleDateString()}`;

        } else {

            document.getElementById('userExpiry').textContent = '';

        }



        // 根据用户类型显示/隐藏升级按钮

        const upgradeBtn = document.getElementById('upgradeBtn');

        if (user.user_type === 'premium') {

            upgradeBtn.style.display = 'none';

        } else {

            upgradeBtn.style.display = 'block';

        }

    }



    showPaymentModal() {

        document.getElementById('paymentModal').style.display = 'block';

    }



    hidePaymentModal() {

        document.getElementById('paymentModal').style.display = 'none';

    }



    showApiKeyModal() {

        document.getElementById('apiKeyModal').style.display = 'block';

    }



    hideApiKeyModal() {

        document.getElementById('apiKeyModal').style.display = 'none';

        document.getElementById('apiKeyForm').reset();

    }



    showLoading() {

        document.getElementById('loading').style.display = 'flex';

    }



    hideLoading() {

        document.getElementById('loading').style.display = 'none';

    }



    showMessage(text, type = 'info') {

        const messageEl = document.getElementById('message');

        const messageText = document.getElementById('messageText');

        

        messageText.textContent = text;

        messageEl.className = `message ${type}`;

        messageEl.style.display = 'flex';



        // 3秒后自动隐藏

        setTimeout(() => {

            this.hideMessage();

        }, 3000);

    }



    hideMessage() {

        document.getElementById('message').style.display = 'none';

    }

}



// 页面加载完成后初始化

document.addEventListener('DOMContentLoaded', () => {

    new LoginManager();

});

>>>>>>>
