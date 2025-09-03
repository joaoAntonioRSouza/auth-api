const UserService = require("../services/UserService")
const ApiResponse = require("../utils/responses")
const Logger = require("../utils/logger")

class ProtectedController {
  /**
   * Endpoint de exemplo - Dashboard do usuário
   */
  static async getDashboard(req, res) {
    try {
      const user = req.user
      const tokenInfo = req.tokenPayload

      const dashboardData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          memberSince: user.createdAt,
        },
        session: {
          loginTime: new Date(tokenInfo.iat * 1000),
          expiresAt: new Date(tokenInfo.exp * 1000),
          remainingTime: Math.max(0, tokenInfo.exp - Math.floor(Date.now() / 1000)),
        },
        stats: {
          totalLogins: 1, // Placeholder - implementar contador real
          lastLogin: new Date(tokenInfo.iat * 1000),
        },
        notifications: [
          {
            id: 1,
            message: "Bem-vindo ao sistema!",
            type: "info",
            timestamp: new Date().toISOString(),
          },
        ],
      }

      return ApiResponse.success(res, dashboardData)
    } catch (error) {
      Logger.error("Erro ao obter dashboard:", error)
      return ApiResponse.error(res, "Erro interno ao carregar dashboard")
    }
  }

  /**
   * Endpoint de exemplo - Atualizar perfil
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id
      const updateData = req.body

      // Validações básicas
      const allowedFields = ["name"]
      const filteredData = {}

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field]
        }
      }

      if (Object.keys(filteredData).length === 0) {
        return ApiResponse.badRequest(res, "Nenhum campo válido para atualização fornecido")
      }

      const updatedUser = await UserService.updateUser(userId, filteredData)

      Logger.info(`Perfil atualizado: ${updatedUser.email}`)

      return ApiResponse.success(res, {
        user: updatedUser,
        message: "Perfil atualizado com sucesso",
      })
    } catch (error) {
      Logger.error("Erro ao atualizar perfil:", error)

      if (error.message === "USER_NOT_FOUND") {
        return ApiResponse.notFound(res, "Usuário não encontrado")
      }

      return ApiResponse.error(res, "Erro interno ao atualizar perfil")
    }
  }

  /**
   * Endpoint de exemplo - Dados sensíveis (requer token fresco)
   */
  static async getSensitiveData(req, res) {
    try {
      const user = req.user

      const sensitiveData = {
        accountDetails: {
          userId: user.id,
          email: user.email,
          accountStatus: "active",
          securityLevel: "standard",
        },
        securityInfo: {
          lastPasswordChange: user.updatedAt,
          twoFactorEnabled: false, // Placeholder
          activeTokens: 1, // Placeholder
        },
        auditLog: [
          {
            action: "login",
            timestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get("User-Agent"),
          },
        ],
      }

      return ApiResponse.success(res, sensitiveData)
    } catch (error) {
      Logger.error("Erro ao obter dados sensíveis:", error)
      return ApiResponse.error(res, "Erro interno ao carregar dados sensíveis")
    }
  }

  /**
   * Endpoint de exemplo - Operação que requer auditoria
   */
  static async performSensitiveAction(req, res) {
    try {
      const { action, data } = req.body
      const user = req.user

      // Simula uma operação sensível
      const result = {
        actionId: Math.random().toString(36).substr(2, 9),
        action,
        performedBy: user.email,
        timestamp: new Date().toISOString(),
        status: "completed",
        data: data || null,
      }

      Logger.info(`Ação sensível executada: ${action} por ${user.email}`)

      return ApiResponse.success(res, {
        result,
        message: "Ação executada com sucesso",
      })
    } catch (error) {
      Logger.error("Erro na ação sensível:", error)
      return ApiResponse.error(res, "Erro interno na execução da ação")
    }
  }

  /**
   * Endpoint de exemplo - Recurso específico do usuário
   */
  static async getUserResource(req, res) {
    try {
      const resourceId = req.params.id
      const user = req.user

      // Simula busca de recurso específico
      const resource = {
        id: resourceId,
        name: `Recurso ${resourceId}`,
        owner: user.email,
        createdAt: new Date().toISOString(),
        data: {
          content: "Conteúdo do recurso privado",
          metadata: {
            accessCount: 1,
            lastAccessed: new Date().toISOString(),
          },
        },
      }

      return ApiResponse.success(res, resource)
    } catch (error) {
      Logger.error("Erro ao obter recurso:", error)
      return ApiResponse.error(res, "Erro interno ao carregar recurso")
    }
  }
}

module.exports = ProtectedController
