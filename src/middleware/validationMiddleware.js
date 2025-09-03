const ApiResponse = require("../utils/responses")
const Logger = require("../utils/logger")

/**
 * Middleware para validar se o usuário é o proprietário do recurso
 */
const validateResourceOwnership = (resourceIdParam = "id") => {
  return (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam]
      const userId = req.user.id

      // Para este exemplo, assumimos que o usuário só pode acessar seus próprios recursos
      // Em um sistema real, você faria uma consulta ao banco para verificar a propriedade
      if (Number.parseInt(resourceId) !== userId) {
        Logger.warn(`Tentativa de acesso não autorizado: usuário ${userId} tentou acessar recurso ${resourceId}`)
        return ApiResponse.forbidden(res, "Acesso negado: você não tem permissão para acessar este recurso")
      }

      next()
    } catch (error) {
      Logger.error("Erro na validação de propriedade do recurso:", error)
      return ApiResponse.error(res, "Erro interno na validação de permissões")
    }
  }
}

/**
 * Middleware para validar headers obrigatórios
 */
const validateRequiredHeaders = (requiredHeaders = []) => {
  return (req, res, next) => {
    const missingHeaders = []

    for (const header of requiredHeaders) {
      if (!req.headers[header.toLowerCase()]) {
        missingHeaders.push(header)
      }
    }

    if (missingHeaders.length > 0) {
      return ApiResponse.badRequest(res, `Headers obrigatórios ausentes: ${missingHeaders.join(", ")}`)
    }

    next()
  }
}

/**
 * Middleware para validar se o token não está próximo do vencimento
 */
const validateTokenFreshness = (thresholdMinutes = 5) => {
  return (req, res, next) => {
    try {
      const JWTService = require("../services/JWTService")
      const token = req.token

      if (JWTService.isTokenNearExpiry(token, thresholdMinutes)) {
        return ApiResponse.unauthorized(res, "Token próximo do vencimento. Renove seu token antes de continuar.")
      }

      next()
    } catch (error) {
      Logger.error("Erro na validação de frescor do token:", error)
      return ApiResponse.error(res, "Erro interno na validação do token")
    }
  }
}

/**
 * Middleware para log de auditoria de ações sensíveis
 */
const auditLog = (action) => {
  return (req, res, next) => {
    const startTime = Date.now()

    // Log da tentativa de ação
    Logger.info(`[AUDIT] Ação iniciada: ${action}`, {
      userId: req.user?.id,
      email: req.user?.email,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    })

    // Intercepta a resposta para log do resultado
    const originalSend = res.send
    res.send = function (data) {
      const duration = Date.now() - startTime
      const statusCode = res.statusCode

      Logger.info(`[AUDIT] Ação concluída: ${action}`, {
        userId: req.user?.id,
        email: req.user?.email,
        statusCode,
        duration,
        success: statusCode < 400,
        timestamp: new Date().toISOString(),
      })

      return originalSend.call(this, data)
    }

    next()
  }
}

module.exports = {
  validateResourceOwnership,
  validateRequiredHeaders,
  validateTokenFreshness,
  auditLog,
}
