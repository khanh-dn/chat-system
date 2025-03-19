"use client";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUsername(storedUser);
    } 
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/notifications/${username}`
        );
        const data = await response.json();
        setNotifications(data.notification);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();
    socket.on("newNotification", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      });
  
      return () => {
        socket.off("newNotification");
      };
  }, [notifications, username]);

  return (
    <div>
      <h3>🔔 Thông báo</h3>
      <ul>
        {Array.isArray(notifications) &&
          notifications.map((noti) => <li key={noti.id}>{noti.content}</li>)}
      </ul>
    </div>
  );
}
