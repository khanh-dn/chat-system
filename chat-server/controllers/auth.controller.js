const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { createUser, findByUsername } = require("../models/user.model");

const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin" });
    }
    const existingUser = await findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(username, hashedPassword);

    if (user.error) {
      return res.status(400).json({ error: user.error });
    }

    res.status(201).json({ message: "User created", user });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};


const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await findByUsername(username);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const accessToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.ACCESS_KEY,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_KEY,
      { expiresIn: "7d" } 
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
    });

    res.json({user, accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    jwt.verify(refreshToken, process.env.REFRESH_KEY, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }

      const accessToken = jwt.sign(
        { id: user.id, username: user.username },
        process.env.ACCESS_KEY,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    });
  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
}

const logout = async (req, res) => {
  res.clearCookie("refreshToken").json({ message: "Đăng xuất thành công!" });
}

module.exports = { register, login, refreshToken , logout };
