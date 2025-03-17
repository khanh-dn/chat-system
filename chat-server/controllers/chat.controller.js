const { getMessage } = require("../models/message.model");

const getAllMessage = async (req, res) => {
  try {
    const { sender, receiver } = req.params;
    const messages = await getMessage(sender, receiver);
    res.status(200).json({ messages }); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {getAllMessage}
