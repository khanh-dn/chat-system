const MessageRepository = require("../repositories/message.repository");
const ioRedis = require("../utils/redis");

const getAllMessage = async (req, res) => {
  const { sender, receiver } = req.params;
  const chatKey = `chat:${[sender, receiver].sort().join(":")}`;

  try {
    // Lấy tin nhắn từ Redis cache
    let cachedMessages = await ioRedis.lrange(chatKey, 0, -1);
    if (cachedMessages.length > 0) {
      // Parse và lọc tin nhắn bị xóa bởi sender
      cachedMessages = cachedMessages
        .map(JSON.parse)
        .filter((msg) => !msg.deleted_by || !msg.deleted_by.includes(sender));

      return res.status(200).json({ messages: cachedMessages });
    }

    //Neu cache khong co lay trong db
    const result = await MessageRepository.getMessageBetweenUsers(
      sender,
      receiver
    );
    const messages = result.map((msg) => ({
      ...msg,
      deleted_by: msg.deleted_by || [], // Đảm bảo deleted_by luôn là mảng
    }));

    if (messages.length > 0) {
      // Xóa cache cũ và cập nhật cache mới
      await ioRedis.del(chatKey);
      await ioRedis.rpush(chatKey, ...messages.map(JSON.stringify));
      await ioRedis.expire(chatKey, 3600); // Cache 1 giờ
    }
    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteMessageController = async (req, res) => {
  try {
    const { sender, receiver } = req.params;
    await MessageRepository.deleteMessageBetweenUsers(sender, receiver);
    res.json({ success: true, message: "Chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getAllMessage, deleteMessageController };
