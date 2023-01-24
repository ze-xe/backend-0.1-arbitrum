module.exports = {
  apps: [{
    name: "pm2 dev",
    script: './app.ts',
    watch: 'app.ts',
    instances: '-1',
    // cron_restart: '0 0 * * *',
    // Interpreter: '/node_modules/pm2/node_modules/.bin/ts-node'

  }],

};


// "scripts": {
//   "dev": "next",
//   "config:dev": "yarn get:dev:deployments && yarn get:dev:config",
//   "build": "yarn get:deployments && yarn get:config && next build",
//   "stage": "yarn get:stag:deployments && yarn get:stag:config && next build",
//   "get:deployments": "curl https://raw.githubusercontent.com/ze-xe/contracts-0.1/main/deployments/arbitrumGoerli/deployments.json -o ./src/deployments/deployments.json",
//    "get:dev:deployments": "curl https://raw.githubusercontent.com/ze-xe/contracts-0.1/dev/deployments/arbitrumGoerli/deployments.json -o ./src/deployments/deployments.json",
//     "get:stag:deployments": "curl https://raw.githubusercontent.com/ze-xe/contracts-0.1/stag/deployments/arbitrumGoerli/deployments.json -o ./src/deployments/deployments.json",
//    "start": "next start"
// },