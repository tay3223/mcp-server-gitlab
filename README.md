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
- 支持Smithery平台部署和本地部署两种模式

## 部署方式

本服务支持两种主要部署方式：

### 1. Smithery平台部署

[Smithery](https://smithery.ai/)是专为MCP服务设计的托管平台，提供标准化接口和简化的部署流程。

#### Smithery部署步骤

1. **准备工作**：确保仓库中包含`smithery.yaml`和`Dockerfile`文件（本仓库已包含）
2. **平台配置**：
   - 在[Smithery平台](https://smithery.ai/)上注册并连接您的GitHub账户
   - 创建新的MCP服务并选择此仓库
   - 在配置表单中填写您的GitLab服务器URL和访问令牌
3. **部署**：完成配置后，Smithery平台会自动构建和部署您的服务
4. **使用**：部署完成后，您可以通过Smithery提供的接口与服务交互

#### Smithery配置说明

本仓库的`smithery.yaml`文件定义了以下配置参数：

- `gitlabUrl`：您的GitLab服务器URL（必填）
- `gitlabToken`：GitLab API访问令牌（必填）
- `gitlabApiVersion`：GitLab API版本（默认：v4）
- `port`：服务监听端口（默认：3000）
- `logLevel`：日志级别（默认：info）

### 2. 本地/自托管部署

您也可以在自己的服务器或本地环境中部署此服务。

#### 本地部署步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/mcp-gitlab-server.git
   cd mcp-gitlab-server
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   ```
   编辑`.env`文件，填入必要的配置：
   ```
   GITLAB_URL=https://your-gitlab-instance.com
   GITLAB_TOKEN=your_private_token
   GITLAB_API_VERSION=v4
   PORT=3000
   LOG_LEVEL=info
   ```

4. **启动服务**
   ```bash
   # 生产模式
   npm start
   
   # 开发模式（支持热重载）
   npm run dev
   ```

#### Docker部署

本服务支持Docker容器化部署，方便在各种环境中运行：

1. **构建镜像**
   ```bash
   docker build -t mcp-gitlab-server .
   ```

2. **运行容器**
   ```bash
   docker run -p 3000:3000 --env-file .env mcp-gitlab-server
   ```

#### Docker Compose部署

使用docker-compose可以简化部署过程：

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

`docker-compose.yml`文件配置如下：

```yaml
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
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

## API端点

无论使用哪种部署方式，本地部署模式下服务器提供以下API端点：

### 项目相关

- `GET /api/projects` - 获取所有项目
- `GET /api/projects/:id` - 获取特定项目详情

### 仓库文件

- `GET /api/projects/:id/repository/files` - 获取项目文件内容

### 提交和合并请求

- `GET /api/projects/:id/commits` - 获取项目提交记录
- `GET /api/projects/:id/merge_requests` - 获取项目合并请求

### 健康检查

- `GET /health` - 服务健康状态检查

## 部署模式对比

| 特性 | Smithery部署 | 本地/自托管部署 |
|------|--------------|-----------------|
| 部署难度 | 简单，平台自动化 | 需要更多手动配置 |
| 与AI集成 | 直接支持 | 需要额外开发 |
| 通信方式 | STDIO | HTTP REST API |
| 配置方式 | 平台表单配置 | 环境变量 |
| 运维负担 | 平台管理 | 自行维护 |
| 扩展能力 | 受平台限制 | 完全自由 |

## 定制开发

如需扩展功能，您可以修改以下文件：

- `src/services/gitlab.js` - 添加新的GitLab API交互方法
- `src/routes/api.js` - 添加新的API端点
- `config/config.js` - 修改配置选项
- `smithery.yaml` - 修改Smithery平台配置选项

## 安全建议

1. **通信安全**：使用HTTPS确保API通信安全
2. **访问控制**：设置适当的GitLab访问令牌权限
3. **身份验证**：实现API身份验证机制，避免未授权访问
4. **依赖安全**：定期更新依赖包以修复安全漏洞
5. **反向代理**：在生产环境中使用反向代理（如Nginx）保护服务器

## 常见问题

### Smithery相关问题

**问：如何更新已部署在Smithery上的服务？**  
答：提交代码到GitHub仓库后，登录Smithery平台重新部署服务。

**问：Smithery环境变量如何配置？**  
答：在Smithery平台上创建服务时，会根据`smithery.yaml`中的`configSchema`自动生成配置表单。

**问：Smithery部署和本地部署有什么区别？**  
答：Smithery部署使用STDIO通信，而本地部署使用HTTP REST API通信。前者更适合与AI服务集成，后者更适合传统应用使用。

### 本地部署相关问题

**问：如何添加身份验证？**  
答：您可以在`src/index.js`中添加身份验证中间件：

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

**问：遇到"Error fetching projects"错误怎么办？**  
答：检查以下几点：
1. `.env`文件中的`GITLAB_URL`和`GITLAB_TOKEN`是否正确
2. GitLab服务器是否可以访问
3. 令牌是否有足够的权限

**问：如何获取GitLab访问令牌？**  
答：
1. 登录到您的GitLab实例
2. 点击右上角个人资料图标
3. 选择"设置" -> "访问令牌"
4. 创建一个拥有api权限的访问令牌

## 详细文档

更多部署和配置的详细信息，请参阅 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 许可证

[MIT](LICENSE) 