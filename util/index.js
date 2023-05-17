const docker = require("../index");

const client = docker.Client({
  host: "console.3vi.one",
  port: 65533,
  axios: true,
});

let run = async () => {
  try {
    let info = await client.containers().list({
      filters: {
        Name: ['test']
      }
    });

    for (let i = 0; i < info.length; i++) {
      // get
      let con = await client.containers().inspect(info[i].Id, { size: false });
      console.log("con", con.SizeRw);

      if(info[i].Names[info[i].Names.length - 1].replace('/', '') != 'test') {
        continue
      }

      let rv = ''

      // test
      rv = await client.networks().disconnect('7583571.1.5.1683988549065', { Container: 'test', Force: false });
      console.log('post', 'disconnect', rv)

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
    console.log(e);
  }
};

run();
