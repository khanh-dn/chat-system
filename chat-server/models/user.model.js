const pool = require("../db");

const createUser = async (username, password) => {
  try {
    const existingUser = await findByUsername(username);

    if (existingUser > 0) {
      return { error: "Tên đăng nhập đã tồn tại" };
    }

    const user = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      [username, password]
    );

    return user.rows[0];
  } catch (error) {
    return { error: "Lỗi khi đăng ký" };
  }
};

const findByUsername = async (username) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    throw new Error("Lỗi server");
  }
};

const getOtherUser = async (username) => {
  try {
    const users = await pool.query("SELECT * FROM users WHERE username != $1", [
      username,
    ]);
    return users.rows;
  } catch (error) {
    throw new Error("Lỗi khi lấy danh sách người dùng");
  }
};

module.exports = { createUser, findByUsername, getOtherUser };
