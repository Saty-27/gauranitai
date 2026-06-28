module.exports = {
  apps: [{
    name: "divine-naturals",
    script: "dist/index.js",
    cwd: "/var/www/divinenaturalproducts",
    env: {
      NODE_ENV: "production",
      PORT: 5001,
      DATABASE_URL: "postgresql://divine_admin:Divine@2025@localhost:5432/divine_naturals",
      ADMIN_USERNAME: "DivineNaturalsMDKauldeepRao",
      ADMIN_PASSWORD: "DivineNaturals@2025"
    },
    error_file: "/root/.pm2/logs/divine-naturals-err.log",
    out_file: "/root/.pm2/logs/divine-naturals-out.log",
    restart_delay: 3000
  }]
}
