const express = require('express');
const router = express.Router();
const gitlabService = require('../services/gitlab');
const logger = require('../../config/logger');

// 获取所有项目
router.get('/projects', async (req, res) => {
  try {
    // 提取可能的查询参数并传递给服务
    const { page, per_page, order_by, sort } = req.query;
    const options = {};
    
    if (page) options.page = page;
    if (per_page) options.per_page = per_page;
    if (order_by) options.order_by = order_by;
    if (sort) options.sort = sort;
    
    const projects = await gitlabService.getProjects(options);
    res.json(projects);
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    res.status(500).json({ error: '获取项目列表失败', message: error.message });
  }
});

// 获取特定项目
router.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: '项目ID不能为空' });
    }
    
    const project = await gitlabService.getProject(id);
    if (!project) {
      return res.status(404).json({ error: '找不到指定项目' });
    }
    
    res.json(project);
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    
    // 判断是否为资源不存在的错误
    if (error.message.includes('Not Found') || error.response?.status === 404) {
      return res.status(404).json({ error: '找不到指定项目', message: error.message });
    }
    
    res.status(500).json({ error: '获取项目详情失败', message: error.message });
  }
});

// 获取项目文件
router.get('/projects/:id/repository/files', async (req, res) => {
  try {
    const { id } = req.params;
    const { path, ref = 'main' } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: '项目ID不能为空' });
    }
    
    if (!path) {
      return res.status(400).json({ error: '缺少path参数' });
    }
    
    const file = await gitlabService.getRepositoryFile(id, path, ref);
    res.json(file);
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    
    // 判断错误类型并返回适当的状态码
    if (error.message.includes('Not Found') || error.response?.status === 404) {
      return res.status(404).json({ error: '找不到指定文件', message: error.message });
    }
    
    res.status(500).json({ error: '获取仓库文件失败', message: error.message });
  }
});

// 获取项目提交历史
router.get('/projects/:id/commits', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: '项目ID不能为空' });
    }
    
    const commits = await gitlabService.getCommits(id, req.query);
    res.json(commits);
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    
    if (error.message.includes('Not Found') || error.response?.status === 404) {
      return res.status(404).json({ error: '找不到指定项目', message: error.message });
    }
    
    res.status(500).json({ error: '获取提交历史失败', message: error.message });
  }
});

// 获取项目合并请求
router.get('/projects/:id/merge_requests', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: '项目ID不能为空' });
    }
    
    const mergeRequests = await gitlabService.getMergeRequests(id, req.query);
    res.json(mergeRequests);
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    
    if (error.message.includes('Not Found') || error.response?.status === 404) {
      return res.status(404).json({ error: '找不到指定项目', message: error.message });
    }
    
    res.status(500).json({ error: '获取合并请求失败', message: error.message });
  }
});

module.exports = router; 