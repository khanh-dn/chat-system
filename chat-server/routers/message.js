const express = require("express");
const router = express.Router();

const {getAllMessage, deleteMessageController} = require('../controllers/chat.controller');
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/:sender/:receiver",authenticate ,getAllMessage);

router.delete("/chats/:sender/:receiver", deleteMessageController);

module.exports = router;