const RedisClient = require("./redis")
const RedisTokenBlacklistRepository = require("../repositories/RedisTokenBlacklistRepository")
const Logger = require("../utils/logger")

class RedisInitializer {
  constructor() {
    this.redisClient = null
    this.blacklistRepository = null
  }

  async initialize() {
    try {
      // Conecta ao Redis
      this.redisClient = await RedisClient.connect()

      // Inicializa o repositório de blacklist
      this.blacklistRepository = new RedisTokenBlacklistRepository(this.redisClient)

      Logger.info("✅ Redis inicializado com sucesso")
      return {
        client: this.redisClient,
        blacklistRepository: this.blacklistRepository,
      }
    } catch (error) {
      Logger.error("❌ Erro ao inicializar Redis:", error)
      throw error
    }
  }

  async close() {
    try {
      if (this.redisClient) {
        await RedisClient.disconnect()
        Logger.info("✅ Conexão com Redis fechada")
      }
    } catch (error) {
      Logger.error("❌ Erro ao fechar conexão com Redis:", error)
    }
  }

  getBlacklistRepository() {
    return this.blacklistRepository
  }

  getClient() {
    return this.redisClient
  }
}

module.exports = new RedisInitializer()
