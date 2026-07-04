require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');
const Y = require('yjs');

const { setupWSConnection, setPersistence } = require('y-websocket/bin/utils');

// Configure MongoDB Persistence if a URI is provided
if (process.env.MONGODB_URI) {
  const { MongodbPersistence } = require('y-mongodb-provider');
  const mdb = new MongodbPersistence(process.env.MONGODB_URI, {
    collectionName: 'lexel-documents',
    flushSize: 100,
    multipleCollections: true
  });

  setPersistence({
    bindState: async (docName, ydoc) => {
      try {
        const persistedYdoc = await mdb.getYDoc(docName);
        const newUpdates = Y.encodeStateAsUpdate(persistedYdoc);
        Y.applyUpdate(ydoc, newUpdates);

        ydoc.on('update', async (update) => {
          mdb.storeUpdate(docName, update);
        });
      } catch (err) {
        console.error('Error binding state to MongoDB:', err);
      }
    },
    writeState: async (docName, ydoc) => {
      try {
        await mdb.flushDocument(docName);
      } catch (err) {
        console.error('Error flushing document to MongoDB:', err);
      }
    }
  });
  console.log("Connected to MongoDB for data persistence.");
} else {
  console.log("Running in memory-only mode. Set MONGODB_URI to enable persistence.");
}

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
