"use client";
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Link from "next/link";
import api from "../utils/axiosInstance";
import Image from "next/image";
import { format } from "date-fns";
import vi from "date-fns/locale/vi";

const formatTime = (timestamp) => {
  return format(new Date(timestamp), "dd/MM/yyyy HH:mm", { locale: vi });
};

const socket = io("http://localhost:3001", {
  reconnection: true,       // Bật tự động kết nối lại
  reconnectionAttempts: 5,  // Số lần thử lại (có thể tăng)
  reconnectionDelay: 1000,  // Thời gian chờ giữa mỗi lần thử lại (ms)
  transports: ["websocket"], // Chỉ dùng WebSocket, tránh lỗi polling
});

export default function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiver, setReceiver] = useState("");
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [currentUsers, setCurrentUsers] = useState([]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit("heartbeat", { user: user });
      }
    }, 1000*60*10); // Gửi mỗi 10 giây
  
    return () => clearInterval(interval); // Clear interval khi component bị unmount
  }, [user]);

  useEffect(() => {
    if (!user) return;
    socket.emit("online", user);

    const fetchCurrentUsers = async () => {
      try {
        const currentRes = await api.get(`/users/current?username=${user}`);
        setCurrentUsers(currentRes.data.currentUsers);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchUsersAndGroups = async () => {
      try {
        const userRes = await api.get(`/users?username=${user}`);
        setUsers(userRes.data.users);
        const groupRes = await api.get(`/groups?username=${user}`);
        setGroups(groupRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCurrentUsers();
    fetchUsersAndGroups();

    socket.on("updateUserStatus", fetchCurrentUsers);

    return () => {
      socket.off("updateUserStatus");
    };
  }, [user]);

  useEffect(() => {
    if (!receiver && !activeGroup) return;
    const fetchMessages = async () => {
      try {
        const endpoint = activeGroup
          ? `/groups/${activeGroup}/messages`
          : `/messages/${user}/${receiver}`;
        const res = await api.get(endpoint);
        setMessages(res.data.messages);
      } catch (err) {
        console.error(err);
      }
    };

    setMessages([]);
    fetchMessages();

    socket.on("newMessage", (message) => {
      if (message.receiver === receiver || message.sender === receiver) {
        setMessages((prev) => [...prev, message]);
      }
    });
    socket.on("newGroupMessage", (message) => {
      if (message.group_id === activeGroup) {
        setMessages((prev) => [...prev, message]);
      }
    });
    return () => {
      socket.off("newMessage");
      socket.off("newGroupMessage");
    };
  }, [user, receiver, activeGroup]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get(`/notifications/${user}`);
        setNotifications(res.data.notification);
      } catch (err) {
        console.error(err);
      }
    };
    setNotifications([]);
    fetchNotifications();
    socket.on("newNotification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socket.off("newNotification");
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      socket.emit("joinUser", user);
    }
  }, [user]);

  useEffect(() => {

    socket.on("updateUserList", (newUser) => {

      if (!newUser) {
        return;
      }

      setCurrentUsers((prevUsers) => {
        if (prevUsers.some((u) => u.username === newUser)) {
          return [...prevUsers]; // Cập nhật state để React render lại
        }
        return [
          ...prevUsers,
          { id: Date.now(), username: newUser, status: "online" },
        ];
      });
    });

    return () => {
      socket.off("updateUserList");
    };
  }, []);

  useEffect(() => {
    if (!activeGroup) return;
    const fetchGroupMembers = async () => {
      try {
        const res = await api.get(`/groups/${activeGroup}/members`);
        setGroupMembers(res.data.members);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroupMembers();
  }, [activeGroup]);

  const sendMessage = () => {
    if (newMessage.trim() === "") return;

    if (activeGroup) {
      socket.emit("sendGroupMessage", {
        groupId: activeGroup,
        sender: user,
        message: newMessage,
      });
    } else if (receiver) {
      socket.emit("sendMessage", {
        sender: user,
        receiver,
        message: newMessage,
      });

      if (user !== receiver) {
        socket.emit("sendNewMessage", { sender: user, receiver });
        socket.emit("sendNotification", {
          username: receiver,
          type: "message",
          content: `Bạn có một tin nhắn mới từ ${user}`,
        });
      }
    }

    setNewMessage("");
  };

  const handleLogout = async () => {
    try {
      await api.post(`/auth/logout?username=${user}`, {});
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    window.location.href = "/";
  };

  const markNotificationAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((noti) => (noti.id === id ? { ...noti, is_read: true } : noti))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="flex w-full max-w-5xl h-[80vh] bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Danh sách người dùng */}
        <div className="w-1/4 bg-gray-200 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">Nhóm</h2>
          <ul>
            {groups.map((group) => (
              <li
                key={group.id}
                className={`p-2 rounded cursor-pointer ${
                  activeGroup === group.id
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-300"
                }`}
                onClick={() => {
                  setActiveGroup(group.id);
                  setReceiver(null);
                }}
              >
                {group.name}
              </li>
            ))}
          </ul>
          <h2 className="text-lg font-semibold mb-4">Người dùng</h2>
          <ul>
            {currentUsers.map((u) => (
              <li
                key={u.id}
                className={`p-2 rounded cursor-pointer flex items-center gap-2 ${
                  receiver === u.username
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-300"
                }`}
                onClick={() => {
                  setReceiver(u.username);
                  setActiveGroup(null);
                }}
              >
                <div className="flex items-center gap-x-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      width={48}
                      height={48}
                      src={
                        u.image
                          ? `http://localhost:3001${u.image}`
                          : "/image/avatar-default.jpg"
                      }
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Tên người dùng */}
                  <span className="text-sm font-medium text-gray-900">
                    {u.username}
                  </span>

                  {/* Chấm trạng thái (online/offline) */}
                  <span
                    className={`w-3 h-3 rounded-full ${
                      u.status === "online" ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {/* Khung Chat */}
        <div className="flex flex-col w-3/4 p-6">
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h1 className="text-lg font-semibold">Chat App</h1>
            <div className="relative">
              <button
                className="text-blue-500 hover:underline"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔 ({notifications.filter((noti) => !noti.is_read).length})
              </button>
              {showNotifications && (
                <div className="absolute top-8 right-0 bg-white shadow-lg p-3 rounded-md w-60">
                  <h3 className="text-sm font-semibold border-b pb-2">
                    Thông báo
                  </h3>
                  {/* Hiển thị thông báo */}
                  {showNotifications && (
                    <div className="absolute top-10 right-0 bg-white shadow-lg p-3 rounded-md w-60 z-20 border">
                      <h3 className="text-sm font-semibold border-b pb-2">
                        Thông báo
                      </h3>
                      <ul className="max-h-40 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((noti, index) => (
                            <li
                              key={index}
                              className={`p-3 border-b text-sm rounded-md cursor-pointer transition-all ${
                                noti.is_read
                                  ? "text-gray-500 bg-gray-100"
                                  : "font-bold text-black bg-blue-50"
                              } hover:bg-blue-100`}
                              onClick={() => markNotificationAsRead(noti.id)}
                            >
                              <div className="flex justify-between items-center">
                                <span>{noti.content}</span>
                                <span className="text-xs text-gray-500">
                                  {formatTime(noti.created_at)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400">
                                {noti.is_read ? "(Đã đọc)" : "(Chưa đọc)"}
                              </div>
                            </li>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm p-2">
                            Không có thông báo.
                          </p>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Link href="/profile" className="text-blue-500 hover:underline">
              {user}
            </Link>
          </div>
          {/* Ô tìm kiếm người dùng */}
          <div className="relative w-full mt-2">
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
            />
            {searchUser && (
              <ul className="absolute z-10 w-full bg-white border rounded shadow-md max-h-40 overflow-y-auto mt-1">
                {users
                  .filter((u) =>
                    u.username.toLowerCase().includes(searchUser.toLowerCase())
                  )
                  .map((u) => (
                    <li
                      key={u.id}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => {
                        setReceiver(u.username);
                        setSearchUser("");
                      }}
                    >
                      {u.username}
                    </li>
                  ))}
              </ul>
            )}
          </div>
          {receiver || activeGroup ? (
            <>
              <h2 className="text-center text-lg font-semibold mb-2">
                {activeGroup
                  ? `Nhóm: ${groups.find((g) => g.id === activeGroup)?.name}`
                  : receiver
                  ? `Chat với ${receiver}`
                  : "Chọn một cuộc trò chuyện"}
              </h2>
              <div className="flex-1 overflow-y-auto border rounded-md p-3 bg-gray-50">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      msg.sender === user ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Hiển thị tên người gửi nếu là group chat */}
                    {activeGroup && msg.sender !== user && (
                      <span className="text-sm font-semibold text-gray-700">
                        {msg.sender}
                      </span>
                    )}
                    <div
                      className={`px-4 py-2 rounded-lg shadow ${
                        msg.sender === user
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex mt-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="border p-2 w-full rounded-l focus:outline-none focus:ring focus:ring-blue-300"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 transition"
                >
                  Gửi
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 flex-1 flex items-center justify-center">
              Hãy chọn một người để chat!
            </p>
          )}
          <button
            onClick={handleLogout}
            className="mt-4 bg-red-500 text-white px-4 py-2 w-full rounded hover:bg-red-600 transition"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
