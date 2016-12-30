'use strict';

const debug = require('debug')('cluster-dispatch:app');
const co = require('co');

const AppClient = require('../../').AppClient;
const common = require('./common');

module.exports = co(function* gen() {
  const appClient = new AppClient({ logging: debug });
  yield appClient.init();
  appClient.on('error', debug);
  // 可以从app client中拿到agent, 推荐存储到common中
  common.agent = appClient.agent;
}).catch(debug);