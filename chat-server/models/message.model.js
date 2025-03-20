const pool = require("../db");

const getMessage = async (sender, receiver) => {
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
};

const deleteMessage = async (user_id, partner_id) => {
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
      [user_id, partner_id]
    );

    // Kiểm tra nếu cả hai người đều xóa thì xóa hoàn toàn tin nhắn
    await pool.query(
      `
      DELETE FROM messages
      WHERE ((sender = $1 AND receiver = $2) OR (sender = $2 AND receiver = $1))
      AND deleted_by @> to_jsonb($1)::jsonb
      AND deleted_by @> to_jsonb($2)::jsonb
      `,
      [user_id, partner_id]
    );
  } catch (error) {
    console.error("Lỗi khi xóa tin nhắn:", error);
    throw new Error("Lỗi khi xóa tin nhắn");
  }
};

module.exports = { getMessage, deleteMessage };
