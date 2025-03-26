const http = require('http');
const { Server } = require("socket.io");
const app = require('./app')
const { setupSocket} = require('../src/sockets/chat.socket')

const PORT = process.env.PORT;

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

setupSocket(io);

httpServer.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});



