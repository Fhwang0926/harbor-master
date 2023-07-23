const docker = require("../index");

const client = docker.Client({
  host: "localhost",
  port: 2375,
  axios: true,
});

let run = async () => {
  try {
    let info = await client.containers().list({
      // filters: {
      //   Name: ['test']
      // }
    });

    for (let i = 0; i < info.length; i++) {
      // get
      let con = await client.containers().inspect(info[i].Id, { size: false });
      console.log("con", con);

      let rv = await client.exec().create(con.Id, {
        "AttachStdin": true,
        "AttachStdout": true,
        "AttachStderr": true,
        "DetachKeys": "ctrl-p,ctrl-q",
        "Tty": true,
        "Cmd": [
          "bash",
          "-c",
          // "echo aa=1 > ~/aa.txt"
          "ping 1.1.1.1 -c 10"
        ],
        "Env": [
          "FOO=bar",
          "BAZ=quux"
        ]
      })

      console.log(rv)


      let rv_start = await client.exec().start(rv.Id, {
        "Detach": true,
        "Tty": true,
        "ConsoleSize": [ 80, 64 ]
      })

      console.log(rv_start)

      // if(info[i].Names[info[i].Names.length - 1].replace('/', '') != 'test') {
      //   continue
      // }

      // let rv = ''

      // test
      // rv = await client.networks().disconnect('7583571.1.5.1683988549065', { Container: 'test', Force: false });
      // console.log('post', 'disconnect', rv)

      // post
      // rv = await client.containers().stop(info[i].Names[info[i].Names.length - 1].replace('/', ''));
      // console.log('post', 'stop', rv)

      // rv = await client.containers().start(info[i].Names[info[i].Names.length - 1].replace('/', ''));
      // console.log('post', 'start', rv)

      // // delete
      // rv = await client.containers().delete(info[i].Names[info[i].Names.length - 1].replace('/', ''));
      // console.log('post', 'start', rv)
    }
  } catch (e) {
    console.log(e.body);
  }
};

run();
