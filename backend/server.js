const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { setupWSConnection } = require('y-websocket/bin/utils');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('BrainForge WebSockets Server is running.');
});

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  // setupWSConnection handles the yjs synchronization protocol over the websocket
  // It automatically handles different documents based on the URL path
  setupWSConnection(conn, req);
});

const PORT = process.env.PORT || 1234;

server.listen(PORT, () => {
  console.log(`BrainForge WebSocket Server is running on port ${PORT}`);
});
