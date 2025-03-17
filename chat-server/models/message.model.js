const pool = require("../db");

const getMessage = async (sender, receiver) => {
  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE (sender = $1 AND receiver = $2) OR (sender = $2 AND receiver = $1) ORDER BY created_at ASC",
      [sender, receiver]
    );

    return result.rows;
  } catch (error) {
    throw new Error("Lỗi khi lấy tin nhắn");
  }
};

module.exports = {getMessage}
