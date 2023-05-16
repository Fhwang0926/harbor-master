'use strict';

const EventEmitter = require('events');
const Promise      = require('bluebird');
const request      = require('request');
const _            = require('lodash');
const axios        = require('axios');


class Modem {

  constructor(options) {

    const defaults = {
      useAxios: false,
      host: null,
      socket: null,
      version: '1.41',
      tls: {
        ca: null,
        cert: null,
        key: null,
        passphrase: null
      }
    };

    this.opts = _.defaults(options, defaults);
    this.instance = undefined;
  }

  get(options) {
    options.method = 'GET';
    return this.http(options);
  }

  post(options) {
    options.method = 'POST';
    return this.http(options);
  }

  put(options) {
    options.method = 'PUT';
    return this.http(options);
  }

  destroy(options) {
    options.method = 'DELETE';
    return this.http(options);
  }

  stream(method, path, params, headers) {

    return new Promise((resolve) => {
      const dest = new EventEmitter();
      const src = this._request(method, path, params, headers);

      src.on('data', function(chunk) {
        const payload = chunk.toString('utf-8').trim();
        dest.emit('data', payload);
      });

      src.on('error', function(err) {
        dest.emit('error', err);
      });

      src.on('end', function(err) {
        dest.emit('end', err);
      });

      resolve(dest);
    });
  }

  upload(stream, options) {
    const self = this;
    options = _.omit(options, ['successCodes', 'errorCodes']);

    return new Promise((resolve) => {
      const req = stream.pipe(self._request(options));
      resolve(req);
    });
  }

  download(options) {
    const self = this;
    options = _.omit(options, ['successCodes', 'errorCodes']);

    return new Promise((resolve) => {
      resolve(self._request(options));
    });
  }

  http(options) {
    const self = this;
    const codes = _.pick(options, ['successCodes', 'errorCodes']);
    options = _.omit(options, ['successCodes', 'errorCodes']);

    return new Promise((resolve, reject) => {
      self._request(options, (err, resp, body) => {
        if(!err && _.hasIn(codes.successCodes, resp.statusCode)) {

          if(_.isString(body)) {
            try {
              body = JSON.parse(body);
            } catch(exc) {
              console.log('[harbor-master][modem] error parsing body as json');
            }
          }

          resolve(body);
        } else {
          reject({ error: err, response: resp, body: body });
        }
      });
    });
  }

  _request(options, cb) {

    options.headers = options.headers || {};

    options.url = this.url(options.url);

    if(options.method !== 'GET') {
      options.json = true;
    }

    if(this.isSecure()) {
      options.ca = this.opts.tls.ca;
      options.cert = this.opts.tls.cert;
      options.key = this.opts.tls.key;
      options.passphrase = this.opts.tls.passphrase;
    }

    if(this.isSocket()) {
      options.headers.host = 'http';
    }

    if(this.isAxios()) {
      this.instance = this.instance ? this.instance : axios.create({
        baseURL: this.url(''),
        timeout: 2000,
        // params: {
        //   api_key: "",
        //   language: ""
        // }
      });

      // Working
      this.instance.interceptors.request.use(config => {
        config.headers['Content-Type'] = contentType;
        return config;
      });

      return this.requestAxios(options, cb);
    }


    return request(options, cb);
  }

  requestAxios(options, cb) {

    if(options.method == 'GET') { return this.instance.get(options, cb) }
    else if(options.method == 'POST') { return this.instance.get(options, cb) }
    else if(options.method == 'PUT') { return this.instance.get(options, cb) }
    else if(options.method == 'DELETE') { return this.instance.get(options, cb) }
    else {
      throw new Error('not support method')
    }
  }

  url(path) {
    const protocol = this.opts.tls.cert !== null ? 'https' : 'http';
    let url = protocol + '://';

    if(this.isSocket()) {
      url = url + 'unix:' + this.opts.socket + ':';
    } else {
      url = url + this.opts.host + ':' + this.opts.port;
    }

    url = url + '/v' + this.opts.version + path;

    return url;
  }

  isSecure() {
    return this.opts.tls.cert !== null;
  }

  isSocket() {
    return this.opts.socket !== null;
  }

  isAxios() {
    return this.opts.useAxios === true;
  }

}

module.exports.Client = function(options) {
  return new Modem(options);
};
