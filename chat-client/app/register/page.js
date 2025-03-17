"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from 'next/link'

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async () => {
    try {
      const res = await axios.post(
        "http://localhost:3001/auth/register",
        formData
      );
      console.log("Đăng ký thành công:", res.data);
      router.push("/");
    } catch (err) {
      setError("Đăng ký thất bại! Hãy thử lại.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-bold">Đăng ký</h2>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="text"
        name="username"
        placeholder="Username"
        value={formData.username}
        onChange={handleChange}
        className="border p-2 m-2"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        className="border p-2 m-2"
      />
      <button
        onClick={handleRegister}
        className="bg-green-500 text-white p-2 rounded"
      >
        Đăng ký
      </button>
      <p className="mt-2">
        Đã có tài khoản?
        <Link href="/" className="text-blue-500">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
