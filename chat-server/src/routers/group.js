const express = require("express");
const router = express.Router();

const {
  createGroupChatController,
  getGroupMessagesController,
  getGroupMembersController,
  getUserGroupsController
} = require("../controllers/groups.controller");

router.post("/", createGroupChatController);
router.get("/:groupId/messages", getGroupMessagesController);
router.get("/:groupId/members", getGroupMembersController)
router.get("/",getUserGroupsController)   

module.exports = router;
