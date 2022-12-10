module.exports = {
  apps : [{
    script: 'app.ts',
    watch: './app.ts',
    instances: '-1',
    cron_restart: '0 0 * * *',
   
  }],

};
