const express = require('express');
const router = express.Router();
const gitlabService = require('../services/gitlab');
const logger = require('../../config/logger');

// 获取所有项目
router.get('/projects', async (req, res) => {
  try {
    const projects = await gitlabService.getProjects();
    res.json(projects);
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    res.status(500).json({ error: '获取项目列表失败' });
  }
});

// 获取特定项目
router.get('/projects/:id', async (req, res) => {
  try {
    const project = await gitlabService.getProject(req.params.id);
    res.json(project);
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    res.status(500).json({ error: '获取项目详情失败' });
  }
});

// 获取项目文件
router.get('/projects/:id/repository/files', async (req, res) => {
  try {
    const { path, ref = 'main' } = req.query;
    if (!path) {
      return res.status(400).json({ error: '缺少path参数' });
    }
    const file = await gitlabService.getRepositoryFile(req.params.id, path, ref);
    res.json(file);
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    res.status(500).json({ error: '获取仓库文件失败' });
  }
});

// 获取项目提交历史
router.get('/projects/:id/commits', async (req, res) => {
  try {
    const commits = await gitlabService.getCommits(req.params.id, req.query);
    res.json(commits);
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    res.status(500).json({ error: '获取提交历史失败' });
  }
});

// 获取项目合并请求
router.get('/projects/:id/merge_requests', async (req, res) => {
  try {
    const mergeRequests = await gitlabService.getMergeRequests(req.params.id, req.query);
    res.json(mergeRequests);
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    res.status(500).json({ error: '获取合并请求失败' });
  }
});

module.exports = router; 