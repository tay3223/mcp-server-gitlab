require('dotenv').config();

module.exports = {
  gitlab: {
    url: process.env.GITLAB_URL,
    token: process.env.GITLAB_TOKEN,
    apiVersion: process.env.GITLAB_API_VERSION || 'v4'
  },
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
}; 