"use client";
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Link from "next/link";
import api from "../utils/axiosInstance";
import Image from "next/image";

const socket = io("http://localhost:3001");

export default function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiver, setReceiver] = useState("");
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    socket.emit("registerUser", user);
    const fetchUsers = async () => {
      try {
        const res = await api.get(`/users?username=${user}`);
        setUsers(res.data.users);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();

    socket.on("updateUserStatus", async (data) => {
      console.log("Received updateUserStatus:", data);
      try {
        const res = await api.get(`/users?username=${user}`);
        setUsers(res.data.users);
      } catch (err) {
        console.error("Error updating users:", err);
      }
    });

    return () => {
      socket.off("updateUserStatus");
    };
  }, [user]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!receiver) return;
      try {
        const res = await api.get(`/messages/${user}/${receiver}`);
        setMessages(res.data.messages);
      } catch (err) {
        console.error(err);
      }
    };

    setMessages([]);
    fetchMessages();

    socket.on("newMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, [user, receiver]);

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

  const sendMessage = () => {
    if (newMessage.trim() === "") return;
    socket.emit("sendMessage", { sender: user, receiver, message: newMessage });
    socket.emit("registerUser", user);
    if (user !== receiver) {
      socket.emit("sendNotification", {
        username: receiver,
        type: "message",
        content: `Bạn có một tin nhắn mới từ ${user}`,
      });
    }

    setNewMessage("");
  };

  const handleLogout = async () => {
    try {
      await api.post(`/auth/logout?username=${user}`);
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
          <h2 className="text-lg font-semibold mb-4">Danh sách người dùng</h2>
          <ul>
            {users.map((u) => (
              <li
                key={u.id}
                className={`p-2 rounded cursor-pointer flex items-center gap-2 ${
                  receiver === u.username
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-300"
                }`}
                onClick={() => setReceiver(u.username)}
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
                🔔 ({notifications.length})
              </button>
              {showNotifications && (
                <div className="absolute top-8 right-0 bg-white shadow-lg p-3 rounded-md w-60">
                  <h3 className="text-sm font-semibold border-b pb-2">
                    Thông báo
                  </h3>
                  <ul className="max-h-40 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((noti, index) => (
                        <li
                          key={index}
                          className={`p-2 border-b text-sm cursor-pointer ${
                            noti.is_read
                              ? "text-gray-500"
                              : "font-bold text-black"
                          }`}
                          onClick={() => markNotificationAsRead(noti.id)}
                        >
                          {noti.content}{" "}
                          {noti.is_read ? "(Đã đọc)" : "(Chưa đọc)"}
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
            <Link href="/profile" className="text-blue-500 hover:underline">
              {user}
            </Link>
          </div>
          {receiver ? (
            <>
              <h2 className="text-center text-lg font-semibold mb-2">
                Chat với {receiver}
              </h2>
              <div className="flex-1 overflow-y-auto border rounded-md p-3 bg-gray-50">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.sender === user ? "justify-end" : "justify-start"
                    }`}
                  >
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
