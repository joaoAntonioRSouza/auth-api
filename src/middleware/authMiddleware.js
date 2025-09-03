const JWTService = require("../services/JWTService")
const UserService = require("../services/UserService")
const ApiResponse = require("../utils/responses")
const Logger = require("../utils/logger")

/**
 * Middleware de autenticação JWT
 */
const authMiddleware = (blacklistRepository) => {
  return async (req, res, next) => {
    try {
      // Extrai o token do header
      const authHeader = req.headers.authorization
      const token = JWTService.extractTokenFromHeader(authHeader)

      if (!token) {
        return ApiResponse.unauthorized(res, "Token de acesso requerido")
      }

      // Verifica se o token está na blacklist
      const isBlacklisted = await blacklistRepository.isTokenBlacklisted(token)
      if (isBlacklisted) {
        Logger.warn("Tentativa de acesso com token na blacklist")
        return ApiResponse.unauthorized(res, "Token revogado")
      }

      // Verifica e decodifica o token
      const decoded = JWTService.verifyToken(token)

      // Busca o usuário no banco para garantir que ainda existe
      const user = await UserService.getUserById(decoded.userId)

      // Adiciona informações do usuário e token à requisição
      req.user = user
      req.token = token
      req.tokenPayload = decoded

      // Log de acesso autorizado
      Logger.debug(`Acesso autorizado para usuário: ${user.email}`)

      next()
    } catch (error) {
      Logger.error("Erro no middleware de autenticação:", error)

      if (error.message === "TOKEN_EXPIRED") {
        return ApiResponse.unauthorized(res, "Token expirado")
      }

      if (error.message === "TOKEN_INVALID") {
        return ApiResponse.unauthorized(res, "Token inválido")
      }

      if (error.message === "USER_NOT_FOUND") {
        return ApiResponse.unauthorized(res, "Usuário não encontrado")
      }

      return ApiResponse.unauthorized(res, "Falha na autenticação")
    }
  }
}

/**
 * Middleware opcional de autenticação (não bloqueia se não houver token)
 */
const optionalAuthMiddleware = (blacklistRepository) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization
      const token = JWTService.extractTokenFromHeader(authHeader)

      if (!token) {
        // Sem token, continua sem autenticação
        return next()
      }

      // Se há token, tenta autenticar
      const isBlacklisted = await blacklistRepository.isTokenBlacklisted(token)
      if (isBlacklisted) {
        return next() // Token inválido, continua sem autenticação
      }

      const decoded = JWTService.verifyToken(token)
      const user = await UserService.getUserById(decoded.userId)

      req.user = user
      req.token = token
      req.tokenPayload = decoded

      next()
    } catch (error) {
      // Em caso de erro, continua sem autenticação
      Logger.debug("Erro na autenticação opcional:", error.message)
      next()
    }
  }
}

/**
 * Middleware para verificar roles/permissões específicas
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, "Autenticação requerida")
    }

    // TODO: Implementar sistema de roles se necessário
    // const userRoles = req.user.roles || []
    // const hasRequiredRole = roles.some(role => userRoles.includes(role))

    // if (!hasRequiredRole) {
    //   return ApiResponse.forbidden(res, "Permissão insuficiente")
    // }

    next()
  }
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
}
