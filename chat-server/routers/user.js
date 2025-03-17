const express = require("express");
const router = express.Router();
const {getUser} = require('../controllers/user.controller');
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/",authenticate ,getUser);

module.exports = router;
