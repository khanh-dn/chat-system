"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const username = localStorage.getItem("user");
    axios
      .get(`http://localhost:3001/users/myinfo?username=${username}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((res) => {
        setUser(res.data.user);
        setLoading(false);
      })
      .catch((err) => cconsole.error("Error fetching user data:", err));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Link href="/">Home</Link>
      <h2 className="text-xl font-bold">Thông tin cá nhân</h2>
      {loading ? (
        <p>Đang tải...</p>
      ) : user ? (
        <>
        <Image width={200} height={200} src="/image/avatarmeo.png" alt="Avatar" className="rounded"/>
          <p>Username: {user.username}</p>
          <p>Email: {user.email}</p>
          <p>Phone: {user.phone}</p>
          <p>Address: {user.address}</p>
          <p>Email: {user.email}</p>
        </>
      ) : (
        <p>Không tìm thấy thông tin người dùng</p>
      )}
    </div>
  );
}
