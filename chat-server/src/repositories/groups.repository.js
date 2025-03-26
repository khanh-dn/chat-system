const pool = require("../config/db");

const createGroupChat = async (group_name, created_by) => {
  try {
    const result = await pool.query(
      "INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *",
      [group_name, created_by]
    );
    return result.rows[0];
  } catch (error) {
    throw new Error("Lỗi khi tao group chat");
  }
};

const getUserGroups = async (username) => {
    try {
      const result = await pool.query(
        `SELECT g.* FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.username = $1`,
        [username]
      );
      return result.rows;
    } catch (error) {
      throw new Error("Lỗi khi lấy danh sách nhóm của người dùng");
    }
  };
module.exports = { createGroupChat, getUserGroups };
