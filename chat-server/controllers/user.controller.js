const {
  getOtherUser,
  getMyInfo,
  updateUser,
  getCurrentUser,
} = require("../models/user.model");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const redis = require("redis");
const redisClient = redis.createClient();
redisClient.connect();

const imageDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: imageDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const getUser = async (req, res) => {
  try {
    const username = req.query.username;
    const users = await getOtherUser(username);
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const status = (await redisClient.get(user.username)) || "offline";
        return { ...user, status };
      })
    );

    res.json({ users: usersWithStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCurrentUserController = async (req, res) => {
  try {
    const username = req.query.username;
    const currentUsers = await getCurrentUser(username);
    const usersWithStatus = await Promise.all(
      currentUsers.map(async (user) => {
        const status = (await redisClient.get(user.username)) || "offline";
        return { ...user, status };
      })
    );
    res.json({ currentUsers: usersWithStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const username = req.query.username;
    const user = await getMyInfo(username);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const username = req.params.username;

    // Lấy dữ liệu từ FormData
    const phone = req.body.phone || null;
    const address = req.body.address || null;
    const email = req.body.email || null;

    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    const user = await updateUser(username, phone, address, email, imagePath);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUser,
  getMyProfile,
  updateProfile,
  upload,
  getCurrentUserController,
};
