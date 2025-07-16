<<<<<<<
/**



 * 支付服务



 * 处理微信支付和支付宝支付



 */







import { Database } from './database.js';



import { generateOrderNo } from './utils.js';







export class PaymentService {



  constructor(db, env) {



    this.database = new Database(db);



    this.env = env;



  }







  /**



   * 创建支付订单



   */



  async createPaymentOrder(userId, paymentMethod, amount = 20.00) {



    try {



      const orderNo = generateOrderNo();



      const productDuration = parseInt(await this.database.getConfig('premium_duration_days') || '365');



      const expiresAt = new Date(Date.now() + productDuration * 24 * 60 * 60 * 1000);







      const order = await this.database.createPaymentOrder({



        user_id: userId,



        order_no: orderNo,



        amount: amount,



        payment_method: paymentMethod,



        product_type: 'premium_yearly',



        product_duration: productDuration,



        expires_at: expiresAt.toISOString()



      });







      return {



        success: true,



        order: order



      };



    } catch (error) {



      return {



        success: false,



        error: error.message



      };



    }



  }







  /**



   * 创建微信支付订单



   */



  async createWechatPayOrder(userId, amount = 20.00) {



    try {



      // 创建内部订单



      const orderResult = await this.createPaymentOrder(userId, 'wechat', amount);



      if (!orderResult.success) {



        return orderResult;



      }







      const order = orderResult.order;







      // 调用微信支付API创建预支付订单



      const wechatOrder = await this.createWechatPrePayOrder(order);







      if (wechatOrder.success) {



        // 更新订单的第三方订单ID



        await this.database.updatePaymentOrder(order.id, {



          third_party_order_id: wechatOrder.prepay_id



        });







        return {



          success: true,



          order: order,



          paymentData: wechatOrder.paymentData



        };



      } else {



        return {



          success: false,



          error: wechatOrder.error



        };



      }



    } catch (error) {



      return {



        success: false,



        error: error.message



      };



    }



  }







  /**



   * 创建支付宝支付订单



   */



  async createAlipayOrder(userId, amount = 20.00) {



    try {



      // 创建内部订单



      const orderResult = await this.createPaymentOrder(userId, 'alipay', amount);



      if (!orderResult.success) {



        return orderResult;



      }







      const order = orderResult.order;







      // 调用支付宝API创建支付订单



      const alipayOrder = await this.createAlipayPreOrder(order);







      if (alipayOrder.success) {



        // 更新订单的第三方订单ID



        await this.database.updatePaymentOrder(order.id, {



          third_party_order_id: alipayOrder.trade_no



        });







        return {



          success: true,



          order: order,



          paymentData: alipayOrder.paymentData



        };



      } else {



        return {



          success: false,



          error: alipayOrder.error



        };



      }



    } catch (error) {



      return {



        success: false,



        error: error.message



      };



    }



  }







  /**



   * 创建微信预支付订单



   */



  async createWechatPrePayOrder(order) {



    try {



      // 这里应该调用微信支付API



      // 由于微信支付API比较复杂，这里提供一个简化的示例



      



      const paymentData = {



        appId: this.env.WECHAT_APP_ID,



        timeStamp: Math.floor(Date.now() / 1000).toString(),



        nonceStr: this.generateNonceStr(),



        package: `prepay_id=wx${order.order_no}`,



        signType: 'MD5'



      };







      // 生成签名



      paymentData.paySign = this.generateWechatPaySign(paymentData);







      return {



        success: true,



        prepay_id: `wx${order.order_no}`,



        paymentData: paymentData



      };



    } catch (error) {



      return {



        success: false,



        error: error.message



      };



    }



  }







  /**



   * 创建支付宝预支付订单



   */



