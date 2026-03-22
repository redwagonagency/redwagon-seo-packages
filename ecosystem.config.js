module.exports = {
  apps: [
    {
      name: "searchauditpro",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/root/searchauditpro",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_file: "/root/searchauditpro/.env.production",
      error_file: "/root/searchauditpro/logs/err.log",
      out_file: "/root/searchauditpro/logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
