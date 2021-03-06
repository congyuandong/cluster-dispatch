'use strict';

const demoLib = {
  name: 'yejiayu',

  getUserName(name) {
    return { name: 'yejiayu' };
  },

  getUserNameByPromise(name) {
    return new Promise((resolve) =>
       resolve({ name })
    );
  },

  * getUserNameByGen(name) {
    return yield new Promise((resolve) =>
       resolve({ name })
    );
  },
};

module.exports = demoLib;