  async createAlipayPreOrder(order) {



    try {



      // 这里应该调用支付宝API



      // 提供一个简化的示例



      



      const paymentData = {



        app_id: this.env.ALIPAY_APP_ID,



        method: 'alipay.trade.app.pay',



        charset: 'utf-8',



        sign_type: 'RSA2',



        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),



        version: '1.0',



        biz_content: JSON.stringify({



          out_trade_no: order.order_no,



          total_amount: order.amount.toString(),



          subject: 'Gemini Playground 年费会员',



          product_code: 'QUICK_MSECURITY_PAY'



        })



      };







      // 生成签名



      paymentData.sign = this.generateAlipaySign(paymentData);







      return {



        success: true,



        trade_no: `alipay${order.order_no}`,



        paymentData: paymentData



      };



    } catch (error) {



      return {



        success: false,



        error: error.message



      };



    }



  }







  /**



   * 处理支付回调



   */



  async handlePaymentCallback(paymentMethod, callbackData) {



    try {



      let orderNo, paymentStatus;







      if (paymentMethod === 'wechat') {



        // 验证微信支付回调



        const isValid = this.verifyWechatCallback(callbackData);



        if (!isValid) {



          return { success: false, error: 'Invalid wechat callback' };



        }



        



        orderNo = callbackData.out_trade_no;



        paymentStatus = callbackData.result_code === 'SUCCESS' ? 'paid' : 'failed';



      } else if (paymentMethod === 'alipay') {



        // 验证支付宝回调



        const isValid = this.verifyAlipayCallback(callbackData);



        if (!isValid) {



          return { success: false, error: 'Invalid alipay callback' };



        }



        



        orderNo = callbackData.out_trade_no;



        paymentStatus = callbackData.trade_status === 'TRADE_SUCCESS' ? 'paid' : 'failed';



      } else {



        return { success: false, error: 'Unknown payment method' };



      }







      // 查找订单



      const order = await this.database.getPaymentOrderByOrderNo(orderNo);



      if (!order) {



        return { success: false, error: 'Order not found' };



      }







      // 更新订单状态



      const updateData = {



        payment_status: paymentStatus



      };







      if (paymentStatus === 'paid') {



        updateData.paid_at = new Date().toISOString();



        



        // 升级用户为付费用户



        await this.database.upgradeToPremium(order.user_id, order.expires_at);



      }







      await this.database.updatePaymentOrder(order.id, updateData);







      return {



        success: true,



        order: order,



        paymentStatus: paymentStatus



      };



    } catch (error) {



      return {



        success: false,



        error: error.message



      };



    }



  }







  /**



   * 查询订单状态



   */



  async queryOrderStatus(orderNo) {



    try {



      const order = await this.database.getPaymentOrderByOrderNo(orderNo);



      if (!order) {



        return { success: false, error: 'Order not found' };



      }







      return {



        success: true,



        order: order



      };



    } catch (error) {



      return {



        success: false,



        error: error.message



      };



    }



  }







  /**



   * 生成随机字符串



   */



  generateNonceStr(length = 32) {



    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';



    let result = '';



    for (let i = 0; i < length; i++) {



      result += chars.charAt(Math.floor(Math.random() * chars.length));



    }



    return result;



  }







  /**



   * 生成微信支付签名



   */



  generateWechatPaySign(params) {



    // 这里应该实现真正的微信支付签名算法



    // 暂时返回一个模拟签名



    return 'mock_wechat_sign';



  }







  /**



   * 生成支付宝签名



   */



  generateAlipaySign(params) {



    // 这里应该实现真正的支付宝签名算法



    // 暂时返回一个模拟签名



    return 'mock_alipay_sign';



  }







  /**



   * 验证微信支付回调



   */



  verifyWechatCallback(callbackData) {



    // 这里应该验证微信支付回调的签名



    // 暂时返回true



    return true;



  }







  /**



   * 验证支付宝回调



   */



  verifyAlipayCallback(callbackData) {



    // 这里应该验证支付宝回调的签名



    // 暂时返回true



    return true;



  }



}



