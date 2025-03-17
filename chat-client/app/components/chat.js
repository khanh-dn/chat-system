"use client";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:3001");

export default function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiver, setReceiver] = useState("");
  const [users, setUsers] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    axios
      .get(`http://localhost:3001/users?username=${user}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      .then((res) => {
        setUsers(res.data.users);
        console.log(res.data.users);
      })
      .catch((err) => console.error(err));
  }, [user]);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    setMessages([]);
    if (receiver) {
      axios
        .get(`http://localhost:3001/messages/${user}/${receiver}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((res) => {
          setMessages(res.data.messages);
        })
        .catch((err) => console.error(err));
    }

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

  const handleLogout = () => {
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
      <h1>Chat với {receiver}</h1>
      <select value={receiver} onChange={(e) => setReceiver(e.target.value)}>
        <option value="">Chọn người nhận</option>
        {Array.isArray(users) &&
          users.map((u) => (
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
        {Array.isArray(messages) &&
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
          ))}
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
