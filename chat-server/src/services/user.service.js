const ioRedis = require("../utils/redis");

const userOnline = new Map();

const UserService = {
  joinUser: async (socket, username) => {
    if (!username) return;
    socket.join(username);
    userOnline.set(username, socket.id);
    await ioRedis.set(username, "online");
    return { username, status: "online" };
  },

  disconnectUser: async (socket, io) => {
    const username = [...userOnline.entries()].find(
      ([, id]) => id === socket.id
    )?.[0];

    if (username && userOnline.get(username) === socket.id) {
      userOnline.delete(username);
      await ioRedis.del(username);
      io.emit("updateUserStatus", { username, status: "offline" });
    }
  },

  checkUserOnline: async (username) => {
    return userOnline.has(username) || (await ioRedis.get(username)) === "online";
  },

  getUserSocket: (username) => userOnline.get(username),
};

module.exports = UserService;
