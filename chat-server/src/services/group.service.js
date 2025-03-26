const {getMemberCheck, getGroupMembers} = require('../repositories/group_member.repository')
const {sendGroupMessage} = require('../repositories/group_messages.repository')

const GroupService = {
  sendGroupMessage: async (io, data, userOnline) => {
    try {
      const {groupId, sender, message } = data;
      const memberCheck = await getMemberCheck(groupId, sender);

      if (memberCheck.length === 0) {
        console.log("User không thuộc nhóm này:", sender);
        return;
      }

      const newMessage =await sendGroupMessage(groupId, sender, message);

      const members = await getGroupMembers(groupId);

      members.forEach((member) => {
        if (userOnline.has(member.username)) {
          io.to(userOnline.get(member.username)).emit(
            "newGroupMessage",
            newMessage
          );
        }
      });
    } catch (error) {
      console.error("Error sending group message:", error);
    }
  },
};

module.exports = GroupService;
