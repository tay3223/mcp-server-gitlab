const express = require('express');
const config = require('../config/config');
const logger = require('../config/logger');
const apiRoutes = require('./routes/api');

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

// 路由
app.use('/api', apiRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const server = app.listen(config.server.port, () => {
  logger.info(`MCP GitLab服务器已启动，端口: ${config.server.port}, 环境: ${config.server.environment}`);
  logger.info(`GitLab URL: ${config.gitlab.url || '未配置'}`);
});

// 处理进程终止信号
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，优雅关闭服务器...');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app; 