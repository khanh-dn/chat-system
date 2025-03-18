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

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/messages", messageRouter);
app.use("/notifications", notificationsRouter);

// Biến lưu user socket ID
const users = {};

io.on("connection", (socket) => {
  // Khi user đăng nhập, lưu socket ID của họ
  socket.on("registerUser", (username) => {
    users[username] = socket.id;
    console.log(`✅ ${username} đã kết nối với socket ID: ${socket.id}`);
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

      if (users[username]) {
        io.to(users[username]).emit("newNotification", notification);
        console.log(`📩 Gửi thông báo real-time cho user ${username}`);
      } else {
        console.log(`⚠️ User ${username} không online, không thể gửi real-time.`);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  });

  socket.on("disconnect", () => {
    const disconnectedUser = Object.keys(users).find((key) => users[key] === socket.id);
    if (disconnectedUser) {
      delete users[disconnectedUser];
      console.log(`⚠️ User ${disconnectedUser} đã ngắt kết nối.`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log("🚀 Server is running on port " + PORT);
});
