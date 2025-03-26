const { createGroupChat, getUserGroups } = require("../repositories/groups.repository");
const {
  insertGroupMember,
  getGroupMembers,
} = require("../repositories/group_member.repository");
const { getGroupMessages } = require("../repositories/group_messages.repository");
const createGroupChatController = async (req, res) => {
  const { group_name, created_by, members } = req.body;

  if (!group_name || !created_by || !Array.isArray(members)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await createGroupChat(group_name, created_by);
    const groupId = result.id;

    for (const member of members) {
      try {
        await insertGroupMember(groupId, member);
      } catch (error) {
        console.error("Lỗi khi thêm thành viên:", member, error);
      }
    }
    res.status(201).json({ message: "Group created", group: result });
  } catch (error) {
    console.error("Lỗi tạo group:", error);
    res.status(500).json({ error: "Error creating group" });
  }
};
const getGroupMessagesController = async (req, res) => {
  const groupId = req.params.groupId;
  try {
    const result = await getGroupMessages(groupId);
    res.json({ messages: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error getting messages" });
  }
};

const getGroupMembersController = async (req, res) => {
  const groupId = req.params.groupId;
  try {
    const result = await getGroupMembers(groupId);
    res.json({ members: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error getting members" });
  }
};

const getUserGroupsController = async (req, res) => {
  const { username } = req.query;
  try {
    const groups = await getUserGroups(username);
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy danh sách nhóm" });
  }
};
module.exports = {
  createGroupChatController,
  getGroupMessagesController,
  getGroupMembersController,
  getUserGroupsController
};
