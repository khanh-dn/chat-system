const express = require("express");
const router = express.Router();
const {register, login, refreshToken, logout} = require('../controllers/auth.controller')

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.post("/refresh_token", refreshToken);

module.exports = router;
