const logger = require('../../config/logger');
const gitlabService = require('../services/gitlab');

// 支持的工具列表
const TOOLS = [
  {
    id: 'gitlab.projects.list',
    description: '获取GitLab项目列表',
    parameters: {
      type: 'object',
      properties: {
        page: { type: 'integer', description: '页码' },
        per_page: { type: 'integer', description: '每页项目数量' },
        order_by: { type: 'string', description: '排序字段' },
        sort: { type: 'string', enum: ['asc', 'desc'], description: '排序方向' }
      }
    }
  },
  {
    id: 'gitlab.projects.get',
    description: '获取特定GitLab项目详情',
    parameters: {
      type: 'object',
      required: ['projectId'],
      properties: {
        projectId: { type: 'string', description: '项目ID' }
      }
    }
  },
  {
    id: 'gitlab.repository.file',
    description: '获取项目仓库文件内容',
    parameters: {
      type: 'object',
      required: ['projectId', 'path'],
      properties: {
        projectId: { type: 'string', description: '项目ID' },
        path: { type: 'string', description: '文件路径' },
        ref: { type: 'string', description: '分支或标签名称', default: 'main' }
      }
    }
  },
  {
    id: 'gitlab.commits.list',
    description: '获取项目提交历史',
    parameters: {
      type: 'object',
      required: ['projectId'],
      properties: {
        projectId: { type: 'string', description: '项目ID' },
        page: { type: 'integer', description: '页码' },
        per_page: { type: 'integer', description: '每页提交数量' }
      }
    }
  },
  {
    id: 'gitlab.merge_requests.list',
    description: '获取项目合并请求列表',
    parameters: {
      type: 'object',
      required: ['projectId'],
      properties: {
        projectId: { type: 'string', description: '项目ID' },
        state: { type: 'string', enum: ['opened', 'closed', 'locked', 'merged'], description: '合并请求状态' },
        page: { type: 'integer', description: '页码' },
        per_page: { type: 'integer', description: '每页条目数量' }
      }
    }
  }
];

// 工具调用映射
const TOOL_HANDLERS = {
  'gitlab.projects.list': async (params) => {
    return await gitlabService.getProjects(params || {});
  },
  'gitlab.projects.get': async (params) => {
    if (!params.projectId) {
      throw new Error('缺少projectId参数');
    }
    return await gitlabService.getProject(params.projectId);
  },
  'gitlab.repository.file': async (params) => {
    if (!params.projectId) {
      throw new Error('缺少projectId参数');
    }
    if (!params.path) {
      throw new Error('缺少path参数');
    }
    return await gitlabService.getRepositoryFile(
      params.projectId, 
      params.path, 
      params.ref || 'main'
    );
  },
  'gitlab.commits.list': async (params) => {
    if (!params.projectId) {
      throw new Error('缺少projectId参数');
    }
    const options = {};
    if (params.page) options.page = params.page;
    if (params.per_page) options.per_page = params.per_page;
    
    return await gitlabService.getCommits(params.projectId, options);
  },
  'gitlab.merge_requests.list': async (params) => {
    if (!params.projectId) {
      throw new Error('缺少projectId参数');
    }
    const options = {};
    if (params.state) options.state = params.state;
    if (params.page) options.page = params.page;
    if (params.per_page) options.per_page = params.per_page;
    
    return await gitlabService.getMergeRequests(params.projectId, options);
  }
};

// 正在进行的工具调用
const activeToolCalls = new Map();

/**
 * 处理MCP协议的JSON-RPC请求
 * @param {Object} request - JSON-RPC请求对象
 * @returns {Object} - JSON-RPC响应对象
 */
async function handleMcpRequest(request) {
  logger.debug(`收到MCP请求: ${JSON.stringify(request)}`);
  
  // 处理无效请求
  if (!request || !request.method) {
    return createErrorResponse('无效的JSON-RPC请求', -32600);
  }
  
  // 处理请求ID
  const id = request.id || null;
  
  try {
    // 路由到对应的处理函数
    switch (request.method) {
      case 'tools/list':
        return createSuccessResponse(id, { tools: TOOLS });
        
      case 'tools/call':
        return await handleToolsCall(id, request.params);
        
      case 'tools/status':
        return handleToolsStatus(id, request.params);
        
      default:
        return createErrorResponse(id, `未知方法: ${request.method}`, -32601);
    }
  } catch (error) {
    logger.error(`处理MCP请求出错: ${error.message}`, { stack: error.stack });
    return createErrorResponse(id, `服务器内部错误: ${error.message}`, -32603);
  }
}

/**
 * 处理工具调用请求
 * @param {string|number} id - 请求ID
 * @param {Object} params - 请求参数
 * @returns {Object} - JSON-RPC响应
 */
async function handleToolsCall(id, params) {
  if (!params || !params.tool_id) {
    return createErrorResponse(id, '缺少tool_id参数', -32602);
  }
  
  const toolId = params.tool_id;
  const toolParams = params.parameters || {};
  
  // 检查工具是否存在
  if (!TOOL_HANDLERS[toolId]) {
    return createErrorResponse(id, `未知工具: ${toolId}`, -32602);
  }
  
  try {
    // 直接执行工具调用，返回结果
    const result = await TOOL_HANDLERS[toolId](toolParams);
    return createSuccessResponse(id, { result });
  } catch (error) {
    logger.error(`工具调用错误 ${toolId}: ${error.message}`);
    return createErrorResponse(id, `工具调用失败: ${error.message}`, -32000);
  }
}

/**
 * 处理工具状态请求
 * @param {string|number} id - 请求ID
 * @param {Object} params - 请求参数
 * @returns {Object} - JSON-RPC响应
 */
function handleToolsStatus(id, params) {
  if (!params || !params.call_id) {
    return createErrorResponse(id, '缺少call_id参数', -32602);
  }
  
  const callId = params.call_id;
  const callStatus = activeToolCalls.get(callId);
  
  if (!callStatus) {
    return createErrorResponse(id, `未找到调用ID: ${callId}`, -32602);
  }
  
  return createSuccessResponse(id, { status: callStatus });
}

/**
 * 创建成功响应
 * @param {string|number} id - 请求ID
 * @param {Object} result - 响应结果
 * @returns {Object} - JSON-RPC响应对象
 */
function createSuccessResponse(id, result) {
  return {
    jsonrpc: '2.0',
    id,
    result
  };
}

/**
 * 创建错误响应
 * @param {string|number} id - 请求ID
 * @param {string} message - 错误消息
 * @param {number} code - 错误代码
 * @returns {Object} - JSON-RPC响应对象
 */
function createErrorResponse(id, message, code = -32603) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message
    }
  };
}

module.exports = { handleMcpRequest, TOOLS }; 