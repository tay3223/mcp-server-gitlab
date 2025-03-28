const { Gitlab } = require('gitlab');
const config = require('../../config/config');
const logger = require('../../config/logger');

// 创建GitLab客户端实例
const gitlab = new Gitlab({
  host: config.gitlab.url,
  token: config.gitlab.token
});

/**
 * GitLab服务类，提供与GitLab交互的方法
 */
class GitlabService {
  /**
   * 获取所有项目
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 项目列表
   */
  async getProjects(options = {}) {
    try {
      logger.info('Fetching projects from GitLab');
      return await gitlab.Projects.all(options);
    } catch (error) {
      logger.error(`Error fetching projects: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取特定项目
   * @param {number} projectId - 项目ID
   * @returns {Promise<Object>} 项目信息
   */
  async getProject(projectId) {
    try {
      logger.info(`Fetching project with ID: ${projectId}`);
      return await gitlab.Projects.show(projectId);
    } catch (error) {
      logger.error(`Error fetching project ${projectId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取项目仓库文件
   * @param {number} projectId - 项目ID
   * @param {string} filePath - 文件路径
   * @param {string} ref - 分支/标签
   * @returns {Promise<Object>} 文件内容
   */
  async getRepositoryFile(projectId, filePath, ref = 'main') {
    try {
      logger.info(`Fetching file ${filePath} from project ${projectId}`);
      return await gitlab.RepositoryFiles.show(projectId, filePath, ref);
    } catch (error) {
      logger.error(`Error fetching file ${filePath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取项目的提交历史
   * @param {number} projectId - 项目ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 提交历史
   */
  async getCommits(projectId, options = {}) {
    try {
      logger.info(`Fetching commits for project ${projectId}`);
      return await gitlab.Commits.all(projectId, options);
    } catch (error) {
      logger.error(`Error fetching commits: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取合并请求列表
   * @param {number} projectId - 项目ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 合并请求列表
   */
  async getMergeRequests(projectId, options = {}) {
    try {
      logger.info(`Fetching merge requests for project ${projectId}`);
      return await gitlab.MergeRequests.all({ projectId, ...options });
    } catch (error) {
      logger.error(`Error fetching merge requests: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new GitlabService(); 