=======
/**

 * 支付服务

 * 处理微信支付和支付宝支付

 */



import { Database } from './database.js';

import { generateOrderNo } from './utils.js';



export class PaymentService {

  constructor(db, env) {

    this.database = new Database(db);

    this.env = env;

  }



  /**

   * 创建支付订单

   */

  async createPaymentOrder(userId, paymentMethod, amount = 20.00) {

    try {

      const orderNo = generateOrderNo();

      const productDuration = parseInt(await this.database.getConfig('premium_duration_days') || '365');

      const expiresAt = new Date(Date.now() + productDuration * 24 * 60 * 60 * 1000);



      const order = await this.database.createPaymentOrder({

        user_id: userId,

        order_no: orderNo,

        amount: amount,

        payment_method: paymentMethod,

        product_type: 'premium_yearly',

        product_duration: productDuration,

        expires_at: expiresAt.toISOString()

      });



      return {

        success: true,

        order: order

      };

    } catch (error) {

      return {

        success: false,

        error: error.message

      };

    }

  }



  /**

   * 创建微信支付订单

   */

  async createWechatPayOrder(userId, amount = 20.00) {

    try {

      // 创建内部订单

      const orderResult = await this.createPaymentOrder(userId, 'wechat', amount);

      if (!orderResult.success) {

        return orderResult;

      }



      const order = orderResult.order;



      // 调用微信支付API创建预支付订单

      const wechatOrder = await this.createWechatPrePayOrder(order);



      if (wechatOrder.success) {

        // 更新订单的第三方订单ID

        await this.database.updatePaymentOrder(order.id, {

          third_party_order_id: wechatOrder.prepay_id

        });



        return {

          success: true,

          order: order,

          paymentData: wechatOrder.paymentData

        };

      } else {

        return {

          success: false,

          error: wechatOrder.error

        };

      }

    } catch (error) {

      return {

        success: false,

        error: error.message

      };

    }

  }



  /**

   * 创建支付宝支付订单

   */

  async createAlipayOrder(userId, amount = 20.00) {

    try {

      // 创建内部订单

      const orderResult = await this.createPaymentOrder(userId, 'alipay', amount);

      if (!orderResult.success) {

        return orderResult;

      }



      const order = orderResult.order;



      // 调用支付宝API创建支付订单

      const alipayOrder = await this.createAlipayPreOrder(order);



      if (alipayOrder.success) {

        // 更新订单的第三方订单ID

        await this.database.updatePaymentOrder(order.id, {

          third_party_order_id: alipayOrder.trade_no

        });



        return {

          success: true,

          order: order,

          paymentData: alipayOrder.paymentData

        };

      } else {

        return {

          success: false,

          error: alipayOrder.error

        };

      }

    } catch (error) {

      return {

        success: false,

        error: error.message

      };

    }

  }



  /**

   * 创建微信预支付订单

   */

  async createWechatPrePayOrder(order) {

    try {

      // 这里应该调用微信支付API

      // 由于微信支付API比较复杂，这里提供一个简化的示例

      

      const paymentData = {

        appId: this.env.WECHAT_APP_ID,

        timeStamp: Math.floor(Date.now() / 1000).toString(),

        nonceStr: this.generateNonceStr(),

        package: `prepay_id=wx${order.order_no}`,

        signType: 'MD5'

      };



      // 生成签名

      paymentData.paySign = this.generateWechatPaySign(paymentData);



      return {

        success: true,

        prepay_id: `wx${order.order_no}`,

        paymentData: paymentData

      };

    } catch (error) {

      return {

        success: false,

        error: error.message

      };

    }

  }



  /**

   * 创建支付宝预支付订单

   */

