require("dotenv").config();
const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("http");
const cookieParser = require("cookie-parser");
const cors = require("cors");
var pool = require("./db");

const authRouter = require("./routers/auth");
const userRouter = require("./routers/user");
const messageRouter = require("./routers/message");
const notificationsRouter = require("./routers/notifications");
const groupRouter = require("./routers/group");
const ioRedis = require("./utils/redis");

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
app.use("/groups", groupRouter);

// Biến lưu user socket ID
const userOnline = new Map();

io.on("connection", (socket) => {
  socket.on("joinUser", async (username) => {
    if (!username) {
      return;
    }
    socket.join(username);

    userOnline.set(username, socket.id);
    await ioRedis.set(username, "online");

    io.emit("updateUserStatus", { username, status: "online" });
  });

  socket.on("disconnect", async () => {
    const username = [...userOnline.entries()].find(
      ([, id]) => id === socket.id
    )?.[0];

    if (username) {
      // Chỉ xóa nếu đây là kết nối cuối cùng của user
      if (userOnline.get(username) === socket.id) {
        userOnline.delete(username);
        await ioRedis.del(username, "online");
        io.emit("updateUserStatus", { username, status: "offline" });
      }
    }
  });

  socket.on("online", async (username) => {
    userOnline.set(username, socket.id);

    await ioRedis.set(username, "online");

    io.emit("updateUserStatus", { username, status: "online" });
  });

  socket.on("sendMessage", async ({ sender, receiver, message }) => {
    try {
      const result = await pool.query(
        "INSERT INTO messages (sender, receiver, message) VALUES ($1, $2, $3) RETURNING *",
        [sender, receiver, message]
      );
      const newMessage = result.rows[0];

      const chatKey1 = `chat:${sender}:${receiver}`;
      const chatKey2 = `chat:${receiver}:${sender}`;
      //Them tin nhan moi vao cuoi danh sach
      await ioRedis.rpush(chatKey1, JSON.stringify(newMessage));
      await ioRedis.rpush(chatKey2, JSON.stringify(newMessage));

      await ioRedis.ltrim(chatKey1, -50, -1);
      await ioRedis.ltrim(chatKey2, -50, -1);

      if (!newMessage.group_id) {
        // Đảm bảo chỉ phát sự kiện tin nhắn riêng
        io.to(userOnline.get(receiver)).emit("newMessage", newMessage);
        io.to(userOnline.get(sender)).emit("newMessage", newMessage);
      }
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
      let userSocket = userOnline.get(username);

      // Nếu không tìm thấy trong userOnline, kiểm tra lại Redis
      if (!userSocket) {
        const isOnline = await ioRedis.get(username);
        if (isOnline === "online") {
          // Nếu Redis báo online nhưng userOnline không có, cập nhật lại
          console.log(
            `User ${username} online nhưng thiếu socket ID, cập nhật lại.`
          );
          userSocket = socket.id;
          userOnline.set(username, userSocket);
        }
      }
      if (userOnline.has(username)) {
        io.to(userOnline.get(username)).emit("newNotification", notification);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  });

  socket.on("sendNewMessage", ({ sender, receiver }) => {
    if (!receiver || !sender) {
      return;
    }

    io.to(receiver).emit("updateUserList", sender);

    io.to(sender).emit("updateUserList", receiver);
  });

  socket.on("sendGroupMessage", async ({ groupId, sender, message }) => {
    try {
      // Kiểm tra sender có trong nhóm không
      const memberCheck = await pool.query(
        "SELECT * FROM group_members WHERE group_id = $1 AND username = $2",
        [groupId, sender]
      );

      if (memberCheck.rows.length === 0) {
        console.log("User không thuộc nhóm này:", sender);
        return;
      }

      const result = await pool.query(
        "INSERT INTO group_messages (group_id, sender, message) VALUES ($1, $2, $3) RETURNING *",
        [groupId, sender, message]
      );
      const newMessage = result.rows[0];

      // Lấy danh sách thành viên trong nhóm
      const members = await pool.query(
        "SELECT username FROM group_members WHERE group_id = $1",
        [groupId]
      );

      members.rows.forEach((member) => {
        if (userOnline.has(member.username)) {
          io.to(userOnline.get(member.username)).emit(
            "newGroupMessage",
            newMessage
          );
        }
      });
    } catch (error) {
      console.error("Error sending group message:", error);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
