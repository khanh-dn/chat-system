"use client";
import { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
    
const socket = io("http://localhost:3001");

export default function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiver, setReceiver] = useState("");
  const [users, setUsers] = useState([]);

  console.log("user", user);
  useEffect(() => {
    axios
      .get(`http://localhost:3001/users?userName=${user}`)
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));
  }, [user]);
  useEffect(() => {
    setMessages([]);
    if (receiver) {
      axios
        .get(`http://localhost:3001/messages/${user}/${receiver}`)
        .then((res) => setMessages(res.data))
        .catch((err) => console.error(err));
    }

    socket.on("newMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, [user, receiver]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };
  const sendMessage = () => {
    if (newMessage.trim() === "") return;

    socket.emit("sendMessage", { sender: user, receiver, message: newMessage });

    setNewMessage("");
  };


  return (
    <div>
      <h1>Chat với {receiver}</h1>
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
      <select value={receiver} onChange={(e) => setReceiver(e.target.value)}>
        <option value="">Chọn người nhận</option>
        {users.map((u) => (
          <option key={u.id} value={u.username}>
            {u.username}
          </option>
        ))}
      </select>
      <h2>Tin nhắn</h2>
      <div
        style={{
          height: "300px",
          overflowY: "scroll",
          border: "1px solid #ccc",
          padding: "10px",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              textAlign: msg.sender === user ? "right" : "left",
              marginBottom: "10px",
            }}
          >
            <strong>{msg.sender}:</strong> {msg.message}
          </div>
        ))}
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
  );
}
