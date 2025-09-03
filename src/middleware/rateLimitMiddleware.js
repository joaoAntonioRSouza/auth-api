const rateLimit = require("express-rate-limit")
const ApiResponse = require("../utils/responses")

/**
 * Rate limiting específico para autenticação
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login por IP
  message: {
    success: false,
    message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
    retryAfter: 15 * 60, // segundos
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(res, "Muitas tentativas de login. Tente novamente em 15 minutos.", 429)
  },
})

/**
 * Rate limiting para registro de usuários
 */
const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 registros por IP por hora
  message: {
    success: false,
    message: "Muitas tentativas de registro. Tente novamente em 1 hora.",
    retryAfter: 60 * 60,
  },
  handler: (req, res) => {
    return ApiResponse.error(res, "Muitas tentativas de registro. Tente novamente em 1 hora.", 429)
  },
})

/**
 * Rate limiting para operações administrativas
 */
const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20, // máximo 20 operações admin por IP
  message: {
    success: false,
    message: "Muitas operações administrativas. Tente novamente em 5 minutos.",
  },
  handler: (req, res) => {
    return ApiResponse.error(res, "Muitas operações administrativas. Tente novamente em 5 minutos.", 429)
  },
})

/**
 * Rate limiting para refresh de tokens
 */
const refreshRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 10, // máximo 10 refresh por IP
  message: {
    success: false,
    message: "Muitas tentativas de renovação de token.",
  },
  handler: (req, res) => {
    return ApiResponse.error(res, "Muitas tentativas de renovação de token. Tente novamente em 10 minutos.", 429)
  },
})

module.exports = {
  authRateLimit,
  registerRateLimit,
  adminRateLimit,
  refreshRateLimit,
}
