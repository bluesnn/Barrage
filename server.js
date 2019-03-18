const WebSocket = require('ws');
const redis = require('redis');

const client = redis.createClient();  // key value
const wss = new WebSocket.Server({port:3000});
let clientsArr = [];

wss.on('connection', ws => {
  // 数据库数据返回给前端
  clientsArr.push(ws); // 将所有通过websocket链接的用户存入数组
  client.lrange('barrages', 0, -1, (err, applies) => {
    applies = applies.map(item => JSON.parse(item));
    ws.send(JSON.stringify({
      type: 'INIT',
      data: applies
    }))
  })

  // 当服务器接收到消息时，将数据存入redis
  ws.on('message', data => {
    client.rpush('barrages', data, redis.print);
    // 再将当前这条数据返回给前端
    clientsArr.forEach(w => {
      w.send(JSON.stringify({type: 'ADD', data: JSON.parse(data)}));
    })
  });
  // 关闭监听事件
  ws.on('close', () => {
    clientsArr = clientsArr.filter(client => client != ws)
  })
})