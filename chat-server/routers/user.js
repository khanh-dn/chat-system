const express = require("express");
const router = express.Router();
const {getUser, getMyProfile, updateProfile, upload} = require('../controllers/user.controller');
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/",authenticate ,getUser);
router.get("/myinfo",authenticate ,getMyProfile);
router.put("/update/:username",authenticate ,upload.single("image"),updateProfile);

module.exports = router;
