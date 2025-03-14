const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
    try {
        const userName = req.query.userName;
        const users = await pool.query("SELECT * FROM users WHERE username != $1", [userName]);
        res.json(users.rows);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách người dùng" });
    }
}); 

module.exports = router;