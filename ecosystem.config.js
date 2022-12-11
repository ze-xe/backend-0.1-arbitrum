module.exports = {
  apps : [{
    script: 'app.ts',
    watch: './app.ts',
    instances: '-1',
    cron_restart: '0 0 * * *',
    Interpreter: '/node_modules/pm2/node_modules/.bin/ts-node'
   
  }],

};
