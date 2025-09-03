const ApiResponse = require("../utils/responses")
const Logger = require("../utils/logger")

class AdminController {
  /**
   * Obtém estatísticas da blacklist
   */
  static async getBlacklistStats(req, res) {
    try {
      const blacklistService = req.app.locals.blacklistService
      const stats = await blacklistService.getDetailedStats()

      return ApiResponse.success(res, {
        blacklist: stats,
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
        },
      })
    } catch (error) {
      Logger.error("Erro ao obter estatísticas:", error)
      return ApiResponse.error(res, "Erro ao obter estatísticas do sistema")
    }
  }

  /**
   * Revoga um token específico (admin)
   */
  static async revokeToken(req, res) {
    try {
      const { token, reason } = req.body
      const blacklistService = req.app.locals.blacklistService

      if (!token) {
        return ApiResponse.badRequest(res, "Token é obrigatório")
      }

      await blacklistService.revokeToken(token, reason || "admin_revocation")

      Logger.info(`Token revogado por admin: ${req.user.email}`)

      return ApiResponse.success(res, null, "Token revogado com sucesso")
    } catch (error) {
      Logger.error("Erro ao revogar token:", error)

      if (error.message === "INVALID_TOKEN_FORMAT") {
        return ApiResponse.badRequest(res, "Formato de token inválido")
      }

      return ApiResponse.error(res, "Erro ao revogar token")
    }
  }

  /**
   * Limpa blacklist (apenas desenvolvimento)
   */
  static async clearBlacklist(req, res) {
    try {
      if (process.env.NODE_ENV === "production") {
        return ApiResponse.forbidden(res, "Operação não permitida em produção")
      }

      const blacklistService = req.app.locals.blacklistService
      const removedCount = await blacklistService.forceCleanAll()

      Logger.warn(`Blacklist limpa por admin: ${req.user.email}`)

      return ApiResponse.success(res, {
        removedTokens: removedCount,
        message: "Blacklist limpa com sucesso",
      })
    } catch (error) {
      Logger.error("Erro ao limpar blacklist:", error)
      return ApiResponse.error(res, "Erro ao limpar blacklist")
    }
  }

  /**
   * Executa limpeza de tokens expirados
   */
  static async cleanupExpired(req, res) {
    try {
      const blacklistService = req.app.locals.blacklistService
      const removedCount = await blacklistService.cleanupExpiredTokens()

      return ApiResponse.success(res, {
        removedTokens: removedCount,
        message: "Limpeza executada com sucesso",
      })
    } catch (error) {
      Logger.error("Erro na limpeza:", error)
      return ApiResponse.error(res, "Erro ao executar limpeza")
    }
  }
}

module.exports = AdminController
