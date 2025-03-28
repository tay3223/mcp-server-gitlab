# MCP GitLab 服务器

这是一个连接私有部署GitLab服务器的MCP服务器。它提供了一个API层，可以与GitLab API交互，获取项目、文件、提交记录和合并请求等信息。

## 功能特点

- 提供简化的API接口访问私有GitLab实例
- 支持获取项目列表和项目详情
- 支持查看仓库文件内容
- 支持获取项目提交历史
- 支持获取和操作合并请求
- 完整的日志记录
- 跨域支持
- 健康检查端点

## 部署说明

此MCP服务器是一个独立的Node.js应用程序，可以部署在多种环境中。它作为GitLab的中间层，为您的应用程序提供API接口，同时可以进行自定义的业务逻辑处理。

详细的部署指南请参阅 [DEPLOYMENT.md](./DEPLOYMENT.md)。

### 部署选项

1. **Smithery平台部署**：作为MCP（Master Control Program）服务部署到Smithery平台
2. **自托管服务器**：在您自己的物理服务器或云服务器（如AWS EC2、阿里云ECS等）上部署
3. **容器化部署**：使用Docker容器部署
4. **平台即服务(PaaS)**：如Heroku、Vercel等平台

## Smithery部署

本仓库包含了部署到Smithery平台所需的配置文件：

1. `smithery.yaml`：定义服务启动配置和参数
2. `Dockerfile`：定义如何构建服务容器

部署步骤：

1. Fork或克隆此仓库到您的GitHub账户
2. 在[Smithery平台](https://smithery.ai/)上注册并连接您的GitHub账户
3. 创建新的MCP服务并选择此仓库
4. 在配置中填写您的GitLab服务器URL和访问令牌
5. 完成部署

## 环境准备

1. Node.js 14.x 或更高版本
2. npm 或 yarn
3. 访问私有GitLab服务器的权限和API令牌

## 安装步骤

1. 克隆仓库
   ```bash
   git clone https://your-repository-url/mcp-gitlab-server.git
   cd mcp-gitlab-server
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 配置环境变量
   ```bash
   cp .env.example .env
   ```
   编辑.env文件，填入您的GitLab服务器URL和访问令牌：
   ```
   GITLAB_URL=https://your-gitlab-instance.com
   GITLAB_TOKEN=your_private_token
   GITLAB_API_VERSION=v4
   ```

4. 启动服务器
   ```bash
   npm start
   ```
   开发模式启动（带热重载）：
   ```bash
   npm run dev
   ```

## API端点

服务器提供以下API端点：

### 项目相关

- `GET /api/projects` - 获取所有项目
  ```bash
  curl http://localhost:3000/api/projects
  ```

- `GET /api/projects/:id` - 获取特定项目详情
  ```bash
  curl http://localhost:3000/api/projects/123
  ```

### 仓库文件

- `GET /api/projects/:id/repository/files` - 获取项目文件内容
  ```bash
  curl "http://localhost:3000/api/projects/123/repository/files?path=src/index.js&ref=main"
  ```

### 提交和合并请求

- `GET /api/projects/:id/commits` - 获取项目提交记录
  ```bash
  curl http://localhost:3000/api/projects/123/commits
  ```

- `GET /api/projects/:id/merge_requests` - 获取项目合并请求
  ```bash
  curl http://localhost:3000/api/projects/123/merge_requests
  ```

### 健康检查

- `GET /health` - 服务健康状态检查
  ```bash
  curl http://localhost:3000/health
  ```

## 使用Docker部署

项目包含Dockerfile，可以使用以下命令进行容器化部署：

```bash
# 构建Docker镜像
docker build -t mcp-gitlab-server .

# 运行容器
docker run -p 3000:3000 --env-file .env mcp-gitlab-server
```

使用docker-compose部署：

```yaml
# docker-compose.yml
version: '3'
services:
  mcp-gitlab-server:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./logs:/app/logs
    env_file:
      - .env
    restart: always
```

运行docker-compose:

```bash
docker-compose up -d
```

## 定制开发

如需扩展功能，您可以修改以下文件：

- `src/services/gitlab.js` - 添加新的GitLab API交互方法
- `src/routes/api.js` - 添加新的API端点
- `config/config.js` - 修改配置选项
- `smithery.yaml` - 修改Smithery平台配置选项

## 安全性建议

1. 使用HTTPS确保API通信安全
2. 设置适当的GitLab访问令牌权限
3. 实现API认证机制，避免未授权访问
4. 定期更新依赖包以修复安全漏洞
5. 在生产环境中使用反向代理（如Nginx）保护服务器

## 常见问题

### 如何在Smithery平台上部署？

Smithery是一个专门用于部署MCP（Master Control Program）服务的平台。要部署到Smithery：

1. 确保您的仓库包含`smithery.yaml`和`Dockerfile`文件
2. 在Smithery平台上创建账户并连接GitHub
3. 创建新服务并选择此仓库
4. 按照平台提示完成配置

更多信息请参考[Smithery文档](https://smithery.ai/docs/config)。

### 为什么不部署在GitHub上？

MCP服务器是一个运行时服务，需要部署在能够运行Node.js应用程序的服务器上。GitHub是一个代码托管平台，适合存储和管理源代码，但不适合运行服务器应用程序。

GitHub Actions或GitHub Pages可以用于某些静态网站或自动化工作流，但对于需要持续运行、处理API请求的服务器应用程序，您需要使用专门的服务器或云服务。

### 如何获取GitLab访问令牌？

1. 登录到您的GitLab实例
2. 点击右上角个人资料图标
3. 选择"设置"
4. 在左侧导航栏中，选择"访问令牌"
5. 创建一个拥有api权限的访问令牌
6. 将生成的令牌添加到您的.env文件中

### 遇到"Error fetching projects"错误怎么办？

该错误通常表示GitLab配置有问题，请检查：

1. `.env`文件中的`GITLAB_URL`和`GITLAB_TOKEN`是否正确
2. GitLab服务器是否可以访问
3. 令牌是否有足够的权限

### 如何添加身份验证？

您可以在`src/index.js`中添加身份验证中间件，例如：

```javascript
// 身份验证中间件
app.use('/api', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: '未授权访问' });
  }
  next();
});
```

## 贡献指南

欢迎提交问题和拉取请求。对于重大更改，请先开issue讨论您想要更改的内容。

## 许可证

[MIT](LICENSE) 