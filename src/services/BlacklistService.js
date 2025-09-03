const Logger = require("../utils/logger")

class BlacklistService {
  constructor(blacklistRepository, jwtService) {
    this.blacklistRepository = blacklistRepository
    this.jwtService = jwtService
  }

  /**
   * Adiciona um token à blacklist com validação
   * @param {string} token - JWT token
   * @param {string} reason - Motivo da revogação
   * @returns {Promise<boolean>}
   */
  async revokeToken(token, reason = "logout") {
    try {
      // Valida se o token é válido antes de adicionar à blacklist
      const decoded = this.jwtService.decodeToken(token)
      if (!decoded) {
        throw new Error("INVALID_TOKEN_FORMAT")
      }

      const remainingTime = this.jwtService.getTokenRemainingTime(token)

      if (remainingTime <= 0) {
        Logger.info("Token já expirado, não adicionado à blacklist")
        return true
      }

      await this.blacklistRepository.addToBlacklist(token, remainingTime)

      Logger.info(`Token revogado: ${reason}`, {
        userId: decoded.payload.userId,
        email: decoded.payload.email,
        remainingTime,
        reason,
      })

      return true
    } catch (error) {
      Logger.error("Erro ao revogar token:", error)
      throw error
    }
  }

  /**
   * Verifica se um token está na blacklist
   * @param {string} token - JWT token
   * @returns {Promise<boolean>}
   */
  async isTokenRevoked(token) {
    try {
      return await this.blacklistRepository.isTokenBlacklisted(token)
    } catch (error) {
      Logger.error("Erro ao verificar token na blacklist:", error)
      // Em caso de erro no Redis, permitir acesso (fail-open)
      return false
    }
  }

  /**
   * Revoga todos os tokens de um usuário específico
   * @param {number} userId - ID do usuário
   * @param {string} reason - Motivo da revogação
   * @returns {Promise<number>} Número de tokens revogados
   */
  async revokeAllUserTokens(userId, reason = "security") {
    try {
      // Esta implementação requer armazenar tokens por usuário
      // Por simplicidade, vamos implementar uma versão básica
      Logger.warn(`Revogação em massa solicitada para usuário ${userId}: ${reason}`)

      // TODO: Implementar armazenamento de tokens por usuário se necessário
      // Por enquanto, apenas registra o evento
      return 0
    } catch (error) {
      Logger.error("Erro ao revogar tokens do usuário:", error)
      throw error
    }
  }

  /**
   * Obtém estatísticas detalhadas da blacklist
   * @returns {Promise<Object>}
   */
  async getDetailedStats() {
    try {
      const basicStats = await this.blacklistRepository.getBlacklistStats()

      return {
        ...basicStats,
        timestamp: new Date().toISOString(),
        redisStatus: "connected",
      }
    } catch (error) {
      Logger.error("Erro ao obter estatísticas da blacklist:", error)
      return {
        totalTokens: 0,
        timestamp: new Date().toISOString(),
        redisStatus: "error",
        error: error.message,
      }
    }
  }

  /**
   * Limpa tokens expirados da blacklist (manutenção)
   * @returns {Promise<number>} Número de tokens removidos
   */
  async cleanupExpiredTokens() {
    try {
      // Redis automaticamente remove chaves com TTL expirado
      // Esta função é mais para logging e monitoramento
      const statsBefore = await this.getDetailedStats()

      Logger.info("Limpeza automática do Redis - TTL gerencia expiração", {
        tokensAtivos: statsBefore.totalTokens,
      })

      return 0 // Redis gerencia automaticamente
    } catch (error) {
      Logger.error("Erro na limpeza da blacklist:", error)
      throw error
    }
  }

  /**
   * Força limpeza completa da blacklist (apenas para desenvolvimento/testes)
   * @returns {Promise<number>}
   */
  async forceCleanAll() {
    try {
      if (process.env.NODE_ENV === "production") {
        throw new Error("OPERATION_NOT_ALLOWED_IN_PRODUCTION")
      }

      const removedCount = await this.blacklistRepository.clearBlacklist()

      Logger.warn(`Limpeza forçada da blacklist: ${removedCount} tokens removidos`)

      return removedCount
    } catch (error) {
      Logger.error("Erro na limpeza forçada:", error)
      throw error
    }
  }
}

module.exports = BlacklistService
