FROM node:16-alpine

# 创建应用目录
WORKDIR /app

# 安装应用依赖
COPY package*.json ./
RUN npm install --production

# 创建日志目录
RUN mkdir -p logs

# 拷贝应用程序代码
COPY . .

# 设置环境变量
ENV NODE_ENV=production
ENV MCP_MODE=true

# 启动应用，使用MCP模式
CMD ["node", "src/index.js"] 