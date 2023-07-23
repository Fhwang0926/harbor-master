'use strict';

const docker = require('../index');

const client = docker.Client({
  // socket: '/var/run/docker.sock'
  host: "localhost",
  port: 2375,
  // axios: true,
});

client.containers().logs('85364480fc898155ef5a7f26de3dd622512c308f26e5f8941a6f1e71b31294e5', {
  stdout: true, stderr: true, follow: true
}).then((stream) => {

  stream.on('data', (line) => {
    console.log(line);
  });

});
