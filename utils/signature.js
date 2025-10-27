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
 * 将参数按字典序排列（除了sign字段）
 * @param {object} params 参数对象
 * @returns {string} 签名字符串
 */
function generateSignString(params) {
  const keys = Object.keys(params)
    .filter((key) => key !== "sign") // 排除sign字段
    .sort(); // 字典序排序

  const signString = keys.map((key) => `${key}=${params[key]}`).join("&");

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
  const signString = generateSignString(params);

  // 计算签名：md5(签名字符串 + 产品密钥)
  const sign = md5(signString + appSecret);

  return sign;
}

/**
 * 验证回调签名
 * @param {object} params 回调参数
 * @param {string} params.channel 应用标识（channel）
 * @param {number} params.time 时间戳
 * @param {string} params.sign 签名
 * @returns {object} 验证结果 { valid: boolean, message: string }
 */
function verifyCallbackSignature(params) {
  const { channel, time, sign } = params;

  // 1. 参数验证
  if (!channel || !time || !sign) {
    return {
      valid: false,
      message: "签名验证失败：缺少必要的签名参数（channel, time, sign）",
    };
  }

  // 2. 获取 appSecret
  const appSecret = appConfig.getAppSecret(channel);
  if (!appSecret) {
    console.error(`[签名验证] 未知的 channel: ${channel}`);
    return {
      valid: false,
      message: "签名验证失败：无效的 channel",
    };
  }

  // 3. 验证时间戳（防止重放攻击）
  const now = Date.now();
  const timeDiff = Math.abs(now - time);
  const maxTimeDiff = 5 * 60 * 1000; // 5分钟有效期

  if (timeDiff > maxTimeDiff) {
    console.error(
      `[签名验证] 时间戳过期: 当前=${now}, 请求=${time}, 差值=${timeDiff}ms`
    );
    return {
      valid: false,
      message: "签名验证失败：请求时间戳已过期（超过5分钟）",
    };
  }

  // 4. 生成期望的签名（排除 sign 字段）
  const paramsWithoutSign = { ...params };
  delete paramsWithoutSign.sign;

  const expectedSign = generateSignature(paramsWithoutSign, appSecret);

  // 5. 比对签名
  if (sign !== expectedSign) {
    console.error(`[签名验证] 签名不匹配:`);
    console.error(`  - 收到的签名: ${sign}`);
    console.error(`  - 期望的签名: ${expectedSign}`);
    console.error(`  - 签名字符串: ${generateSignString(paramsWithoutSign)}`);
    return {
      valid: false,
      message: "签名验证失败：签名不匹配",
    };
  }

  // 验证通过
  console.log(
    `[签名验证] ✅ 验证通过: channel=${channel}, userId=${params.userId}`
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
