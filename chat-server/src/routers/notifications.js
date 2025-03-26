const express = require("express");
const router = express.Router();

const {
  getNotificationsController,
  markReadNotificationController,
  deleteNotificationController,
} = require("../controllers/notifications.controller");

router.get("/:username", getNotificationsController);
router.put("/:id/read", markReadNotificationController);
router.delete("/:id", deleteNotificationController);

module.exports = router;
