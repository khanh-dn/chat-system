const express = require("express");
const router = express.Router();
const {getUser, getMyProfile, updateProfile} = require('../controllers/user.controller');
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/",authenticate ,getUser);
router.get("/myinfo",authenticate ,getMyProfile);
router.post("/update/:username",authenticate ,updateProfile);

module.exports = router;
