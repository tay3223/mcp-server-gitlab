require('dotenv').config();

// 配置对象
const config = {
  gitlab: {
    url: process.env.GITLAB_URL,
    token: process.env.GITLAB_TOKEN,
    apiVersion: process.env.GITLAB_API_VERSION || 'v4',
    // 添加超时设置，防止长时间挂起
    timeout: parseInt(process.env.GITLAB_TIMEOUT || '30000', 10)
  },
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    // 限制请求体大小，防止DOS攻击
    bodyLimit: process.env.BODY_LIMIT || '1mb',
    // 添加允许的主机，增强安全性
    trustedProxies: (process.env.TRUSTED_PROXIES || '').split(',').filter(Boolean)
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    // 日志文件大小轮转设置
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10)
  },
  // 添加安全相关配置
  security: {
    // 是否启用CORS安全选项
    enableStrictCORS: process.env.ENABLE_STRICT_CORS === 'true',
    // 可接受的源，如果为空则允许所有源
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '*').split(','),
    // 请求速率限制(每分钟请求次数)
    rateLimit: parseInt(process.env.RATE_LIMIT || '100', 10)
  }
};

// 开发环境特定配置
if (config.server.environment === 'development') {
  // 在开发环境中增加详细日志
  if (config.logging.level === 'info') {
    config.logging.level = 'debug';
  }
}

// 生产环境特定配置
if (config.server.environment === 'production') {
  // 在生产环境中确保安全设置
  if (!config.security.enableStrictCORS) {
    console.warn('警告: 生产环境下建议启用严格CORS保护');
  }
}

module.exports = config; 