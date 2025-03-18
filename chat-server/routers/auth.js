const express = require("express");
const router = express.Router();
const {register, login, refreshToken, logout} = require('../controllers/auth.controller');
const { authenticate } = require("../middlewares/auth.middleware");
router.post("/register", register);

router.post("/login", login);

router.post("/logout",authenticate ,logout);

router.post("/refresh_token" ,refreshToken);

module.exports = router;
