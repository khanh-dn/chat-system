const pool = require("../config/db");

const getGroupMessages = async (groupId) => {
  try {
    const result = await pool.query(
      "SELECT * FROM group_messages WHERE group_id = $1 ORDER BY created_at ASC",
      [groupId]
    );
    return result.rows;
  } catch (error) {
    throw new Error("Lỗi khi lay tin nhan group chat");
  }
};

const sendGroupMessage = async (groupId, sender, message) => {
  try {
    const result = await pool.query(
      "INSERT INTO group_messages (group_id, sender, message) VALUES ($1, $2, $3) RETURNING *",
      [groupId, sender, message]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Database Error:", error); // In lỗi chi tiết
    throw new Error("Lỗi khi gửi tin nhắn group chat: " + error.message);
  }
};

module.exports = { getGroupMessages, sendGroupMessage };
