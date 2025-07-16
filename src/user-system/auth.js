<<<<<<<




/**















 * 用户认证服务















 * 处理登录、注册、会话管理等功能















 */































import { Database } from './database.js';















import { generateSessionToken, generateOrderNo } from './utils.js';































export class AuthService {















  constructor(db, env) {















    this.database = new Database(db);















    this.env = env;















  }































  /**















   * 手机号登录/注册















   */















  async loginWithPhone(phone, verificationCode, ipAddress, userAgent) {















    try {















      // 这里应该验证短信验证码，暂时跳过















      // await this.verifyPhoneCode(phone, verificationCode);































      let user = await this.database.getUserByPhone(phone);















      















      if (!user) {















        // 新用户注册















        user = await this.database.createUser({















          phone: phone,















          username: `用户${phone.slice(-4)}`, // 默认用户名















          wechat_openid: null,















          wechat_unionid: null,















          avatar_url: null,















          email: null















        });















      }































      // 更新最后登录时间















      await this.database.updateLastLogin(user.id);































      // 创建会话















      const sessionToken = generateSessionToken();















      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天过期















      















      await this.database.createSession(















        user.id,















        sessionToken,















        expiresAt.toISOString(),















        ipAddress,















        userAgent















      );































      // 记录登录日志















      await this.database.logLogin(user.id, 'phone', ipAddress, userAgent, 'success');































      return {















        success: true,















        user: this.sanitizeUser(user),















        sessionToken,















        expiresAt















      };















    } catch (error) {















      // 记录失败日志















      const user = await this.database.getUserByPhone(phone);















      if (user) {















        await this.database.logLogin(user.id, 'phone', ipAddress, userAgent, 'failed', error.message);















      }















      















      return {















        success: false,















        error: error.message















      };















    }















  }































  /**















   * 微信登录















   */















  async loginWithWechat(code, ipAddress, userAgent) {















    try {















      // 通过code获取微信用户信息















      const wechatUserInfo = await this.getWechatUserInfo(code);















      















      let user = await this.database.getUserByWechatOpenId(wechatUserInfo.openid);















      















      if (!user) {















        // 新用户注册















        user = await this.database.createUser({















          phone: null,















          wechat_openid: wechatUserInfo.openid,















          wechat_unionid: wechatUserInfo.unionid || null,















          username: wechatUserInfo.nickname || '微信用户',















          avatar_url: wechatUserInfo.headimgurl || null,















          email: null















        });















      } else {















        // 更新用户信息（头像、昵称可能会变）















        await this.database.updateUser(user.id, {















          username: wechatUserInfo.nickname || user.username,















          avatar_url: wechatUserInfo.headimgurl || user.avatar_url,















          wechat_unionid: wechatUserInfo.unionid || user.wechat_unionid















        });















        user = await this.database.getUserById(user.id);















      }































      // 更新最后登录时间















      await this.database.updateLastLogin(user.id);































      // 创建会话















      const sessionToken = generateSessionToken();















      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天过期















      















      await this.database.createSession(















        user.id,















        sessionToken,















        expiresAt.toISOString(),















        ipAddress,















        userAgent















      );































      // 记录登录日志















      await this.database.logLogin(user.id, 'wechat', ipAddress, userAgent, 'success');































      return {















        success: true,















        user: this.sanitizeUser(user),















        sessionToken,















        expiresAt















      };















    } catch (error) {















      return {















        success: false,















        error: error.message















      };















    }















  }































  /**















   * 通过微信code获取用户信息















   */















