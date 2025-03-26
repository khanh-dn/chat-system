const pool = require("../config/db");
const ioRedis = require("../utils/redis");
const MessageRepository = require('../repositories/message.repository')

const sendMessage = async (io, data, userOnline) => {
  try {
    const {sender,receiver,message} = data;
    const newMessage = await MessageRepository.createMessage(sender,receiver,message)

    const chatKey1 = `chat:${sender}:${receiver}`;
    const chatKey2 = `chat:${receiver}:${sender}`;

    await ioRedis.rpush(chatKey1, JSON.stringify(newMessage));
    await ioRedis.rpush(chatKey2, JSON.stringify(newMessage));
    await ioRedis.ltrim(chatKey1, -50, -1);
    await ioRedis.ltrim(chatKey2, -50, -1);

    if (!newMessage.group_id) {
      io.to(userOnline.get(receiver)).emit("newMessage", newMessage);
      io.to(userOnline.get(sender)).emit("newMessage", newMessage);
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
};



const sendGroupMessage = async (io, groupId, sender, message, userOnline) => {
  try {
    const memberCheck = await pool.query(
      "SELECT * FROM group_members WHERE group_id = $1 AND username = $2",
      [groupId, sender]
    );

    if (memberCheck.rows.length === 0) {
      console.log("User không thuộc nhóm này:", sender);
      return;
    }

    const result = await pool.query(
      "INSERT INTO group_messages (group_id, sender, message) VALUES ($1, $2, $3) RETURNING *",
      [groupId, sender, message]
    );
    const newMessage = result.rows[0];

    const members = await pool.query(
      "SELECT username FROM group_members WHERE group_id = $1",
      [groupId]
    );

    members.rows.forEach((member) => {
      if (userOnline.has(member.username)) {
        io.to(userOnline.get(member.username)).emit("newGroupMessage", newMessage);
      }
    });
  } catch (error) {
    console.error("Error sending group message:", error);
  }
};

module.exports = { sendMessage, sendGroupMessage };
