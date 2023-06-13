'use strict';

const EventEmitter = require('events');
const Promise      = require('bluebird');
const request      = require('request');
const _            = require('lodash');
const axios        = require('axios');
const qs        = require('qs');

class Modem {

  constructor(options) {

    const defaults = {
      axios: false,
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
    if(this.isAxios()) { options.path = options.url }
    options.method = 'GET';
    return this.http(options);
  }

  post(options) {
    if(this.isAxios()) { options.path = options.url }
    options.method = 'POST';
    return this.http(options);
  }

  put(options) {
    if(this.isAxios()) { options.path = options.url }
    options.method = 'PUT';
    return this.http(options);
  }

  destroy(options) {
    if(this.isAxios()) { options.path = options.url }
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

    if(this.opts.axios) {

      return new Promise((resolve, reject) => {
        self._request(options, (err, resp, body) => {
          if(!err && _.hasIn(codes.successCodes, resp.status)) {

            if(_.isString(body) && body) {
              console.log("body", body)
              body = JSON.parse(body);
            }

            resolve(body);
          } else {
            reject({ error: err, response: resp, body: body });
          }
        });
      });
    }

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

    // console.log('options', options)

    if(this.isAxios()) {
      this.instance = this.instance ? this.instance : axios.create({
        baseURL: this.url(''),
        timeout: 30 * 1000,
      });

      this.instance.defaults.paramsSerializer = params => {
        return qs.stringify(params);
      }


      // Working
      this.instance.interceptors.request.use(config => {
        // delete config.headers['Accept']
        // delete config.headers['Accept-encoding']

        config.headers['Cache-Control'] = 'no-cache'
        config.headers['Content-Type'] = 'application/json'
        // config.headers['Accept-Encoding'] = 'gzip, deflate, br',

        // if(config.data) {
        //   config.headers['Content-Length'] = JSON.stringify(config.data).length
        // }
        return config;
      });

      return this.requestAxios(options, cb)
    }

    // console.log('options', options)
    return request(options, cb);
  }

  async requestAxios(options, cb) {

    let path = options.path
    delete options.path
    delete options.url

    let err = ''
    let rv = ''
    let body = options.qs || {}

    if(options.body && Object.keys(options.body).length) {
      body = Object.assign({}, body, options.body);
    }

    try {
      if(options.method == 'GET') { rv =  await this.instance.get(path, { params: options.qs }) }
      else if(options.method == 'POST') { rv =  await this.instance.post(path, Object.assign({}, body),  { params: options.qs }) }
      else if(options.method == 'PUT') { rv =  await this.instance.put(path, Object.assign({}, body),  { params: options.qs }) }
      else if(options.method == 'DELETE') { rv =  await this.instance.delete(path, Object.assign({}, body),  { params: options.qs }) }
      else {
        throw new Error('not support method')
      }

    } catch (e) {
      // 500 이거나 찐 데이터 처리 오류
      err = e;
      // console.log(JSON.stringify(e))
      // if(e.response) {
      //   return cb(e.response.status == 500 && !e.response.data ? err : '', e.response, e.response.data)
      // }

      return cb(e.response.status == 500 && !e.response.data ? err : '', e.response, e.response.data)
    }


    return cb(err, rv, rv.data)
  }

  url(path) {
    const protocol = this.opts.tls.cert !== null ? 'https' : 'http';
    let url = protocol + '://';

    if(this.isSocket()) {
      url = url + 'unix:' + this.opts.socket + ':';
    } else {
      url = url + this.opts.host + ':' + this.opts.port;
    }

    url = url + '' + (this.opts.axios ? '' : `/v${this.opts.version}`) + path;

    return url;
  }

  isSecure() {
    return this.opts.tls.cert !== null;
  }

  isSocket() {
    return this.opts.socket !== null;
  }

  isAxios() {
    return this.opts.axios === true;
  }

}

module.exports.Client = function(options) {
  return new Modem(options);
};
