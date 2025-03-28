const express = require('express');
const config = require('../config/config');
const logger = require('../config/logger');
const apiRoutes = require('./routes/api');
const fs = require('fs');
const path = require('path');

// 确保日志目录存在
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    logger.info(`创建日志目录: ${logDir}`);
  } catch (error) {
    console.error(`无法创建日志目录: ${error.message}`);
  }
}

// 创建Express应用
const app = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 设置跨域支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  logger.debug(`${req.method} ${req.originalUrl} [START]`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug(`${req.method} ${req.originalUrl} [FINISHED] ${res.statusCode} ${duration}ms`);
  });
  
  res.on('error', (err) => {
    const duration = Date.now() - start;
    logger.error(`${req.method} ${req.originalUrl} [ERROR] ${err.message} ${duration}ms`);
  });
  
  next();
});

// 路由
app.use('/api', apiRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: config.server.environment,
    gitlab: {
      url: config.gitlab.url ? 'configured' : 'not configured',
      apiVersion: config.gitlab.apiVersion
    }
  };
  
  res.status(200).json(health);
});

// 404处理
app.use((req, res) => {
  logger.warn(`404 - 未找到: ${req.originalUrl}`);
  res.status(404).json({ error: '资源不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ 
    error: '服务器内部错误',
    message: config.server.environment === 'development' ? err.message : undefined
  });
});

// 启动服务器
let server;
try {
  const port = parseInt(config.server.port, 10) || 3000;
  server = app.listen(port, () => {
    logger.info(`MCP GitLab服务器已启动，端口: ${port}, 环境: ${config.server.environment}`);
    logger.info(`GitLab URL: ${config.gitlab.url || '未配置'}`);
    
    if (!config.gitlab.url || !config.gitlab.token) {
      logger.warn('GitLab配置不完整，API可能无法正常工作');
    }
  });
  
  // 处理无法绑定端口的情况
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`端口 ${port} 已被占用，请尝试其他端口`);
    } else {
      logger.error(`服务器启动错误: ${error.message}`);
    }
    process.exit(1);
  });
} catch (error) {
  logger.error(`服务器启动失败: ${error.message}`);
  process.exit(1);
}

// 处理进程终止信号
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，优雅关闭服务器...');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，优雅关闭服务器...');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error(`未捕获的异常: ${error.message}`, { stack: error.stack });
  
  // 尝试优雅关闭，但确保最终退出
  if (server) {
    server.close(() => {
      logger.info('由于未捕获的异常，服务器已关闭');
      process.exit(1);
    });
    
    // 如果10秒内没有关闭，强制退出
    setTimeout(() => {
      logger.error('服务器关闭超时，强制退出');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(1);
  }
});

module.exports = app; 