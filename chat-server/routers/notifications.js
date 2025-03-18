const express = require("express");
const router = express.Router();

const {
  getNotificationsController,
  createNotificationController,
  markReadNotificationController,
  deleteNotificationController,
} = require("../controllers/notifications.controller");

router.get("/:username", getNotificationsController);
router.post("/", createNotificationController);
router.put("/:id/read", markReadNotificationController);
router.delete("/:id", deleteNotificationController);

module.exports = router;
