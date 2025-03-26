const ioRedis = require("../utils/redis");
const NotificationRepository = require("../repositories/notifications.repository");

const NotificationService = {
  sendNotification: async (io, data, userOnline) => {
    const {username, type, content} = data;
    try {
      const notification = await NotificationRepository.createNewNotification(username, type, content);
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
  },
};

module.exports = NotificationService;
