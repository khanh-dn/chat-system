const express = require("express");
const router = express.Router();

const {getAllMessage} = require('../controllers/chat.controller')

router.get("/:sender/:receiver", getAllMessage);

module.exports = router;