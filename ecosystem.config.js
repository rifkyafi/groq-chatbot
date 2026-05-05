module.exports = {
  apps: [{
    name: 'my-app',
    script: 'server.js',
    instances: 'max',          // gunakan semua CPU core
    exec_mode: 'cluster',

    // ⬇️ Auto-restart berdasarkan memory
    max_memory_restart: '500M', // restart jika pakai > 500MB

    // Logging
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',

    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
