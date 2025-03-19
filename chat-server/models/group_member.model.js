const pool = require("../db");

const insertGroupMember = async (groupId, member) => {
  try {
    await pool.query(
      "INSERT INTO group_members (group_id, username) VALUES ($1, $2)",
      [groupId, member]
    );
  } catch (error) {
    throw new Error("Loi khi insert member");
  }
};

const getGroupMembers = async (groupId) => {
    try {
      const result = await pool.query(
        "SELECT * FROM group_members WHERE group_id = $1",
        [groupId]
      );
      return result.rows;
    } catch (error) {
      throw new Error("Lỗi khi lay tin nhan group chat");
    }
  };
module.exports = { insertGroupMember, getGroupMembers };
