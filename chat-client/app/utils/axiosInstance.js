import axios from "axios";
import { getNewAccessToken } from "./refreshToken";

const api = axios.create({
  baseURL: "http://localhost:3001" //Gui cookie refresh token
});

// Gắn accessToken vào headers
api.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error) 
);

// Xử lý lỗi 401 (Unauthorized) & refresh token
api.interceptors.response.use(
    (response) => response, 
    async (error) => {
      if (error.response && error.response.status === 401) {
        console.warn("Access token hết hạn, đang refresh...");
  
        try {
          const newToken = await getNewAccessToken();
          if (newToken) {
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return api(error.config); 
          }
        } catch (refreshError) {
          console.error("Lỗi khi refresh token:", refreshError);
        }
  
        // Nếu không refresh được, chuyển hướng đến trang đăng nhập
        console.warn("Refresh Token hết hạn! Đăng xuất...");
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        window.location.href = "/";
      }
      
      return Promise.reject(error);
    }
  );
  

export default api;