  async getWechatUserInfo(code) {















    // 第一步：通过code获取access_token















    const tokenResponse = await fetch(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.env.WECHAT_APP_ID}&secret=${this.env.WECHAT_APP_SECRET}&code=${code}&grant_type=authorization_code`);















    const tokenData = await tokenResponse.json();















    















    if (tokenData.errcode) {















      throw new Error(`微信登录失败: ${tokenData.errmsg}`);















    }































    // 第二步：通过access_token获取用户信息















    const userResponse = await fetch(`https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`);















    const userData = await userResponse.json();















    















    if (userData.errcode) {















      throw new Error(`获取微信用户信息失败: ${userData.errmsg}`);















    }































    return userData;















  }































  /**















   * 验证会话















   */















  async validateSession(sessionToken) {















    if (!sessionToken) {















      return { valid: false, error: 'No session token provided' };















    }































    try {















      const session = await this.database.getSessionByToken(sessionToken);















      















      if (!session) {















        return { valid: false, error: 'Invalid session token' };















      }































      return {















        valid: true,















        user: this.sanitizeUser(session)















      };















    } catch (error) {















      return { valid: false, error: error.message };















    }















  }































  /**















   * 登出















   */















  async logout(sessionToken) {















    try {















      await this.database.deleteSession(sessionToken);















      return { success: true };















    } catch (error) {















      return { success: false, error: error.message };















    }















  }































  /**















   * 更新用户API Key















   */















  async updateUserApiKey(userId, apiKey) {















    try {















      // 这里应该加密存储API Key















      const encryptedApiKey = this.encryptApiKey(apiKey);















      















      const success = await this.database.updateUser(userId, {















        api_key: encryptedApiKey















      });































      return { success };















    } catch (error) {















      return { success: false, error: error.message };















    }















  }































  /**















   * 获取用户的API Key（解密）















   */















  async getUserApiKey(userId) {















    try {















      const user = await this.database.getUserById(userId);















      if (!user || !user.api_key) {















        return null;















      }































      return this.decryptApiKey(user.api_key);















    } catch (error) {















      console.error('Failed to get user API key:', error);















      return null;















    }















  }































  /**















   * 检查用户权限















   */















  async checkUserPermission(userId) {















    try {















      const isPremium = await this.database.isPremiumUser(userId);















      const todayUsage = await this.database.getTodayApiUsage(userId);















      















      const maxCalls = isPremium ? 















        parseInt(await this.database.getConfig('max_daily_api_calls_premium') || '10000') :















        parseInt(await this.database.getConfig('max_daily_api_calls_free') || '100');































      return {















        isPremium,















        dailyUsage: todayUsage.api_calls,















        dailyLimit: maxCalls,















        canUseApi: todayUsage.api_calls < maxCalls















      };















    } catch (error) {















      return {















        isPremium: false,















        dailyUsage: 0,















        dailyLimit: 0,















        canUseApi: false















      };















    }















  }































  /**















   * 清理用户敏感信息















   */















  sanitizeUser(user) {















    const { api_key, ...sanitizedUser } = user;















    return sanitizedUser;















  }































  /**















   * 加密API Key















   */















  encryptApiKey(apiKey) {















    // 这里应该使用真正的加密算法，比如AES















    // 暂时使用简单的Base64编码作为示例















    return btoa(apiKey);















  }































  /**















   * 解密API Key















   */















  decryptApiKey(encryptedApiKey) {















    // 对应的解密算法















    try {















      return atob(encryptedApiKey);















    } catch (error) {















      console.error('Failed to decrypt API key:', error);















      return null;















    }















  }































  /**















   * 清理过期会话















   */















  async cleanupExpiredSessions() {















    try {















      await this.database.cleanExpiredSessions();















    } catch (error) {















      console.error('Failed to cleanup expired sessions:', error);















    }















  }















}















=======



/**







 * 用户认证服务







 * 处理登录、注册、会话管理等功能







 */















import { Database } from './database.js';







import { generateSessionToken, generateOrderNo } from './utils.js';















export class AuthService {







  constructor(db, env) {







    this.database = new Database(db);







    this.env = env;







  }















  /**







   * 手机号登录/注册







   */







  async loginWithPhone(phone, verificationCode, ipAddress, userAgent) {







    try {







      // 这里应该验证短信验证码，暂时跳过







      // await this.verifyPhoneCode(phone, verificationCode);















      let user = await this.database.getUserByPhone(phone);







      







      if (!user) {







        // 新用户注册







        user = await this.database.createUser({







          phone: phone,







          username: `用户${phone.slice(-4)}`, // 默认用户名







          wechat_openid: null,







          wechat_unionid: null,







          avatar_url: null,







          email: null







        });







      }















      // 更新最后登录时间







      await this.database.updateLastLogin(user.id);















      // 创建会话







      const sessionToken = generateSessionToken();







      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天过期







      







      await this.database.createSession(







        user.id,







        sessionToken,







        expiresAt.toISOString(),







        ipAddress,







        userAgent







      );















      // 记录登录日志







      await this.database.logLogin(user.id, 'phone', ipAddress, userAgent, 'success');















      return {







        success: true,







        user: this.sanitizeUser(user),







        sessionToken,







        expiresAt







      };







    } catch (error) {







      // 记录失败日志







      const user = await this.database.getUserByPhone(phone);







      if (user) {







        await this.database.logLogin(user.id, 'phone', ipAddress, userAgent, 'failed', error.message);







      }







      







      return {







        success: false,







        error: error.message







      };







    }







  }















  /**







   * 微信登录







   */







  async loginWithWechat(code, ipAddress, userAgent) {







    try {







      // 通过code获取微信用户信息







      const wechatUserInfo = await this.getWechatUserInfo(code);







      







      let user = await this.database.getUserByWechatOpenId(wechatUserInfo.openid);







      







      if (!user) {







        // 新用户注册







        user = await this.database.createUser({







          phone: null,







          wechat_openid: wechatUserInfo.openid,







          wechat_unionid: wechatUserInfo.unionid || null,







          username: wechatUserInfo.nickname || '微信用户',







          avatar_url: wechatUserInfo.headimgurl || null,







          email: null







        });







      } else {







        // 更新用户信息（头像、昵称可能会变）







        await this.database.updateUser(user.id, {







          username: wechatUserInfo.nickname || user.username,







          avatar_url: wechatUserInfo.headimgurl || user.avatar_url,







          wechat_unionid: wechatUserInfo.unionid || user.wechat_unionid







        });







        user = await this.database.getUserById(user.id);







      }















      // 更新最后登录时间







      await this.database.updateLastLogin(user.id);















      // 创建会话







      const sessionToken = generateSessionToken();







      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天过期







      







      await this.database.createSession(







        user.id,







        sessionToken,







        expiresAt.toISOString(),







        ipAddress,







        userAgent







      );















      // 记录登录日志







      await this.database.logLogin(user.id, 'wechat', ipAddress, userAgent, 'success');















      return {







        success: true,







        user: this.sanitizeUser(user),







        sessionToken,







        expiresAt







      };







    } catch (error) {







      return {







        success: false,







        error: error.message







      };







    }







  }















  /**







   * 通过微信code获取用户信息







   */







  async getWechatUserInfo(code) {







    // 第一步：通过code获取access_token







    const tokenResponse = await fetch(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.env.WECHAT_APP_ID}&secret=${this.env.WECHAT_APP_SECRET}&code=${code}&grant_type=authorization_code`);







