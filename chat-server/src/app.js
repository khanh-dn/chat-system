require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const authRouter = require("./routers/auth");
const userRouter = require("./routers/user");
const messageRouter = require("./routers/message");
const notificationsRouter = require("./routers/notifications");
const groupRouter = require("./routers/group");
const { authenticate } = require("./middlewares/auth.middleware");

const app = express();

//Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

//Routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/auth", authRouter);
app.use(authenticate);
app.use("/users", userRouter);
app.use("/messages", messageRouter);
app.use("/notifications", notificationsRouter);
app.use("/groups", groupRouter);

module.exports = app;

