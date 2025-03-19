require("dotenv").config();
const express = require("express");
const redis = require("redis");
const { Server } = require("socket.io");
const { createServer } = require("http");
const cookieParser = require("cookie-parser");
const cors = require("cors");
var pool = require("./db");
const authRouter = require("./routers/auth");
const userRouter = require("./routers/user");
const messageRouter = require("./routers/message");
const notificationsRouter = require("./routers/notifications");
const path = require("path");

const PORT = process.env.PORT;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
const redisClient = redis.createClient();
redisClient.connect();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/messages", messageRouter);
app.use("/notifications", notificationsRouter);

// Biến lưu user socket ID
const userOnline = new Map();

io.on("connection", (socket) => {

  socket.on("disconnect", async () => {
    const username = [...userOnline.entries()].find(
      ([, id]) => id === socket.id
    )?.[0];

    if (username) {
      userOnline.delete(username);
      await redisClient.del(username, "online");

      io.emit("updateUserStatus", { username, status: "offline" });
    }
  });

  socket.on("registerUser", async (username) => {
    userOnline.set(username, socket.id);
    await redisClient.set(username, "online");
  
    io.emit("updateUserStatus", { username, status: "online" });
  });

  socket.on("sendMessage", async ({ sender, receiver, message }) => {
    try {
      const result = await pool.query(
        "INSERT INTO messages (sender, receiver, message) VALUES ($1, $2, $3) RETURNING *",
        [sender, receiver, message]
      );
      const newMessage = result.rows[0];

      io.emit("newMessage", newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("sendNotification", async ({ username, type, content }) => {
    try {
      const result = await pool.query(
        "INSERT INTO notifications (username, type, content) VALUES ($1, $2, $3) RETURNING *",
        [username, type, content]
      );
      const notification = result.rows[0];

      if (userOnline[username]) {
        io.to(userOnline[username]).emit("newNotification", notification);
        console.log(`📩 Gửi thông báo real-time cho user ${username}`);
      } else {
        console.log(`⚠️ User ${username} không online, không thể gửi real-time.`);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
