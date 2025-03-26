const {
  getNotifications,
  markReadNotification,
  deleteNotification,
} = require("../repositories/notifications.repository");

const getNotificationsController = async (req, res) => {
  const { username } = req.params;

  try {
    const notifications = await getNotifications(username);
    res.json({ notification: notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi lấy thông báo" });
  }
};

const markReadNotificationController = async (req, res) => {
  const { id } = req.params;
  try {
    await markReadNotification(id);
    res.json({ message: "Đã đọc thông báo" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi đánh dấu thông báo đã đọc" });
  }
};

const deleteNotificationController = async (req, res) => {
  const { id } = req.params;
  try {
    await deleteNotification(id);
    res.json({ message: "Đã xóa thông báo" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi xóa thông báo" });
  }
};

module.exports = {
  getNotificationsController,
  markReadNotificationController,
  deleteNotificationController,
};
