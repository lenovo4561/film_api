/**
 * 签名验证工具
 * 用于验证积分墙回调请求的安全性
 * 签名方式与 film 项目保持一致：md5(参数字符串 + 密钥)
 */

const crypto = require("crypto");
const appConfig = require("../config/app-config");

/**
 * 生成MD5签名
 * @param {string} str 待签名字符串
 * @returns {string} MD5签名结果
 */
function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

/**
 * 生成签名字符串
 * 使用 app_secret, coins, time, userId 四个字段生成签名（按字典序排列）
 * @param {object} params 参数对象
 * @param {string} appSecret 应用密钥
 * @returns {string} 签名字符串
 */
function generateSignString(params, appSecret) {
  // 提取用于签名的四个字段：app_secret(密钥), coins(金币数量), time(时间戳), userId(用户ID)
  const { coins, time, userId } = params;
  const signParams = { app_secret: appSecret, coins, time, userId };

  const keys = Object.keys(signParams).sort(); // 字典序排序: app_secret, coins, time, userId

  const signString = keys.map((key) => `${key}=${signParams[key]}`).join("&");

  return signString;
}

/**
 * 生成签名
 * @param {object} params 参数对象
 * @param {string} appSecret 应用密钥
 * @returns {string} 签名字符串
 */
function generateSignature(params, appSecret) {
  // 生成签名字符串
  const signString = generateSignString(params, appSecret);

  // 计算签名：md5(签名字符串 + app_secret)
  const sign = md5(signString + appSecret);

  return sign;
}

/**
 * 验证回调签名
 * 验证逻辑：
 * 1. appKey 必须在配置中存在
 * 2. timestamp 与当前时间的差值必须小于5分钟
 * 3. 签名验证：使用 app_secret, coins, time, userId 生成签名并比对
 * @param {object} params 回调参数
 * @param {string} params.appKey 应用标识（app_key）
 * @param {number} params.timestamp 时间戳（毫秒）
 * @param {number} params.coins 金币数量
 * @param {string} params.userId 用户ID
 * @param {string} params.sign 签名
 * @returns {object} 验证结果 { valid: boolean, message: string }
 */
function verifyCallbackSignature(params) {
  const { appKey, timestamp, coins, userId, sign } = params;

  // 1. 参数验证
  if (!appKey || !timestamp || coins === undefined || !userId || !sign) {
    return {
      valid: false,
      message:
        "签名验证失败：缺少必要的签名参数（appKey, timestamp, coins, userId, sign）",
    };
  }

  // 2. 验证 appKey 是否在配置中存在
  const appSecret = appConfig.getAppSecret(appKey);
  if (!appSecret) {
    console.error(`[签名验证] 未知的 appKey: ${appKey}`);
    return {
      valid: false,
      message: "签名验证失败：无效的 appKey",
    };
  }

  // 3. 验证时间戳（与当前时间的差值必须小于5分钟）
  const now = Date.now();
  const timeDiff = Math.abs(now - timestamp);
  const maxTimeDiff = 5 * 60 * 1000; // 5分钟有效期

  if (timeDiff > maxTimeDiff) {
    console.error(
      `[签名验证] 时间戳过期: 当前=${now}, 请求=${timestamp}, 差值=${timeDiff}ms`
    );
    return {
      valid: false,
      message: "签名验证失败：请求时间戳已过期（超过5分钟）",
    };
  }

  // 4. 生成期望的签名（使用 app_secret, coins, time, userId）
  const signParams = { coins, time: timestamp, userId };
  const expectedSign = generateSignature(signParams, appSecret);

  // 5. 比对签名
  if (sign !== expectedSign) {
    console.error(`[签名验证] 签名不匹配:`);
    console.error(`  - 收到的签名: ${sign}`);
    console.error(`  - 期望的签名: ${expectedSign}`);
    console.error(
      `  - 签名字符串: ${generateSignString(signParams, appSecret)}`
    );
    console.error(
      `  - 签名参数: app_secret=${appSecret.substring(
        0,
        16
      )}..., coins=${coins}, time=${timestamp}, userId=${userId}`
    );
    return {
      valid: false,
      message: "签名验证失败：签名不匹配",
    };
  }

  // 验证通过
  console.log(
    `[签名验证] ✅ 验证通过: appKey=${appKey}, userId=${userId}, coins=${coins}, time=${timestamp}`
  );
  return {
    valid: true,
    message: "签名验证通过",
  };
}

module.exports = {
  md5,
  generateSignString,
  generateSignature,
  verifyCallbackSignature,
};
