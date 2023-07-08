'use strict';

const Joi = require('joi');

module.exports.create = {
  options: Joi.object()
};

module.exports.start = {
  options: Joi.object()
};

module.exports.inspect = {
  options: Joi.object()
};

module.exports.resize = {
  options: Joi.object()
};
