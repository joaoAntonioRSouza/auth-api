const DatabaseInitializer = require("./database-init")
const RedisInitializer = require("./redis-init")
const Logger = require("../utils/logger")

class AppInitializer {
  constructor() {
    this.database = null
    this.redis = null
    this.blacklistRepository = null
  }

  async initialize() {
    try {
      Logger.info("🚀 Inicializando aplicação...")

      // Inicializa banco de dados
      await DatabaseInitializer.initialize()
      this.database = DatabaseInitializer.getSequelize()

      // Inicializa Redis
      const redisConfig = await RedisInitializer.initialize()
      this.redis = redisConfig.client
      this.blacklistRepository = redisConfig.blacklistRepository

      Logger.info("✅ Aplicação inicializada com sucesso")

      return {
        database: this.database,
        redis: this.redis,
        blacklistRepository: this.blacklistRepository,
      }
    } catch (error) {
      Logger.error("❌ Erro ao inicializar aplicação:", error)
      await this.cleanup()
      throw error
    }
  }

  async cleanup() {
    Logger.info("🧹 Limpando recursos...")

    try {
      await DatabaseInitializer.close()
    } catch (error) {
      Logger.error("Erro ao fechar banco de dados:", error)
    }

    try {
      await RedisInitializer.close()
    } catch (error) {
      Logger.error("Erro ao fechar Redis:", error)
    }
  }

  getBlacklistRepository() {
    return this.blacklistRepository
  }

  getDatabase() {
    return this.database
  }

  getRedis() {
    return this.redis
  }
}

module.exports = new AppInitializer()
