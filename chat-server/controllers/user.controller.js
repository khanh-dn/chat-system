const { getOtherUser } = require("../models/user.model");

const getUser = async (req, res) => {
  try {
    const username = req.query.username;
    const users = await getOtherUser(username);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getUser };
