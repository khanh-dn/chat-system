const pool = require("../db");

const getNotifications = async (username) => {
  try {
    const notifications = await pool.query(
      "SELECT * FROM notifications WHERE username = $1 ORDER BY created_at DESC limit 10",
      [username]
    );
    return notifications.rows;
  } catch (error) {
    throw new Error("Lỗi khi lấy thông báo");
  }
};

const createNewNotification = async (username, type, content) => {
  try {
    const newNotification = await pool.query(
      "INSERT INTO notifications (username, type, content) VALUES ($1, $2, $3) RETURNING *",
      [username, type, content]
    );
    return newNotification.rows[0];
  } catch (error) {
    throw new Error("Lỗi khi tạo thông báo");
  }
};

const markReadNotification = async (id) => {
  try {
    await pool.query("UPDATE notifications SET is_read = true WHERE id = $1", [
      id,
    ]);
  } catch (error) {
    throw new Error("Lỗi khi đánh dấu thông báo đã đọc");
  }
};

const deleteNotification = async (id) => {
  try {
    await pool.query("DELETE FROM notifications WHERE id = $1", [id]);
  } catch (error) {
    throw new Error("Lỗi khi xóa thông báo");
  }
};
module.exports = {
  getNotifications,
  createNewNotification,
  markReadNotification,
  deleteNotification,
};
