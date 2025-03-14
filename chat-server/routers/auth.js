const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });
        }

        const user = await pool.query(
            "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
            [username, password]
        );

        res.json(user.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi đăng ký" });
    }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND password = $2",
      [username, password]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }

    res.json(user.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi đăng nhập" });
  }
});

module.exports = router;