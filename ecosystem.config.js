module.exports = {
  apps : [{
    script: 'app.js',
    watch: './app.js',
    instances: '-1',
    cron_restart: '0 0 * * *',
   
  }],

};
