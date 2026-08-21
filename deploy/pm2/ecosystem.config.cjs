module.exports = {
  apps: [
    {
      name: 'boo-api',
      cwd: '/var/www/boosportswear/boo-api',
      script: 'dist/src/main.js',
      instances: 1,
      exec_mode: 'fork',
      uid: 'booapp',
      gid: 'booapp',
      autorestart: true,
      max_memory_restart: '350M',
      kill_timeout: 10000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
