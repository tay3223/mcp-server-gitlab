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

# 暴露端口（仅作为文档用途）
EXPOSE 3000

# 默认环境变量，可被启动时的环境变量覆盖
ENV NODE_ENV=development
ENV SMITHERY=false

# 启动应用
CMD ["node", "src/index.js"] 