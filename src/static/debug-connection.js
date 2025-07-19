/**
 * 首页连接功能调试脚本
 * 在浏览器控制台中运行此脚本来诊断连接问题
 */

console.log('🔧 开始连接功能调试...');

// 检查关键元素
function checkElements() {
    console.log('🔍 检查页面元素:');
    
    const connectButton = document.getElementById('connect-button');
    console.log('  - 连接按钮:', connectButton);
    if (connectButton) {
        console.log('    - 文本:', connectButton.textContent);
        console.log('    - 是否禁用:', connectButton.disabled);
        console.log('    - 事件监听器数量:', connectButton._listeners ? Object.keys(connectButton._listeners).length : '无法检查');
    }
    
    const apiKeyInput = document.getElementById('api-key');
    console.log('  - API Key输入框:', apiKeyInput);
    if (apiKeyInput) {
        console.log('    - 值:', apiKeyInput.value ? '已输入' : '未输入');
        console.log('    - 显示状态:', window.getComputedStyle(apiKeyInput).display);
    }
    
    console.log('  - userAuth:', window.userAuth);
    if (window.userAuth) {
        console.log('    - 认证状态:', window.userAuth.isAuthenticated);
        console.log('    - 当前用户:', window.userAuth.currentUser);
    }
    
    console.log('  - connectToWebsocketWithAuth函数:', window.connectToWebsocketWithAuth);
    console.log('  - isConnected:', window.isConnected);
}

// 手动触发连接
function manualConnect() {
    console.log('🚀 手动触发连接...');
    
    if (!window.userAuth) {
        console.error('❌ userAuth未找到');
        return;
    }
    
    if (!window.userAuth.isAuthenticated) {
        console.error('❌ 用户未认证');
        return;
    }
    
    const apiKeyInput = document.getElementById('api-key');
    if (!apiKeyInput) {
        console.error('❌ API Key输入框未找到');
        return;
    }
    
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        console.error('❌ API Key未输入');
        return;
    }
    
    console.log('✅ 前置条件检查通过，尝试连接...');
    
    if (window.connectToWebsocketWithAuth) {
        window.connectToWebsocketWithAuth();
    } else {
        console.error('❌ connectToWebsocketWithAuth函数未找到');
    }
}

// 模拟点击连接按钮
function simulateClick() {
    console.log('🖱️ 模拟点击连接按钮...');
    
    const connectButton = document.getElementById('connect-button');
    if (!connectButton) {
        console.error('❌ 连接按钮未找到');
        return;
    }
    
    console.log('✅ 找到连接按钮，触发点击事件');
    connectButton.click();
}

// 检查事件监听器
function checkEventListeners() {
    console.log('🎧 检查事件监听器...');
    
    const connectButton = document.getElementById('connect-button');
    if (!connectButton) {
        console.error('❌ 连接按钮未找到');
        return;
    }
    
    // 尝试获取事件监听器信息
    const listeners = getEventListeners ? getEventListeners(connectButton) : null;
    if (listeners) {
        console.log('📋 事件监听器:', listeners);
    } else {
        console.log('⚠️ 无法获取事件监听器信息（需要在开发者工具中运行）');
    }
    
    // 检查是否有click事件
    console.log('🔍 检查click事件绑定...');
    
    // 临时添加一个测试监听器
    const testHandler = () => {
        console.log('🎯 测试事件监听器被触发');
    };
    
    connectButton.addEventListener('click', testHandler);
    console.log('✅ 已添加测试事件监听器');
    
    // 触发点击
    connectButton.click();
    
    // 移除测试监听器
    connectButton.removeEventListener('click', testHandler);
    console.log('🗑️ 已移除测试事件监听器');
}

// 检查模块加载状态
function checkModuleLoading() {
    console.log('📦 检查模块加载状态...');
    
    // 检查关键的全局变量
    const globalVars = [
        'userAuth',
        'connectToWebsocketWithAuth',
        'connectButton',
        'apiKeyInput',
        'isConnected'
    ];
    
    globalVars.forEach(varName => {
        const value = window[varName];
        console.log(`  - window.${varName}:`, value ? '存在' : '不存在');
    });
    
    // 检查main.js是否加载
    const scripts = document.querySelectorAll('script[src*="main.js"]');
    console.log('📜 main.js脚本标签:', scripts.length > 0 ? '找到' : '未找到');
    
    if (scripts.length > 0) {
        scripts.forEach((script, index) => {
            console.log(`  - 脚本${index + 1}:`, script.src);
            console.log(`    - 类型:`, script.type);
        });
    }
}

// 运行所有检查
function runAllChecks() {
    console.log('🔍 运行完整诊断...');
    console.log('='.repeat(50));
    
    checkModuleLoading();
    console.log('-'.repeat(30));
    
    checkElements();
    console.log('-'.repeat(30));
    
    checkEventListeners();
    console.log('-'.repeat(30));
    
    console.log('✅ 诊断完成');
    console.log('💡 可用的调试函数:');
    console.log('  - checkElements() - 检查页面元素');
    console.log('  - manualConnect() - 手动触发连接');
    console.log('  - simulateClick() - 模拟点击连接按钮');
    console.log('  - checkEventListeners() - 检查事件监听器');
    console.log('  - runAllChecks() - 运行所有检查');
}

// 暴露调试函数到全局
window.debugConnection = {
    checkElements,
    manualConnect,
    simulateClick,
    checkEventListeners,
    checkModuleLoading,
    runAllChecks
};

// 自动运行初始检查
runAllChecks();
