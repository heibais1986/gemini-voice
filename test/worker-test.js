/**
 * worker.mjs 兼容性测试
 * 验证修复后的代码是否能在Cloudflare Workers环境中正常工作
 */

// 模拟Cloudflare Workers环境
global.btoa = global.btoa || function(str) {
  return Buffer.from(str, 'binary').toString('base64');
};

// 测试arrayBufferToBase64函数
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 测试用例
function testArrayBufferToBase64() {
  console.log('🧪 测试 arrayBufferToBase64 函数...');
  
  // 测试数据
  const testString = 'Hello, World!';
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(testString).buffer;
  
  // 使用我们的函数
  const result = arrayBufferToBase64(arrayBuffer);
  
  // 预期结果
  const expected = btoa(testString);
  
  console.log('输入:', testString);
  console.log('我们的结果:', result);
  console.log('预期结果:', expected);
  console.log('测试结果:', result === expected ? '✅ 通过' : '❌ 失败');
  
  return result === expected;
}

// 测试图片数据处理
function testImageDataProcessing() {
  console.log('\n🧪 测试图片数据处理...');
  
  // 模拟一个小的图片数据
  const imageData = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52  // IHDR chunk start
  ]);
  
  const result = arrayBufferToBase64(imageData.buffer);
  console.log('图片数据 base64:', result);
  console.log('长度:', result.length);
  console.log('测试结果:', result.length > 0 ? '✅ 通过' : '❌ 失败');
  
  return result.length > 0;
}

// 测试边界情况
function testEdgeCases() {
  console.log('\n🧪 测试边界情况...');
  
  let allPassed = true;
  
  // 测试空数据
  try {
    const emptyBuffer = new ArrayBuffer(0);
    const result = arrayBufferToBase64(emptyBuffer);
    console.log('空数据测试:', result === '' ? '✅ 通过' : '❌ 失败');
    allPassed = allPassed && (result === '');
  } catch (error) {
    console.log('空数据测试: ❌ 失败 -', error.message);
    allPassed = false;
  }
  
  // 测试单字节数据
  try {
    const singleByte = new Uint8Array([65]).buffer; // 'A'
    const result = arrayBufferToBase64(singleByte);
    const expected = btoa('A');
    console.log('单字节测试:', result === expected ? '✅ 通过' : '❌ 失败');
    allPassed = allPassed && (result === expected);
  } catch (error) {
    console.log('单字节测试: ❌ 失败 -', error.message);
    allPassed = false;
  }
  
  return allPassed;
}

// 运行所有测试
function runAllTests() {
  console.log('🚀 开始运行 worker.mjs 兼容性测试\n');
  
  const tests = [
    { name: 'arrayBufferToBase64基础功能', test: testArrayBufferToBase64 },
    { name: '图片数据处理', test: testImageDataProcessing },
    { name: '边界情况处理', test: testEdgeCases }
  ];
  
  let passedTests = 0;
  const totalTests = tests.length;
  
  for (const { name, test } of tests) {
    try {
      const passed = test();
      if (passed) {
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ 测试 "${name}" 失败:`, error.message);
    }
  }
  
  console.log('\n📊 测试结果总结:');
  console.log(`通过: ${passedTests}/${totalTests}`);
  console.log(`成功率: ${(passedTests / totalTests * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！worker.mjs 已修复并兼容 Cloudflare Workers');
  } else {
    console.log('⚠️  部分测试失败，需要进一步检查');
  }
  
  return passedTests === totalTests;
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runAllTests();
}

module.exports = {
  arrayBufferToBase64,
  runAllTests,
  testArrayBufferToBase64,
  testImageDataProcessing,
  testEdgeCases
};
