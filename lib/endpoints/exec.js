'use strict';

const schemas = require('../schemas/exec');

class VolumesClient {

  constructor(docker) {
    this.docker = docker;
  }

  create(id, options) {
    const self = this;

    options = options || {};

    return self.docker._validate(options, schemas.create.options).then((params) => {
      return self.docker.modem.post({
        url: `/containers/${id}/exec`,
        qs: params,
        body: options,
        successCodes: {
          201: 'no error'
        },
        errorCodes: {
          500: 'server error',
          404: "no such container",
          409: "container is paused",
        }
      });
    });
  }

  start(id, options) {
    const self = this;

    options = options || {};

    return self.docker._validate(options, schemas.start.options).then((params) => {
      const req = {
        url: `/exec/${id}/start`,
        qs: params,
        successCodes: {
          200: 'no error'
        },
        errorCodes: {
          404: 'no such exec instance',
          500: 'server error'
        }
      };

      params.follow = true

      if(params.follow) {
        req.method = 'POST';
        return self.docker.modem.stream(req);
      } else {
        return self.docker.modem.post(req);
      }
    });
  }

  resize(id, options) {
    const self = this;

    options = options || {};

    return self.docker._validate(options, schemas.resize.options).then((params) => {
      return self.docker.modem.post({
        url: `/exec/${id}/resize`,
        qs: params,
        successCodes: {
          204: 'no error'
        },
        errorCodes: {
          400: 'bad parameter',
          404: 'no such exec instance',
          500: 'server error'
        }
      });
    });
  }

  inspect(id, options) {
    const self = this;

    options = options || {};

    return self.docker._validate(options, schemas.remove.options).then((params) => {
      return self.docker.modem.get({
        url: `/exec/${id}/json`,
        qs: params,
        successCodes: {
          204: 'no error'
        },
        errorCodes: {
          404: 'no such exec instance',
          500: 'server error'
        }
      });
    });
  }

}

module.exports.Client = function(docker) {
  return new VolumesClient(docker);
};
