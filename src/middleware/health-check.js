const ApiResponse = require("../utils/responses")
const Logger = require("../utils/logger")

/**
 * Middleware para verificar a saúde das conexões
 */
const healthCheck = (appInitializer) => {
  return async (req, res, next) => {
    if (req.path === "/health") {
      try {
        const health = {
          status: "healthy",
          timestamp: new Date().toISOString(),
          services: {},
        }

        // Verifica PostgreSQL
        try {
          await appInitializer.getDatabase().authenticate()
          health.services.database = { status: "connected", type: "PostgreSQL" }
        } catch (error) {
          health.services.database = { status: "disconnected", error: error.message }
          health.status = "unhealthy"
        }

        // Verifica Redis
        try {
          await appInitializer.getRedis().ping()
          health.services.redis = { status: "connected", type: "Redis" }
        } catch (error) {
          health.services.redis = { status: "disconnected", error: error.message }
          health.status = "unhealthy"
        }

        // Estatísticas da blacklist
        try {
          const stats = await appInitializer.getBlacklistRepository().getBlacklistStats()
          health.services.blacklist = {
            status: "operational",
            tokensInBlacklist: stats.totalTokens,
          }
        } catch (error) {
          health.services.blacklist = { status: "error", error: error.message }
        }

        const statusCode = health.status === "healthy" ? 200 : 503
        return res.status(statusCode).json(health)
      } catch (error) {
        Logger.error("Erro no health check:", error)
        return ApiResponse.error(res, "Health check failed", 503)
      }
    }
    next()
  }
}

module.exports = healthCheck
