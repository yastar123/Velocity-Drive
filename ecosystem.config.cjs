module.exports = {
  apps: [
    {
      name: "velocity-drive",
      script: ".output/server/index.mjs",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NITRO_PORT: 3000,
        NITRO_HOST: "0.0.0.0",
      },
    },
  ],
};
