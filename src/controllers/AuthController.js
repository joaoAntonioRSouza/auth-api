const UserService = require("../services/UserService")
const JWTService = require("../services/JWTService")
const ApiResponse = require("../utils/responses")
const Logger = require("../utils/logger")

class AuthController {
  /**
   * Registra um novo usuário
   */
  static async register(req, res) {
    try {
      const userData = req.body

      const user = await UserService.registerUser(userData)

      Logger.info(`Usuário registrado com sucesso: ${user.email}`)

      return ApiResponse.success(
        res,
        {
          user,
          message: "Usuário registrado com sucesso! Faça login para continuar.",
        },
        "Registro realizado com sucesso",
        201,
      )
    } catch (error) {
      Logger.error("Erro no registro:", error)

      if (error.message === "EMAIL_ALREADY_EXISTS") {
        return ApiResponse.badRequest(res, "Este email já está em uso")
      }

      if (error.message === "VALIDATION_ERROR") {
        return ApiResponse.badRequest(res, "Dados inválidos", error.details)
      }

      return ApiResponse.error(res, "Erro interno do servidor durante o registro")
    }
  }

  /**
   * Realiza login do usuário
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body

      const user = await UserService.authenticateUser(email, password)

      const tokenData = JWTService.generateToken(user)

      Logger.info(`Login realizado com sucesso: ${user.email}`)

      return ApiResponse.success(res, {
        user,
        token: tokenData.token,
        tokenType: tokenData.type,
        expiresIn: tokenData.expiresIn,
        expiresAt: tokenData.expiresAt,
        message: "Login realizado com sucesso!",
      })
    } catch (error) {
      Logger.error("Erro no login:", error)

      if (error.message === "INVALID_CREDENTIALS") {
        return ApiResponse.unauthorized(res, "Email ou senha inválidos")
      }

      if (error.message === "TOKEN_GENERATION_FAILED") {
        return ApiResponse.error(res, "Erro ao gerar token de acesso")
      }

      return ApiResponse.error(res, "Erro interno do servidor durante o login")
    }
  }

  /**
   * Logout do usuário
   */
  static async logout(req, res) {
    try {
      const token = req.token
      const blacklistRepository = req.app.locals.blacklistRepository

      if (!token) {
        return ApiResponse.badRequest(res, "Token não fornecido")
      }

      const remainingTime = JWTService.getTokenRemainingTime(token)

      if (remainingTime > 0) {
        await blacklistRepository.addToBlacklist(token, remainingTime)
      }

      Logger.info("Logout realizado com sucesso")

      return ApiResponse.success(res, null, "Logout realizado com sucesso")
    } catch (error) {
      Logger.error("Erro no logout:", error)
      return ApiResponse.error(res, "Erro interno do servidor durante o logout")
    }
  }

  /**
   * Obtém perfil do usuário autenticado
   */
  static async getProfile(req, res) {
    try {
      const user = req.user
      const tokenInfo = {
        issuedAt: new Date(req.tokenPayload.iat * 1000),
        expiresAt: new Date(req.tokenPayload.exp * 1000),
        isNearExpiry: JWTService.isTokenNearExpiry(req.token),
      }

      return ApiResponse.success(res, {
        user,
        tokenInfo,
      })
    } catch (error) {
      Logger.error("Erro ao obter perfil:", error)

      if (error.message === "USER_NOT_FOUND") {
        return ApiResponse.notFound(res, "Usuário não encontrado")
      }

      return ApiResponse.error(res, "Erro interno do servidor ao obter perfil")
    }
  }

  /**
   * Renova o token JWT
   */
  static async refreshToken(req, res) {
    try {
      const currentToken = req.token

      // Verifica se o token está próximo do vencimento
      if (!JWTService.isTokenNearExpiry(currentToken, 60)) {
        return ApiResponse.badRequest(res, "Token ainda válido, renovação não necessária")
      }

      // Gera novo token
      const newTokenData = JWTService.refreshToken(currentToken)

      // Adiciona token antigo à blacklist
      const blacklistRepository = req.app.locals.blacklistRepository
      const remainingTime = JWTService.getTokenRemainingTime(currentToken)

      if (remainingTime > 0) {
        await blacklistRepository.addToBlacklist(currentToken, remainingTime)
      }

      Logger.info(`Token renovado para usuário: ${req.user.email}`)

      return ApiResponse.success(res, {
        token: newTokenData.token,
        tokenType: newTokenData.type,
        expiresIn: newTokenData.expiresIn,
        expiresAt: newTokenData.expiresAt,
        message: "Token renovado com sucesso",
      })
    } catch (error) {
      Logger.error("Erro ao renovar token:", error)
      return ApiResponse.error(res, "Erro interno do servidor ao renovar token")
    }
  }
}

module.exports = AuthController
