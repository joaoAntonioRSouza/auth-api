const Logger = require("../utils/logger")

class RedisTokenBlacklistRepository {
  constructor(redisClient) {
    this.redis = redisClient
    this.keyPrefix = "blacklist:token:"
  }

  /**
   * Adiciona um token à blacklist com TTL
   * @param {string} token - JWT token
   * @param {number} expiresInSeconds - Tempo de expiração em segundos
   */
  async addToBlacklist(token, expiresInSeconds) {
    try {
      const key = this.keyPrefix + token
      await this.redis.setEx(key, expiresInSeconds, "revoked")
      Logger.info(`Token adicionado à blacklist com TTL de ${expiresInSeconds}s`)
      return true
    } catch (error) {
      Logger.error("Erro ao adicionar token à blacklist:", error)
      throw error
    }
  }

  /**
   * Verifica se um token está na blacklist
   * @param {string} token - JWT token
   * @returns {boolean}
   */
  async isTokenBlacklisted(token) {
    try {
      const key = this.keyPrefix + token
      const result = await this.redis.get(key)
      return result !== null
    } catch (error) {
      Logger.error("Erro ao verificar token na blacklist:", error)
      // Em caso de erro no Redis, permitir acesso (fail-open)
      return false
    }
  }

  /**
   * Remove um token da blacklist (opcional, para casos especiais)
   * @param {string} token - JWT token
   */
  async removeFromBlacklist(token) {
    try {
      const key = this.keyPrefix + token
      await this.redis.del(key)
      Logger.info("Token removido da blacklist")
      return true
    } catch (error) {
      Logger.error("Erro ao remover token da blacklist:", error)
      throw error
    }
  }

  /**
   * Limpa todos os tokens da blacklist (para testes ou manutenção)
   */
  async clearBlacklist() {
    try {
      const keys = await this.redis.keys(this.keyPrefix + "*")
      if (keys.length > 0) {
        await this.redis.del(keys)
        Logger.info(`${keys.length} tokens removidos da blacklist`)
      }
      return keys.length
    } catch (error) {
      Logger.error("Erro ao limpar blacklist:", error)
      throw error
    }
  }

  /**
   * Obtém estatísticas da blacklist
   */
  async getBlacklistStats() {
    try {
      const keys = await this.redis.keys(this.keyPrefix + "*")
      return {
        totalTokens: keys.length,
        keyPrefix: this.keyPrefix,
      }
    } catch (error) {
      Logger.error("Erro ao obter estatísticas da blacklist:", error)
      return { totalTokens: 0, keyPrefix: this.keyPrefix }
    }
  }
}

module.exports = RedisTokenBlacklistRepository
