"use client";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Chat với {receiver}</h1>
        <Link href="/profile">My profile: {user}</Link>
      </div>
      <select value={receiver} onChange={(e) => setReceiver(e.target.value)}>
        <option value="">Chọn người nhận</option>
        {Array.isArray(users) &&
          users.map((u) => (
            <option key={u.id} value={u.username}>
              {u.username}
            </option>
          ))}
      </select>

      {receiver ? (
        <div>
          <h2>Tin nhắn</h2>
          <div
            style={{
              height: "300px",
              overflowY: "scroll",
              border: "1px solid #ccc",
              padding: "10px",
            }}
          >
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    textAlign: msg.sender === user ? "right" : "left",
                    marginBottom: "10px",
                  }}
                >
                  <strong>{msg.sender}:</strong> {msg.message}
                </div>
              ))
            ) : (
              <p>Chưa có tin nhắn nào.</p>
            )}
            <div ref={chatEndRef} />
          </div>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            style={{ width: "80%", padding: "8px" }}
          />
          <button onClick={sendMessage}>Gửi</button>
        </div>
      ) : (
        <p>Hãy chọn một người để chat!</p>
      )}

      <br></br>
      <button
        onClick={handleLogout}
        style={{
          padding: "5px 10px",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Đăng xuất
      </button>
    </div>
  );
}