    const tokenData = await tokenResponse.json();







    







    if (tokenData.errcode) {







      throw new Error(`微信登录失败: ${tokenData.errmsg}`);







    }















    // 第二步：通过access_token获取用户信息







    const userResponse = await fetch(`https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`);







    const userData = await userResponse.json();







    







    if (userData.errcode) {







      throw new Error(`获取微信用户信息失败: ${userData.errmsg}`);







    }















    return userData;







  }















  /**







   * 验证会话







   */







  async validateSession(sessionToken) {







    if (!sessionToken) {







      return { valid: false, error: 'No session token provided' };







    }















    try {







      const session = await this.database.getSessionByToken(sessionToken);







      







      if (!session) {







        return { valid: false, error: 'Invalid session token' };







      }















      return {







        valid: true,







        user: this.sanitizeUser(session)







      };







    } catch (error) {







      return { valid: false, error: error.message };







    }







  }















  /**







   * 登出







   */







  async logout(sessionToken) {







    try {







      await this.database.deleteSession(sessionToken);







      return { success: true };







    } catch (error) {







      return { success: false, error: error.message };







    }







  }















  /**







   * 更新用户API Key







   */







  async updateUserApiKey(userId, apiKey) {







    try {







      // 这里应该加密存储API Key







      const encryptedApiKey = this.encryptApiKey(apiKey);







      







      const success = await this.database.updateUser(userId, {







        api_key: encryptedApiKey







      });















      return { success };







    } catch (error) {







      return { success: false, error: error.message };







    }







  }















  /**







   * 获取用户的API Key（解密）







   */







  async getUserApiKey(userId) {







    try {







      const user = await this.database.getUserById(userId);







      if (!user || !user.api_key) {







        return null;







      }















      return this.decryptApiKey(user.api_key);







    } catch (error) {







      console.error('Failed to get user API key:', error);







      return null;







    }







  }















  /**







   * 检查用户权限







   */







  async checkUserPermission(userId) {







    try {







      const isPremium = await this.database.isPremiumUser(userId);







      const todayUsage = await this.database.getTodayApiUsage(userId);







      







      const maxCalls = isPremium ? 







        parseInt(await this.database.getConfig('max_daily_api_calls_premium') || '10000') :







        parseInt(await this.database.getConfig('max_daily_api_calls_free') || '100');















      return {







        isPremium,







        dailyUsage: todayUsage.api_calls,







        dailyLimit: maxCalls,







        canUseApi: todayUsage.api_calls < maxCalls







      };







    } catch (error) {







      return {







        isPremium: false,







        dailyUsage: 0,







        dailyLimit: 0,







        canUseApi: false







      };







    }







  }















  /**







   * 清理用户敏感信息







   */







  sanitizeUser(user) {







    const { api_key, ...sanitizedUser } = user;







    return sanitizedUser;







  }















  /**







   * 加密API Key







   */







  encryptApiKey(apiKey) {







    // 这里应该使用真正的加密算法，比如AES







    // 暂时使用简单的Base64编码作为示例







    return btoa(apiKey);







  }















  /**







   * 解密API Key







   */







  decryptApiKey(encryptedApiKey) {







    // 对应的解密算法







    try {







      return atob(encryptedApiKey);







    } catch (error) {







      console.error('Failed to decrypt API key:', error);







      return null;







    }







  }















  /**







   * 清理过期会话







   */







  async cleanupExpiredSessions() {







    try {







      await this.database.cleanExpiredSessions();







    } catch (error) {







      console.error('Failed to cleanup expired sessions:', error);







    }







  }







}







