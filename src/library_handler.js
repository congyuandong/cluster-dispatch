'use strict';

const co = require('co');
const EventEmitter = require('events');
const is = require('is-type-of');

class Handler extends EventEmitter {
  constructor({ logging, lib } = {}) {
    super();

    this.lib = lib;
    this.parsedLib = null;
    this.logging = logging;
  }

  async init() {
    const { lib } = this;
    this.parsedLib = await parseLib(lib);
    this.libSignature = getLibSignature(this.parsedLib);
  }

  getAgents(mail) {
    mail.reply(this.libSignature);
  }

  invokeLibrary(mail, invokeParams) {
    if (!invokeParams) {
      return;
    }
    const { parsedLib, logging } = this;
    const { objName, methodName, args, isEvent } = invokeParams;
    const attr = parsedLib[objName][methodName];
    const that = this;

    (async function invoke() {
      if (isEvent) {
        const eventName = invokeParams.eventName;
        const to = mail.from;
        args[args.length - 1] = function fn(...rest) {
          that.emit('lib-event', { eventName, to, args: Array.from(rest) });
        };
        attr.apply(parsedLib[objName], args);
      } else {
        const result = await invokeFieldOrMethod({
          ctx: parsedLib[objName],
          attr,
          args,
        });

        mail.reply(result);
      }
    }()).catch(logging);
  }
}

module.exports = Handler;

async function parseLib(library) {
  const result = {};
  for (const key of Object.keys(library)) {
    const lib = await library[key];

    await invokeFieldOrMethod({
      ctx: library,
      attr: lib,
    });

    result[key] = lib;
  }

  return result;
}

function getLibSignature(lib) {
  const result = {};
  for (const key of Object.keys(lib)) {
    result[key] = getMethodByProto(lib[key]);
  }

  return result;
}

function getMethodByProto(obj) {
  const result = {};

  if (obj instanceof EventEmitter) {
    const eventMethods = Object.getOwnPropertyNames(EventEmitter.prototype);
    for (const methodKey of eventMethods) {
      result[methodKey] = { type: typeof EventEmitter[methodKey], from: 'super' };
    }
  }

  const prototypeKeys = Object.getOwnPropertyNames(obj.constructor.prototype);
  for (const prototypeKey of prototypeKeys) {
    if (!prototypeKey.startsWith('_')) {
      const type = typeof obj[prototypeKey];

      result[prototypeKey] = { type, from: 'prototype' };
    }
  }

  const fieldKeys = Object.getOwnPropertyNames(obj);
  for (const fieldKey of fieldKeys) {
    if (!fieldKey.startsWith('_')) {
      const type = typeof obj[fieldKey];

      result[fieldKey] = { type, from: 'field' };
    }
  }

  return result;
}

async function invokeFieldOrMethod({ ctx, attr, args }) {
  if (is.function(attr)) {
    const result = await attr.apply(ctx, args);

    if (is.generator(result)) {
      return await co.wrap(attr).apply(ctx, args);
    }

    return result;
  } else if (is.generator(attr)) {
    return await co.wrap(attr).apply(ctx, args);
  }

  return attr;
}
