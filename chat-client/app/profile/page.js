"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import api from "../utils/axiosInstance";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    email: "",
    image: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const username = localStorage.getItem("user");
        const res = await api.get(`/users/myinfo?username=${username}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setUser(res.data.user);
        setFormData(res.data.user);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu người dùng:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setFormData({ ...formData });

      const imagePreviewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, image: imagePreviewUrl }));
    }
  };

  const handleUpdate = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const username = localStorage.getItem("user");

      const updateData = new FormData();
      updateData.append("phone", formData.phone);
      updateData.append("address", formData.address);
      updateData.append("email", formData.email);

      if (selectedImage) {
        updateData.append("image", selectedImage);
      } else {
        updateData.append("image", formData.image || "");
      }

      console.log("Dữ liệu gửi đi:", Object.fromEntries(updateData.entries()));

      const res = await api.put(`/users/update/${username}`, updateData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setUser({
        ...formData,
        image: res.data.user.image,
      });

      setIsEditing(false);
      alert("Cập nhật thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật thông tin:", err);
      alert("Cập nhật thất bại!");
    }
  };

  const handleLogout = async () => {
    const username = localStorage.getItem("user");
    try {
      await api.post(`/auth/logout?username=${username}`, {});
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <Link href="/" className="text-blue-500 hover:underline">
          ⬅ Quay lại trang chủ
        </Link>
        <h2 className="text-2xl font-bold text-center mt-4 mb-6">
          📝 Thông tin cá nhân
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">Đang tải...</p>
        ) : user ? (
          <>
            {/* Ảnh đại diện */}
            <div className="relative flex justify-center">
              <label className="cursor-pointer relative">
                <div className="relative w-[120px] h-[120px] rounded-full border-4 border-blue-500 shadow-md overflow-hidden">
                  {selectedImage || formData.image ? (
                    <Image
                      width={120}
                      height={120}
                      src={
                        selectedImage
                          ? URL.createObjectURL(selectedImage)
                          : `http://localhost:3001${formData.image}`
                      }
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm"></div>
                  )}
                </div>

                {isEditing && (
                  <div className="absolute bottom-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                    ✏ Chỉnh sửa
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={!isEditing}
                />
              </label>
            </div>

            {/* Thông tin cá nhân */}
            <fieldset className="border border-gray-300 rounded-md p-4 mt-4">
              <legend className="text-sm text-gray-600 px-2">Thông tin</legend>
              <p className="font-semibold text-lg text-gray-700 text-center">
                {user.username}
              </p>

              <div className="flex flex-col gap-3 mt-3">
                <label className="text-sm text-gray-600">📧 Email</label>
                <input
                  type="email"
                  disabled={!isEditing}
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full focus:outline-none focus:ring focus:ring-blue-300 disabled:bg-gray-100"
                />

                <label className="text-sm text-gray-600">
                  📞 Số điện thoại
                </label>
                <input
                  type="phone"
                  disabled={!isEditing}
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full focus:outline-none focus:ring focus:ring-blue-300 disabled:bg-gray-100"
                />

                <label className="text-sm text-gray-600">📍 Địa chỉ</label>
                <input
                  disabled={!isEditing}
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full focus:outline-none focus:ring focus:ring-blue-300 disabled:bg-gray-100"
                />
              </div>
            </fieldset>

            {/* Các nút thao tác */}
            <div className="flex justify-center gap-3 mt-6">
              <button
                disabled={!isEditing}
                onClick={handleUpdate}
                className="px-4 py-2 bg-green-500 text-white rounded shadow-md hover:bg-green-600 transition"
              >
                ✅ Lưu
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded shadow-md hover:bg-blue-600 transition"
              >
                ✏️ Sửa
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded shadow-md hover:bg-blue-600 transition"
              >
                Đăng xuất
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-red-500">
            Không tìm thấy thông tin người dùng
          </p>
        )}
      </div>
    </div>
  );
}