>>>>>>>



=======
/**

 * 用户认证服务

 * 处理登录、注册、会话管理等功能

 */



import { Database } from './database.js';

import { generateSessionToken, generateOrderNo } from './utils.js';



export class AuthService {

  constructor(db, env) {

    this.database = new Database(db);

    this.env = env;

  }



  /**

   * 手机号登录/注册

   */

  async loginWithPhone(phone, verificationCode, ipAddress, userAgent) {

    try {

      // 这里应该验证短信验证码，暂时跳过

      // await this.verifyPhoneCode(phone, verificationCode);



      let user = await this.database.getUserByPhone(phone);

      

      if (!user) {

        // 新用户注册

        user = await this.database.createUser({

          phone: phone,

          username: `用户${phone.slice(-4)}`, // 默认用户名

          wechat_openid: null,

          wechat_unionid: null,

          avatar_url: null,

          email: null

        });

      }



      // 更新最后登录时间

      await this.database.updateLastLogin(user.id);



      // 创建会话

      const sessionToken = generateSessionToken();

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天过期

      

      await this.database.createSession(

        user.id,

        sessionToken,

        expiresAt.toISOString(),

        ipAddress,

        userAgent

      );



      // 记录登录日志

      await this.database.logLogin(user.id, 'phone', ipAddress, userAgent, 'success');



      return {

        success: true,

        user: this.sanitizeUser(user),

        sessionToken,

        expiresAt

      };

    } catch (error) {

      // 记录失败日志

      const user = await this.database.getUserByPhone(phone);

      if (user) {

        await this.database.logLogin(user.id, 'phone', ipAddress, userAgent, 'failed', error.message);

      }

      

      return {

        success: false,

        error: error.message

      };

    }

  }



  /**

   * 微信登录

   */

  async loginWithWechat(code, ipAddress, userAgent) {

    try {

      // 通过code获取微信用户信息

      const wechatUserInfo = await this.getWechatUserInfo(code);

      

      let user = await this.database.getUserByWechatOpenId(wechatUserInfo.openid);

      

      if (!user) {

        // 新用户注册

        user = await this.database.createUser({

          phone: null,

          wechat_openid: wechatUserInfo.openid,

          wechat_unionid: wechatUserInfo.unionid || null,

          username: wechatUserInfo.nickname || '微信用户',

          avatar_url: wechatUserInfo.headimgurl || null,

          email: null

        });

      } else {

        // 更新用户信息（头像、昵称可能会变）

        await this.database.updateUser(user.id, {

          username: wechatUserInfo.nickname || user.username,

          avatar_url: wechatUserInfo.headimgurl || user.avatar_url,

          wechat_unionid: wechatUserInfo.unionid || user.wechat_unionid

        });

        user = await this.database.getUserById(user.id);

      }



      // 更新最后登录时间

      await this.database.updateLastLogin(user.id);



      // 创建会话

      const sessionToken = generateSessionToken();

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天过期

      

      await this.database.createSession(

        user.id,

        sessionToken,

        expiresAt.toISOString(),

        ipAddress,

        userAgent

      );



      // 记录登录日志

      await this.database.logLogin(user.id, 'wechat', ipAddress, userAgent, 'success');



      return {

        success: true,

        user: this.sanitizeUser(user),

        sessionToken,

        expiresAt

      };

    } catch (error) {

      return {

        success: false,

        error: error.message

      };

    }

  }



