const { getOtherUser, getMyInfo, updateUser } = require("../models/user.model");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

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
    res.json({ users });
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
}

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
}
module.exports = { getUser, getMyProfile, updateProfile, upload };
