const UserService = require("../services/user.service");
const MessageService = require("../services/message.service");
const NotificationService = require("../services/notifications.service");
const GroupService = require("../services/group.service");
const ioRedis = require("../utils/redis");

const userOnline = new Map();

const setupSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("joinUser", async (username) => {
      const joinUser = await UserService.joinUser(socket, username);
      io.emit("updateUserStatus", { joinUser });
    });

    socket.on("disconnect", async () => {
      UserService.disconnectUser(socket, io);
    });

    socket.on("online", async (username) => {
      userOnline.set(username, socket.id);
      await ioRedis.set(username, "online");
      io.emit("updateUserStatus", { username, status: "online" });
    });

    socket.on("sendMessage", async (data) => {
      await MessageService.sendMessage(io, data, userOnline);
    });

    socket.on("sendNotification", async (data) => {
      await NotificationService.sendNotification(io, data, userOnline);
    });

    socket.on("sendNewMessage", ({ sender, receiver }) => {
      if (!receiver || !sender) {
        return;
      }

      io.to(receiver).emit("updateUserList", sender);

      io.to(sender).emit("updateUserList", receiver);
    });

    socket.on("sendGroupMessage", async (data) => {
      await GroupService.sendGroupMessage(io, data, userOnline);
    });
  });
};

module.exports = { setupSocket };
