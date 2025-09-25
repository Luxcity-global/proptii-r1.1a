module.exports = {
  apps: [
    {
      name: 'marketing-hub-backend',
      script: './backend/dist/server.js',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 8001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8001,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/marketing-hub.git',
      path: '/var/www/marketing-hub',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
