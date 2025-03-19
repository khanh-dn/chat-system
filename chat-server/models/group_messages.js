const pool = require("../db");

const getGroupMessages = async (groupId) => {
  try {
    const result = await pool.query(
      "SELECT * FROM group_messages WHERE group_id = $1 ORDER BY created_at ASC",
      [groupId]
    );
    return result.rows
  } catch (error) {
    throw new Error("Lỗi khi lay tin nhan group chat");
  }
};

module.exports = {getGroupMessages}
