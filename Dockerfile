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

# 设置标准输入/输出通信所需的环境变量
ENV NODE_ENV=production

# 启动应用 - 使用node直接运行，不添加其他参数，Smithery会通过STDIO通信
CMD ["node", "src/index.js"] 