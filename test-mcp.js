#!/usr/bin/env node

/**
 * MCP协议测试工具
 * 使用方式: node test-mcp.js [命令]
 * 
 * 可用命令:
 * - list: 列出所有可用工具
 * - call <工具ID> [参数JSON]: 调用指定工具
 * 
 * 示例:
 * - node test-mcp.js list
 * - node test-mcp.js call gitlab.projects.list
 * - node test-mcp.js call gitlab.projects.get '{"projectId":"123"}'
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 创建子进程，启动应用，并设置MCP模式
const startApp = () => {
  const env = { ...process.env, MCP_MODE: 'true' };
  
  // 检查.env文件，如果存在，加载环境变量
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    console.log('加载.env文件...');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !line.startsWith('#')) {
        const key = match[1];
        const value = match[2] || '';
        env[key] = value.replace(/^['"]|['"]$/g, ''); // 去除引号
      }
    }
  }
  
  const child = spawn('node', ['src/index.js'], { 
    env,
    stdio: ['pipe', 'pipe', process.stderr]
  });
  
  return child;
};

// 发送JSON-RPC请求，并接收响应
const sendRequest = (child, request) => {
  return new Promise((resolve, reject) => {
    let responseData = '';
    
    // 监听输出
    child.stdout.on('data', (data) => {
      responseData += data.toString();
      
      // 检查是否有完整响应
      const responses = responseData.split('\n');
      responseData = responses.pop() || ''; // 保留最后一个可能不完整的消息
      
      for (const resp of responses) {
        if (!resp.trim()) continue;
        
        try {
          const response = JSON.parse(resp);
          resolve(response);
        } catch (error) {
          console.error('解析响应失败:', error);
        }
      }
    });
    
    // 监听进程关闭
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`进程以代码 ${code} 退出`));
      }
    });
    
    // 监听错误
    child.on('error', (error) => {
      reject(error);
    });
    
    // 发送请求
    child.stdin.write(JSON.stringify(request) + '\n');
  });
};

// 主函数
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  const child = startApp();
  
  try {
    // 等待应用启动
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let request;
    let response;
    
    switch (command) {
      case 'list':
        // 获取工具列表
        request = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list'
        };
        
        response = await sendRequest(child, request);
        console.log('可用工具列表:');
        if (response.result && response.result.tools) {
          response.result.tools.forEach(tool => {
            console.log(`- ${tool.id}: ${tool.description}`);
            
            if (tool.parameters && tool.parameters.properties) {
              console.log('  参数:');
              Object.entries(tool.parameters.properties).forEach(([name, prop]) => {
                const required = tool.parameters.required && tool.parameters.required.includes(name) ? '(必须)' : '';
                console.log(`    ${name}${required}: ${prop.description || '无描述'} (${prop.type})`);
              });
            }
            console.log(''); // 空行分隔
          });
        }
        break;
        
      case 'call':
        const toolId = args[1];
        if (!toolId) {
          console.error('错误: 请指定工具ID');
          process.exit(1);
        }
        
        // 解析参数
        let parameters = {};
        if (args[2]) {
          try {
            parameters = JSON.parse(args[2]);
          } catch (error) {
            console.error('错误: 参数必须是有效的JSON格式');
            process.exit(1);
          }
        }
        
        // 调用工具
        request = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            tool_id: toolId,
            parameters
          }
        };
        
        response = await sendRequest(child, request);
        console.log('调用结果:');
        console.log(JSON.stringify(response, null, 2));
        break;
        
      default:
        console.error(`错误: 未知命令 "${command}"`);
        process.exit(1);
    }
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    // 关闭子进程
    child.stdin.end();
    process.exit(0);
  }
};

main().catch(error => {
  console.error('未处理错误:', error);
  process.exit(1);
}); 