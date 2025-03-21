const Redis = require("ioredis");

const ioRedis = new Redis({
  host: "localhost",
  port: 6379,
});

ioRedis.on("connect", () => console.log("🔗 Connected to Redis"));
ioRedis.on("error", (err) => console.error("❌ Redis Error:", err));

module.exports = ioRedis;
