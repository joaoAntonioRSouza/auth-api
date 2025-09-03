const express = require("express")
const AuthController = require("../controllers/AuthController")
const { validateRegister, validateLogin } = require("../validators/authValidators")
const { authRateLimit, registerRateLimit, refreshRateLimit } = require("../middleware/rateLimitMiddleware")

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints de autenticação
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registra um novo usuário
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao@email.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "minhasenha123"
 *               confirmPassword:
 *                 type: string
 *                 example: "minhasenha123"
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Registro realizado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos ou email já existe
 *       500:
 *         description: Erro interno do servidor
 */
router.post("/register", registerRateLimit, validateRegister, AuthController.register)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realiza login do usuário
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao@email.com"
 *               password:
 *                 type: string
 *                 example: "minhasenha123"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login realizado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     tokenType:
 *                       type: string
 *                       example: "Bearer"
 *                     expiresIn:
 *                       type: string
 *                       example: "24h"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Credenciais inválidas
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post("/login", authRateLimit, validateLogin, AuthController.login)

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Realiza logout do usuário
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/logout",
  (req, res, next) => {
    const { authMiddleware } = require("../middleware/authMiddleware")
    const blacklistRepository = req.app.locals.blacklistRepository
    return authMiddleware(blacklistRepository)(req, res, next)
  },
  AuthController.logout,
)

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Obtém perfil do usuário autenticado
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokenInfo:
 *                       type: object
 *                       properties:
 *                         issuedAt:
 *                           type: string
 *                           format: date-time
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                         isNearExpiry:
 *                           type: boolean
 *       401:
 *         description: Token inválido ou ausente
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/profile",
  (req, res, next) => {
    const { authMiddleware } = require("../middleware/authMiddleware")
    const blacklistRepository = req.app.locals.blacklistRepository
    return authMiddleware(blacklistRepository)(req, res, next)
  },
  AuthController.getProfile,
)

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renova o token JWT
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     tokenType:
 *                       type: string
 *                       example: "Bearer"
 *                     expiresIn:
 *                       type: string
 *                       example: "24h"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Token ainda válido ou dados inválidos
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/refresh",
  refreshRateLimit,
  (req, res, next) => {
    const { authMiddleware } = require("../middleware/authMiddleware")
    const blacklistRepository = req.app.locals.blacklistRepository
    return authMiddleware(blacklistRepository)(req, res, next)
  },
  AuthController.refreshToken,
)

module.exports = router
