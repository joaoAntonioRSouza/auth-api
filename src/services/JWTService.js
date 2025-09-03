const jwt = require("jsonwebtoken")
const Logger = require("../utils/logger")

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET
    this.expiresIn = process.env.JWT_EXPIRES_IN || "24h"

    if (!this.secret) {
      throw new Error("JWT_SECRET environment variable is required")
    }
  }

  /**
   * Gera um JWT token para o usuário
   * @param {Object} user - Dados do usuário
   * @returns {Object} Token e informações de expiração
   */
  generateToken(user) {
    try {
      const payload = {
        userId: user.id,
        email: user.email,
        name: user.name,
        iat: Math.floor(Date.now() / 1000), // Issued at
      }

      const token = jwt.sign(payload, this.secret, {
        expiresIn: this.expiresIn,
        issuer: "auth-api",
        audience: "auth-api-users",
      })

      // Calcula a data de expiração
      const decoded = jwt.decode(token)
      const expiresAt = new Date(decoded.exp * 1000)

      Logger.info(`Token JWT gerado para usuário: ${user.email}`)

      return {
        token,
        type: "Bearer",
        expiresIn: this.expiresIn,
        expiresAt,
      }
    } catch (error) {
      Logger.error("Erro ao gerar token JWT:", error)
      throw new Error("TOKEN_GENERATION_FAILED")
    }
  }

  /**
   * Verifica e decodifica um JWT token
   * @param {string} token - JWT token
   * @returns {Object} Payload decodificado
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: "auth-api",
        audience: "auth-api-users",
      })

      return decoded
    } catch (error) {
      Logger.error("Erro ao verificar token JWT:", error)

      if (error.name === "TokenExpiredError") {
        throw new Error("TOKEN_EXPIRED")
      }

      if (error.name === "JsonWebTokenError") {
        throw new Error("TOKEN_INVALID")
      }

      if (error.name === "NotBeforeError") {
        throw new Error("TOKEN_NOT_ACTIVE")
      }

      throw new Error("TOKEN_VERIFICATION_FAILED")
    }
  }

  /**
   * Decodifica um token sem verificar a assinatura
   * @param {string} token - JWT token
   * @returns {Object} Payload decodificado
   */
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true })
    } catch (error) {
      Logger.error("Erro ao decodificar token:", error)
      throw new Error("TOKEN_DECODE_FAILED")
    }
  }

  /**
   * Calcula o tempo restante de expiração de um token em segundos
   * @param {string} token - JWT token
   * @returns {number} Segundos até a expiração
   */
  getTokenRemainingTime(token) {
    try {
      const decoded = this.decodeToken(token)
      const now = Math.floor(Date.now() / 1000)
      const exp = decoded.payload.exp

      return Math.max(0, exp - now)
    } catch (error) {
      Logger.error("Erro ao calcular tempo restante do token:", error)
      return 0
    }
  }

  /**
   * Extrai o token do header Authorization
   * @param {string} authHeader - Header Authorization
   * @returns {string|null} Token extraído
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null
    }

    const parts = authHeader.split(" ")
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return null
    }

    return parts[1]
  }

  /**
   * Verifica se um token está próximo do vencimento
   * @param {string} token - JWT token
   * @param {number} thresholdMinutes - Limite em minutos (padrão: 30)
   * @returns {boolean}
   */
  isTokenNearExpiry(token, thresholdMinutes = 30) {
    try {
      const remainingSeconds = this.getTokenRemainingTime(token)
      const thresholdSeconds = thresholdMinutes * 60

      return remainingSeconds <= thresholdSeconds
    } catch (error) {
      return true // Se houver erro, considerar como próximo do vencimento
    }
  }

  /**
   * Gera um novo token com base em um token existente (refresh)
   * @param {string} oldToken - Token atual
   * @returns {Object} Novo token
   */
  refreshToken(oldToken) {
    try {
      const decoded = this.verifyToken(oldToken)

      // Remove campos específicos do JWT
      const { iat, exp, iss, aud, ...userPayload } = decoded

      return this.generateToken(userPayload)
    } catch (error) {
      Logger.error("Erro ao renovar token:", error)
      throw error
    }
  }
}

module.exports = new JWTService()
