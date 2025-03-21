const { getMessage, deleteMessage } = require("../models/message.model");
const ioRedis = require('../utils/redis')

const getAllMessage = async (req, res) => {
  const { sender, receiver } = req.params;
  const chatKey1 = `chat:${sender}:${receiver}`;
  const chatKey2 = `chat:${receiver}:${sender}`;

  try {
    //Lay tin nhan trong cache
    let cachedMessages = await ioRedis.lrange(chatKey1, 0, -1);
    if (cachedMessages.length === 0) {
      cachedMessages = await ioRedis.lrange(chatKey2, 0, -1);
    }
    //Neu trong cache co messages
    if (cachedMessages.length > 0) {
      return res.status(200).json({ messages: cachedMessages.map(JSON.parse) });
    }
    //Neu cache khong co lay trong db
    const result = await getMessage(sender, receiver);

    const messages = result;
    if (messages.length > 0) {
      //Xoa cache cu
      await ioRedis.del(chatKey1);
      await ioRedis.del(chatKey2);
      //Luu cache moi
      await ioRedis.rpush(chatKey1, ...messages.map(JSON.stringify));
      await ioRedis.rpush(chatKey2, ...messages.map(JSON.stringify));
      //Thoi gian het han cua cache (s)
      await ioRedis.expire(chatKey1, 3600);
      await ioRedis.expire(chatKey2, 3600);
    }
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
