"use client";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import Link from "next/link";
import api from "../utils/axiosInstance";

const socket = io("http://localhost:3001");

export default function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiver, setReceiver] = useState("");
  const [users, setUsers] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      try {
        const res = await api.get(`/users?username=${user}`);
        setUsers(res.data.users);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
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
      setMessages((prevMessages) =>
        Array.isArray(prevMessages) ? [...prevMessages, message] : [message]
      );
    });

    return () => {
      socket.off("newMessage");
    };
  }, [user, receiver]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    window.location.href = "/";
  };

  const sendMessage = () => {
    if (newMessage.trim() === "") return;

    socket.emit("sendMessage", { sender: user, receiver, message: newMessage });

    setNewMessage("");
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h1 className="text-lg font-semibold">Chat App</h1>
          <Link href="/profile" className="text-blue-500 hover:underline">
            {user}
          </Link>
        </div>

        {/* Danh sách người nhận */}
        <select
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          className="border p-2 rounded w-full mb-4 focus:outline-none focus:ring focus:ring-blue-300"
        >
          <option value="">Chọn người nhận</option>
          {Array.isArray(users) &&
            users.map((u) => (
              <option key={u.id} value={u.username}>
                {u.username}
              </option>
            ))}
        </select>

        {/* Khung Chat */}
        {receiver ? (
          <>
            <h2 className="text-center text-lg font-semibold mb-2">
              Chat với {receiver}
            </h2>
            <div className="h-64 overflow-y-auto border rounded-md p-3 bg-gray-50">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
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
                      <strong></strong> {msg.message}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">Chưa có tin nhắn nào.</p>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Nhập tin nhắn */}
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
          <p className="text-center text-gray-500">Hãy chọn một người để chat!</p>
        )}

        {/* Nút đăng xuất */}
        <button
          onClick={handleLogout}
          className="mt-4 bg-red-500 text-white px-4 py-2 w-full rounded hover:bg-red-600 transition"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
