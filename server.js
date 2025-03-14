require('dotenv').config();
const express = require('express');
const redis = require('redis');
const { Server } = require('socket.io');
const { createServer } = require("http");
const cors = require("cors");
var pool = require('./db');
const authRouter = require('./routers/auth');
const userRouter = require('./routers/user');

const PORT = process.env.PORT;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const client = redis.createClient(6379);
client.on('connect', () => {
  console.log('Connected to Redis');
});
client.connect();

app.use('/auth', authRouter);

app.use('/users', userRouter);

//Lay tin nhan
app.get("/messages/:sender/:receiver", async (req, res) => {
  const { sender, receiver } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE (sender = $1 AND receiver = $2) OR (sender = $2 AND receiver = $1) ORDER BY created_at ASC",
      [sender, receiver]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy tin nhắn" });
  }
});

io.on('connection', (socket) => {

  socket.on('sendMessage', async ({ sender, receiver, message }) => {
    try {
      const result = await pool.query(
        "INSERT INTO messages (sender, receiver, message) VALUES ($1, $2, $3) RETURNING *",
        [sender, receiver, message]
      );
      const newMessage = result.rows[0];

      io.emit('newMessage', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});

