'use strict';

const { log } = require('../util');
const AppClient = require('./app');

const appPath = process.env.APP_PATH;


(async function forkApp() {
  const appClient = new AppClient({ logging: log });
  await appClient.init();
  appClient.on('error', log);

  require(appPath);
}()).catch(log);