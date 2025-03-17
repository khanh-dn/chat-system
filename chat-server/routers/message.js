const express = require("express");
const router = express.Router();

const {getAllMessage} = require('../controllers/chat.controller');
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/:sender/:receiver",authenticate ,getAllMessage);

module.exports = router;