  async createAlipayPreOrder(order) {

    try {

      // 这里应该调用支付宝API

      // 提供一个简化的示例

      

      const paymentData = {

        app_id: this.env.ALIPAY_APP_ID,

        method: 'alipay.trade.app.pay',

        charset: 'utf-8',

        sign_type: 'RSA2',

        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),

        version: '1.0',

        biz_content: JSON.stringify({

          out_trade_no: order.order_no,

          total_amount: order.amount.toString(),

          subject: 'Gemini Playground 年费会员',

          product_code: 'QUICK_MSECURITY_PAY'

        })

      };



      // 生成签名

      paymentData.sign = this.generateAlipaySign(paymentData);



      return {

        success: true,

        trade_no: `alipay${order.order_no}`,

        paymentData: paymentData

      };

    } catch (error) {

      return {

        success: false,

        error: error.message

      };

    }

  }



  /**

   * 处理支付回调

   */

  async handlePaymentCallback(paymentMethod, callbackData) {

    try {

      let orderNo, paymentStatus;



      if (paymentMethod === 'wechat') {

        // 验证微信支付回调

        const isValid = this.verifyWechatCallback(callbackData);

        if (!isValid) {

          return { success: false, error: 'Invalid wechat callback' };

        }

        

        orderNo = callbackData.out_trade_no;

        paymentStatus = callbackData.result_code === 'SUCCESS' ? 'paid' : 'failed';

      } else if (paymentMethod === 'alipay') {

        // 验证支付宝回调

        const isValid = this.verifyAlipayCallback(callbackData);

        if (!isValid) {

          return { success: false, error: 'Invalid alipay callback' };

        }

        

        orderNo = callbackData.out_trade_no;

        paymentStatus = callbackData.trade_status === 'TRADE_SUCCESS' ? 'paid' : 'failed';

      } else {

        return { success: false, error: 'Unknown payment method' };

      }



      // 查找订单

      const order = await this.database.getPaymentOrderByOrderNo(orderNo);

      if (!order) {

        return { success: false, error: 'Order not found' };

      }



      // 更新订单状态

      const updateData = {

        payment_status: paymentStatus

      };



      if (paymentStatus === 'paid') {

        updateData.paid_at = new Date().toISOString();

        

        // 升级用户为付费用户

        await this.database.upgradeToPremium(order.user_id, order.expires_at);

      }



      await this.database.updatePaymentOrder(order.id, updateData);



      return {

        success: true,

        order: order,

        paymentStatus: paymentStatus

      };

    } catch (error) {

      return {

        success: false,

        error: error.message

      };

    }

  }



  /**

   * 查询订单状态

   */

  async queryOrderStatus(orderNo) {

    try {

      const order = await this.database.getPaymentOrderByOrderNo(orderNo);

      if (!order) {

        return { success: false, error: 'Order not found' };

      }



      return {

        success: true,

        order: order

      };

    } catch (error) {

      return {

        success: false,

        error: error.message

      };

    }

  }



  /**

   * 生成随机字符串

   */

  generateNonceStr(length = 32) {

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let result = '';

    for (let i = 0; i < length; i++) {

      result += chars.charAt(Math.floor(Math.random() * chars.length));

    }

    return result;

  }



  /**

   * 生成微信支付签名

   */

  generateWechatPaySign(params) {

    // 这里应该实现真正的微信支付签名算法

    // 暂时返回一个模拟签名

    return 'mock_wechat_sign';

  }



  /**

   * 生成支付宝签名

   */

  generateAlipaySign(params) {

    // 这里应该实现真正的支付宝签名算法

    // 暂时返回一个模拟签名

    return 'mock_alipay_sign';

  }



  /**

   * 验证微信支付回调

   */

  verifyWechatCallback(callbackData) {

    // 这里应该验证微信支付回调的签名

    // 暂时返回true

    return true;

  }



  /**

   * 验证支付宝回调

   */

  verifyAlipayCallback(callbackData) {

    // 这里应该验证支付宝回调的签名

    // 暂时返回true

    return true;

  }

}

>>>>>>>
