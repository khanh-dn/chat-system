const pool = require("../db");

const createUser = async (username, password, phone, address, email) => {
  try {
    const existingUser = await findByUsername(username);

    if (existingUser) {
      return { error: "Tên đăng nhập đã tồn tại" };
    }

    const user = await pool.query(
      "INSERT INTO users (username, password, phone, address, email) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [username, password, phone, address, email]
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

const getMyInfo = async (username) => {
  try {
    const user = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    return user.rows[0];
  } catch (error) {
    throw new Error("Lỗi khi lấy thông tin người dùng");
  }
};

const updateUser = async (username, phone, address, email, image) => {
  try {
    let query = "UPDATE users SET phone = $1, address = $2, email = $3";
    let values = [phone, address, email];

    if (image) {
      query += ", image = $4 WHERE username = $5 RETURNING *";
      values.push(image, username);
    } else {
      query += " WHERE username = $4 RETURNING *";
      values.push(username);
    }

    const user = await pool.query(query, values);
    return user.rows[0];
  } catch (error) {
    throw new Error("Lỗi khi cập nhật thông tin người dùng");
  }
};
module.exports = { createUser, findByUsername, getOtherUser, getMyInfo, updateUser};
