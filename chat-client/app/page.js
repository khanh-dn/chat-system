"use client";

import { useState, useEffect } from "react";
import Chat from "./components/chat";
import axios from "axios";
import { useRouter } from "next/navigation";
import io from "socket.io-client";

const socket = io("http://localhost:3001");


export default function Home() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(savedUser);
    } else {
      setUser(null); 
    }
    setLoading(false);
  }, []);

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:3001/auth/login", {
        username,
        password,
      });

      localStorage.setItem("user", res.data.user.username);
      localStorage.setItem("accessToken", res.data.accessToken);
      socket.emit("online", res.data.user.username);
      setUser(res.data.user.username);
    } catch (err) {
      setError("Đăng nhập thất bại! Kiểm tra lại tài khoản và mật khẩu.");
    }
  };
  if (loading) {
    return <div>Đang tải...</div>;
  }
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-bold">Đăng nhập</h2>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 m-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 m-2"
        />
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Đăng nhập
        </button>
        <p className="mt-2">
          Chưa có tài khoản?{" "}
          <a href="/register" className="text-blue-500">
            Đăng ký
          </a>
        </p>
      </div>
    );
  }

  return <Chat user={user} />;
}
