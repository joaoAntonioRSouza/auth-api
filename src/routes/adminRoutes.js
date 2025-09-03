const express = require("express")
const AdminController = require("../controllers/AdminController")

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Endpoints administrativos (requer autenticação)
 */

/**
 * @swagger
 * /admin/blacklist/stats:
 *   get:
 *     summary: Obtém estatísticas da blacklist
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
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
 *                     blacklist:
 *                       type: object
 *                       properties:
 *                         totalTokens:
 *                           type: number
 *                           example: 15
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         redisStatus:
 *                           type: string
 *                           example: "connected"
 *                     server:
 *                       type: object
 *                       properties:
 *                         uptime:
 *                           type: number
 *                           example: 3600
 *                         memory:
 *                           type: object
 *                         nodeVersion:
 *                           type: string
 *                           example: "v18.17.0"
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/blacklist/stats",
  (req, res, next) => {
    const { authMiddleware } = require("../middleware/authMiddleware")
    const blacklistRepository = req.app.locals.blacklistRepository
    return authMiddleware(blacklistRepository)(req, res, next)
  },
  AdminController.getBlacklistStats,
)

/**
 * @swagger
 * /admin/blacklist/revoke:
 *   post:
 *     summary: Revoga um token específico
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT token a ser revogado
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               reason:
 *                 type: string
 *                 description: Motivo da revogação
 *                 example: "security_breach"
 *     responses:
 *       200:
 *         description: Token revogado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/blacklist/revoke",
  (req, res, next) => {
    const { authMiddleware } = require("../middleware/authMiddleware")
    const blacklistRepository = req.app.locals.blacklistRepository
    return authMiddleware(blacklistRepository)(req, res, next)
  },
  AdminController.revokeToken,
)

/**
 * @swagger
 * /admin/blacklist/cleanup:
 *   post:
 *     summary: Executa limpeza de tokens expirados
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Limpeza executada com sucesso
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/blacklist/cleanup",
  (req, res, next) => {
    const { authMiddleware } = require("../middleware/authMiddleware")
    const blacklistRepository = req.app.locals.blacklistRepository
    return authMiddleware(blacklistRepository)(req, res, next)
  },
  AdminController.cleanupExpired,
)

/**
 * @swagger
 * /admin/blacklist/clear:
 *   delete:
 *     summary: Limpa toda a blacklist (apenas desenvolvimento)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blacklist limpa com sucesso
 *       403:
 *         description: Operação não permitida em produção
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno do servidor
 */
router.delete(
  "/blacklist/clear",
  (req, res, next) => {
    const { authMiddleware } = require("../middleware/authMiddleware")
    const blacklistRepository = req.app.locals.blacklistRepository
    return authMiddleware(blacklistRepository)(req, res, next)
  },
  AdminController.clearBlacklist,
)

module.exports = router
