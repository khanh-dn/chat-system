const express = require("express");
const router = express.Router();
const {
  getUser,
  getMyProfile,
  updateProfile,
  upload,
  getCurrentUserController,
} = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/", authenticate, getUser);
router.get("/myinfo", authenticate, getMyProfile);
router.put(
  "/update/:username",
  authenticate,
  upload.single("image"),
  updateProfile
);
router.get("/current", getCurrentUserController);

module.exports = router;