  /**

   * 通过微信code获取用户信息

   */

  async getWechatUserInfo(code) {

    // 第一步：通过code获取access_token

    const tokenResponse = await fetch(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.env.WECHAT_APP_ID}&secret=${this.env.WECHAT_APP_SECRET}&code=${code}&grant_type=authorization_code`);

    const tokenData = await tokenResponse.json();

    

    if (tokenData.errcode) {

      throw new Error(`微信登录失败: ${tokenData.errmsg}`);

    }



    // 第二步：通过access_token获取用户信息

    const userResponse = await fetch(`https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`);

    const userData = await userResponse.json();

    

    if (userData.errcode) {

      throw new Error(`获取微信用户信息失败: ${userData.errmsg}`);

    }



    return userData;

  }



  /**

   * 验证会话

   */

  async validateSession(sessionToken) {

    if (!sessionToken) {

      return { valid: false, error: 'No session token provided' };

    }



    try {

      const session = await this.database.getSessionByToken(sessionToken);

      

      if (!session) {

        return { valid: false, error: 'Invalid session token' };

      }



      return {

        valid: true,

        user: this.sanitizeUser(session)

      };

    } catch (error) {

      return { valid: false, error: error.message };

    }

  }



  /**

   * 登出

   */

  async logout(sessionToken) {

    try {

      await this.database.deleteSession(sessionToken);

      return { success: true };

    } catch (error) {

      return { success: false, error: error.message };

    }

  }



  /**

   * 更新用户API Key

   */

  async updateUserApiKey(userId, apiKey) {

    try {

      // 这里应该加密存储API Key

      const encryptedApiKey = this.encryptApiKey(apiKey);

      

      const success = await this.database.updateUser(userId, {

        api_key: encryptedApiKey

      });



      return { success };

    } catch (error) {

      return { success: false, error: error.message };

    }

  }



  /**

   * 获取用户的API Key（解密）

   */

  async getUserApiKey(userId) {

    try {

      const user = await this.database.getUserById(userId);

      if (!user || !user.api_key) {

        return null;

      }



      return this.decryptApiKey(user.api_key);

    } catch (error) {

      console.error('Failed to get user API key:', error);

      return null;

    }

  }



  /**

   * 检查用户权限

   */

  async checkUserPermission(userId) {

    try {

      const isPremium = await this.database.isPremiumUser(userId);

      const todayUsage = await this.database.getTodayApiUsage(userId);

      

      const maxCalls = isPremium ? 

        parseInt(await this.database.getConfig('max_daily_api_calls_premium') || '10000') :

        parseInt(await this.database.getConfig('max_daily_api_calls_free') || '100');



      return {

        isPremium,

        dailyUsage: todayUsage.api_calls,

        dailyLimit: maxCalls,

        canUseApi: todayUsage.api_calls < maxCalls

      };

    } catch (error) {

      return {

        isPremium: false,

        dailyUsage: 0,

        dailyLimit: 0,

        canUseApi: false

      };

    }

  }



  /**

   * 清理用户敏感信息

   */

  sanitizeUser(user) {

    const { api_key, ...sanitizedUser } = user;

    return sanitizedUser;

  }



  /**

   * 加密API Key

   */

  encryptApiKey(apiKey) {

    // 这里应该使用真正的加密算法，比如AES

    // 暂时使用简单的Base64编码作为示例

    return btoa(apiKey);

  }



  /**

   * 解密API Key

   */

  decryptApiKey(encryptedApiKey) {

    // 对应的解密算法

    try {

      return atob(encryptedApiKey);

    } catch (error) {

      console.error('Failed to decrypt API key:', error);

      return null;

    }

  }



  /**

   * 清理过期会话

   */

  async cleanupExpiredSessions() {

    try {

      await this.database.cleanExpiredSessions();

    } catch (error) {

      console.error('Failed to cleanup expired sessions:', error);

    }

  }

}

>>>>>>>
