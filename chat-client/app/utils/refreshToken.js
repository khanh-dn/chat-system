import axios from "axios";

export const getNewAccessToken = async () => {
  try {
    const res = await axios.post("http://localhost:3001/auth/refresh_token", {});
    const newToken = res.data.accessToken;

    if (newToken) {
      localStorage.setItem("accessToken", newToken);
      return newToken;
    }
  } catch (error) {
    console.error("Lỗi khi refresh token:", error);
    return null;
  }
};
