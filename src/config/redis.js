const redis = require("redis")
require("dotenv").config()

class RedisClient {
  constructor() {
    this.client = null
  }

  async connect() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      })

      this.client.on("error", (err) => {
        console.error("Redis Client Error:", err)
      })

      this.client.on("connect", () => {
        console.log("✅ Connected to Redis")
      })

      await this.client.connect()
      return this.client
    } catch (error) {
      console.error("❌ Failed to connect to Redis:", error)
      throw error
    }
  }

  getClient() {
    return this.client
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect()
    }
  }
}

module.exports = new RedisClient()
