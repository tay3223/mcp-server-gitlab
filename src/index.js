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

// Smithery STDIO通信支持
// 检测是否在Smithery环境中运行
const isSmithery = process.env.NODE_ENV === 'production' && process.env.SMITHERY === 'true';

if (isSmithery) {
  logger.info('在Smithery平台上启动服务');
  // 处理标准输入
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (data) => {
    try {
      const message = JSON.parse(data);
      logger.info(`收到消息: ${JSON.stringify(message)}`);
      
      // 在这里处理来自Smithery的消息
      // 根据具体需求处理不同类型的请求
      
      const response = {
        id: message.id,
        status: 'success',
        result: { message: '操作成功' }
      };
      
      // 返回响应给Smithery
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (error) {
      logger.error(`处理Smithery消息出错: ${error.message}`);
      const errorResponse = {
        status: 'error',
        error: error.message
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  });
  
  // 错误处理
  process.stdin.on('error', (error) => {
    logger.error(`标准输入错误: ${error.message}`);
  });
  
  // 结束处理
  process.stdin.on('end', () => {
    logger.info('标准输入流已关闭');
    process.exit(0);
  });
  
  logger.info('Smithery STDIO通信已启动');
} else {
  // 常规HTTP服务器模式
  // 启动服务器
  const server = app.listen(config.server.port, () => {
    logger.info(`MCP GitLab服务器已启动，端口: ${config.server.port}, 环境: ${config.server.environment}`);
  });

  // 处理进程终止信号
  process.on('SIGTERM', () => {
    logger.info('收到SIGTERM信号，优雅关闭服务器...');
    server.close(() => {
      logger.info('服务器已关闭');
      process.exit(0);
    });
  });
}

module.exports = app; 