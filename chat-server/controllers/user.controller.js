const { getOtherUser, getMyInfo, updateUser } = require("../models/user.model");

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
    const { phone, address, email, image } = req.body;
    const user = await updateUser(username, phone, address, email, image);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
module.exports = { getUser, getMyProfile, updateProfile };
