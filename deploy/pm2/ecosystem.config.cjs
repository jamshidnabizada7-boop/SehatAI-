// ============================================================
// SehatAI Care Connect — PM2 Process Manager Configuration
// Manages Next.js Web App, Durable Outbox Worker, and Signaling
// ============================================================

module.exports = {
  apps: [
    {
      name: 'sehatai-web',
      script: 'node',
      args: 'server.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-web-error.log',
      out_file: './logs/pm2-web-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'sehatai-outbox-worker',
      script: 'bun',
      args: 'scripts/run-outbox-worker.ts --interval 3000 --batch 25',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      kill_timeout: 5000,
      restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-worker-error.log',
      out_file: './logs/pm2-worker-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'sehatai-video-signal',
      script: 'node',
      args: 'mini-services/video-signal/index.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
      error_file: './logs/pm2-signal-error.log',
      out_file: './logs/pm2-signal-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
