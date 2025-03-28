const winston = require('winston');
const { createLogger, format, transports } = winston;
const path = require('path');
const config = require('./config');

// 创建格式化器
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// 控制台格式化器
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// 日志目录
const logDir = path.join(__dirname, '../logs');

// 创建日志记录器
const logger = createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'mcp-gitlab-server' },
  transports: [
    // 将所有级别的日志写入到combined.log
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      tailable: true
    }),
    // 将所有错误级别的日志写入到error.log
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      tailable: true
    })
  ]
});

// 在非生产环境下，将日志同时输出到控制台
if (config.server.environment !== 'production') {
  logger.add(
    new transports.Console({
      format: consoleFormat,
      stderrLevels: ['error', 'warn']
    })
  );
}

// 捕获未处理的promise rejection
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', { reason, promise });
});

module.exports = logger; 