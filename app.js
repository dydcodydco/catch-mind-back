const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = new createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  }
});

app.get('/', (req, res) => {
  res.send('hello api');
})

require('./utils/io')(io);

httpServer.listen(3065, () => {
  console.log('서버 실행 중');
})