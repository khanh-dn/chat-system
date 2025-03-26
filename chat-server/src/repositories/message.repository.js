const pool = require("../config/db");
const ioRedis = require("../utils/redis");

const MessageRepository = {
  async createMessage(sender, receiver, message) {
    try {
      const result = await pool.query(
        "INSERT INTO messages (sender, receiver, message) VALUES ($1, $2, $3) RETURNING *",
        [sender, receiver, message]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error sending message:", error);
    }
  },
  async getMessageBetweenUsers(sender, receiver) {
    try {
      const result = await pool.query(
        `SELECT * FROM messages
              WHERE ((sender = $1 AND receiver = $2) OR (sender = $2 AND receiver = $1))
              AND NOT deleted_by @> to_jsonb($1)::jsonb
              ORDER BY created_at ASC`,
        [sender, receiver]
      );

      return result.rows;
    } catch (error) {
      throw new Error("Lỗi khi lấy tin nhắn");
    }
  },
  async deleteMessageBetweenUsers(sender, receiver) {
    const chatKey = `chat:${[sender, receiver].sort().join(":")}`;

    try {
      // Cập nhật danh sách deleted_by
      await pool.query(
        `
        UPDATE messages
        SET deleted_by = (
          SELECT jsonb_agg(DISTINCT x)
          FROM jsonb_array_elements_text(deleted_by || to_jsonb($1)::jsonb) x
        )
        WHERE ((sender = $1 AND receiver = $2) OR (sender = $2 AND receiver = $1))
        AND NOT deleted_by @> to_jsonb($1)::jsonb
        `,
        [sender, receiver]
      );

      // Kiểm tra nếu cả hai người đều xóa thì xóa hoàn toàn tin nhắn
      const checkDeleted = await pool.query(
        `
        SELECT COUNT(*) FROM messages
        WHERE ((sender = $1 AND receiver = $2) OR (sender = $2 AND receiver = $1))
        AND deleted_by @> to_jsonb($1)::jsonb
        AND deleted_by @> to_jsonb($2)::jsonb
        `,
        [sender, receiver]
      );

      if (checkDeleted.rows[0].count > 0) {
        // Nếu cả hai user đã xóa, xóa hoàn toàn khỏi database và Redis
        await pool.query(
          `DELETE FROM messages
          WHERE ((sender = $1 AND receiver = $2) OR (sender = $2 AND receiver = $1))
          AND deleted_by @> to_jsonb($1)::jsonb
          AND deleted_by @> to_jsonb($2)::jsonb`,
          [sender, receiver]
        );

        await ioRedis.del(chatKey);
      } else {
        // Nếu chỉ một user xóa, cập nhật cache để họ không thấy tin nhắn nữa
        let cachedMessages = await ioRedis.lrange(chatKey, 0, -1);
        if (cachedMessages.length > 0) {
          cachedMessages = cachedMessages
            .map(JSON.parse)
            .map((msg) => ({
              ...msg,
              deleted_by: [...new Set([...(msg.deleted_by || []), sender])], // Thêm sender vào deleted_by
            }))
            .filter((msg) => !msg.deleted_by.includes(sender));

          await ioRedis.del(chatKey);
          if (cachedMessages.length > 0) {
            await ioRedis.rpush(chatKey, ...cachedMessages.map(JSON.stringify));
            await ioRedis.expire(chatKey, 3600);
          }
        }
      }
    } catch (error) {
      console.error("Lỗi khi xóa tin nhắn:", error);
      throw new Error("Lỗi khi xóa tin nhắn");
    }
  },
};

module.exports = MessageRepository;
