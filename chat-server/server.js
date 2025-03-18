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
const messageRouter = require("./routers/message")
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


// const client = redis.createClient(6379);
// client.on("connect", () => {
// });
// client.connect();

app.use("/auth", authRouter);

app.use("/users", userRouter);

app.use("/messages", messageRouter);

app.use("/notifications", notificationsRouter);

io.on("connection", (socket) => {
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
});

httpServer.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
