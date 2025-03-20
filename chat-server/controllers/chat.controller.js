const { getMessage, deleteMessage } = require("../models/message.model");

const getAllMessage = async (req, res) => {
  try {
    const { sender, receiver } = req.params;
    const messages = await getMessage(sender, receiver);
    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteMessageController = async (req, res) => {
  try {
    const { user_id, partner_id } = req.params;
    await deleteMessage(user_id, partner_id);
    res.json({ success: true, message: "Chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAllMessage, deleteMessageController };
