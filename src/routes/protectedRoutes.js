const express = require("express")
const ProtectedController = require("../controllers/ProtectedController")
const { authMiddleware } = require("../middleware/authMiddleware")
const { validateResourceOwnership, validateTokenFreshness, auditLog } = require("../middleware/validationMiddleware")
const Joi = require("joi")

const router = express.Router()

// Middleware de autenticação para todas as rotas protegidas
router.use((req, res, next) => {
  const blacklistRepository = req.app.locals.blacklistRepository
  return authMiddleware(blacklistRepository)(req, res, next)
})

/**
 * @swagger
 * tags:
 *   name: Protected
 *   description: Endpoints protegidos que requerem autenticação
 */

/**
 * @swagger
 * /protected/dashboard:
 *   get:
 *     summary: Obtém dados do dashboard do usuário
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard carregado com sucesso
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
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: number
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         memberSince:
 *                           type: string
 *                           format: date-time
 *                     session:
 *                       type: object
 *                       properties:
 *                         loginTime:
 *                           type: string
 *                           format: date-time
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                         remainingTime:
 *                           type: number
 *                     stats:
 *                       type: object
 *                     notifications:
 *                       type: array
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/dashboard", ProtectedController.getDashboard)

/**
 * @swagger
 * /protected/profile:
 *   put:
 *     summary: Atualiza perfil do usuário
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "João Silva Santos"
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno do servidor
 */
router.put(
  "/profile",
  auditLog("update_profile"),
  (req, res, next) => {
    const schema = Joi.object({
      name: Joi.string().min(2).max(100).trim(),
    })

    const { error, value } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      })
    }

    req.body = value
    next()
  },
  ProtectedController.updateProfile,
)

/**
 * @swagger
 * /protected/sensitive-data:
 *   get:
 *     summary: Obtém dados sensíveis (requer token fresco)
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados sensíveis obtidos com sucesso
 *       401:
 *         description: Token inválido, ausente ou próximo do vencimento
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/sensitive-data",
  validateTokenFreshness(5), // Token deve ter pelo menos 5 minutos de validade
  auditLog("access_sensitive_data"),
  ProtectedController.getSensitiveData,
)

/**
 * @swagger
 * /protected/sensitive-action:
 *   post:
 *     summary: Executa ação sensível com auditoria
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 example: "delete_data"
 *               data:
 *                 type: object
 *                 example: { "resourceId": "123" }
 *     responses:
 *       200:
 *         description: Ação executada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/sensitive-action",
  validateTokenFreshness(10), // Token deve ter pelo menos 10 minutos de validade
  auditLog("sensitive_action"),
  (req, res, next) => {
    const schema = Joi.object({
      action: Joi.string().required(),
      data: Joi.object().optional(),
    })

    const { error, value } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      })
    }

    req.body = value
    next()
  },
  ProtectedController.performSensitiveAction,
)

/**
 * @swagger
 * /protected/resource/{id}:
 *   get:
 *     summary: Obtém recurso específico do usuário
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do recurso (deve corresponder ao ID do usuário)
 *     responses:
 *       200:
 *         description: Recurso obtido com sucesso
 *       403:
 *         description: Acesso negado - recurso não pertence ao usuário
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/resource/:id",
  validateResourceOwnership("id"),
  auditLog("access_user_resource"),
  ProtectedController.getUserResource,
)

module.exports = router
