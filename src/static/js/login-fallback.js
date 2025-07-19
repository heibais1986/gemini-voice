/**
 * 备用登录检查脚本
 * 当main.js模块加载失败时使用
 */

(function() {
    'use strict';
    
    console.log('🔧 备用登录检查脚本开始执行...');
    
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoginCheck);
    } else {
        initLoginCheck();
    }
    
    function initLoginCheck() {
        console.log('🔍 备用脚本：检查登录状态...');
        
        const loginOverlay = document.getElementById('login-overlay');
        if (!loginOverlay) {
            console.error('❌ 备用脚本：找不到登录遮罩元素');
            return;
        }
        
        console.log('✅ 备用脚本：找到登录遮罩元素');
        
        // 检查会话令牌
        const sessionToken = getSessionToken();
        console.log('🎫 备用脚本：会话令牌', sessionToken ? '存在' : '不存在');
        
        if (!sessionToken) {
            showLoginOverlay();
        } else {
            // 验证令牌有效性
            validateToken(sessionToken).then(isValid => {
                if (!isValid) {
                    showLoginOverlay();
                } else {
                    hideLoginOverlay();
                }
            }).catch(error => {
                console.error('❌ 备用脚本：令牌验证失败', error);
                showLoginOverlay();
            });
        }
        
        // 绑定登录按钮事件
        const goLoginBtn = document.getElementById('go-login');
        if (goLoginBtn) {
            goLoginBtn.addEventListener('click', function() {
                console.log('🔗 备用脚本：跳转到登录页面');
                window.location.href = '/login.html';
            });
        }
    }
    
    function getSessionToken() {
        // 从localStorage获取
        let token = localStorage.getItem('sessionToken');
        if (token) return token;
        
        // 从Cookie获取
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'sessionToken') {
                return decodeURIComponent(value);
            }
        }
        
        return null;
    }
    
    function showLoginOverlay() {
        console.log('🔓 备用脚本：显示登录遮罩');
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            // 移除隐藏类，添加显示类
            overlay.classList.remove('force-hide');
            overlay.classList.add('force-show');

            // 同时设置内联样式作为备用
            overlay.style.display = 'flex';
            overlay.style.visibility = 'visible';
            overlay.style.opacity = '1';
            overlay.style.zIndex = '10000';

            console.log('✅ 备用脚本：登录遮罩已显示');
            console.log('📏 备用脚本：遮罩类名:', overlay.className);
        }
    }

    function hideLoginOverlay() {
        console.log('🔒 备用脚本：隐藏登录遮罩');
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            // 移除显示类，添加隐藏类
            overlay.classList.remove('force-show');
            overlay.classList.add('force-hide');

            // 同时设置内联样式作为备用
            overlay.style.display = 'none';

            console.log('✅ 备用脚本：登录遮罩已隐藏');
        }
    }
    
    async function validateToken(token) {
        try {
            console.log('🔍 备用脚本：验证令牌...');
            const response = await fetch('/api/user/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📡 备用脚本：API响应状态:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ 备用脚本：令牌验证成功');
                return data.success === true;
            }

            console.log('❌ 备用脚本：令牌验证失败');
            return false;
        } catch (error) {
            console.error('备用脚本：令牌验证请求失败', error);
            return false;
        }
    }
    
})();
