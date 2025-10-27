/**
 * 应用配置
 * 存储积分墙应用的密钥信息
 */

module.exports = {
  // 积分墙应用配置
  // 与 film 项目中的签名配置保持一致
  apps: {
    // channel (app_key): app_secret 映射
    CS001: "804c73bec6c891128b7059b22da5f2a9faf4b93e056ff33db26fd527161d2512",
  },

  /**
   * 根据 channel (appKey) 获取 appSecret
   * @param {string} channel 应用标识（channel）
   * @returns {string|null} appSecret 或 null
   */
  getAppSecret(channel) {
    return this.apps[channel] || null;
  },
};
