const WebSocket = require('ws');
const ws = new WebSocket('wss://lexel-backend.onrender.com/board-guest-test');

ws.on('open', function open() {
  console.log('CONNECTED TO WEBSOCKET!');
  ws.send('something');
});

ws.on('message', function incoming(data) {
  console.log('RECEIVED: ', data);
});

ws.on('error', function error(err) {
  console.error('ERROR: ', err);
});

ws.on('close', function close() {
  console.log('DISCONNECTED');
});
