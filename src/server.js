const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const swaggerUi = require("swagger-ui-express")
require("dotenv").config()

const AppInitializer = require("./config/app-initializer")
const swaggerSpecs = require("./config/swagger")
const healthCheck = require("./middleware/health-check")
const ApiResponse = require("./utils/responses")
const Logger = require("./utils/logger")
const BlacklistService = require("./services/BlacklistService")
const JWTService = require("./services/JWTService")
const TaskScheduler = require("./utils/scheduler")

class Server {
  constructor() {
    this.app = express()
    this.port = process.env.PORT || 3000
    this.appInitializer = null
  }

  async initialize() {
    try {
      // Inicializa conexões
      this.appInitializer = await AppInitializer.initialize()

      const blacklistService = new BlacklistService(this.appInitializer.getBlacklistRepository(), JWTService)

      this.app.locals.blacklistRepository = this.appInitializer.getBlacklistRepository()
      this.app.locals.blacklistService = blacklistService

      TaskScheduler.schedule(
        "blacklist-cleanup",
        () => blacklistService.cleanupExpiredTokens(),
        6 * 60 * 60 * 1000, // 6 horas
      )

      // Configura middlewares
      this.setupMiddlewares()

      // Configura rotas
      this.setupRoutes()

      // Configura tratamento de erros
      this.setupErrorHandling()

      return this
    } catch (error) {
      Logger.error("Erro ao inicializar servidor:", error)
      throw error
    }
  }

  setupMiddlewares() {
    // Segurança
    this.app.use(helmet())
    this.app.use(cors())

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por IP
      message: {
        success: false,
        message: "Muitas tentativas. Tente novamente em 15 minutos.",
      },
    })
    this.app.use(limiter)

    // Parsing
    this.app.use(express.json({ limit: "10mb" }))
    this.app.use(express.urlencoded({ extended: true }))

    // Health check
    this.app.use(healthCheck(this.appInitializer))

    Logger.info("✅ Middlewares configurados")
  }

  setupRoutes() {
    // Documentação Swagger
    this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs))

    // Rota raiz
    this.app.get("/", (req, res) => {
      ApiResponse.success(res, {
        message: "API de Autenticação com JWT e Redis",
        version: "1.0.0",
        documentation: "/api-docs",
        health: "/health",
        endpoints: {
          // Autenticação
          register: "POST /auth/register",
          login: "POST /auth/login",
          logout: "POST /auth/logout",
          profile: "GET /auth/profile",
          refresh: "POST /auth/refresh",
          // Rotas protegidas
          dashboard: "GET /protected/dashboard",
          updateProfile: "PUT /protected/profile",
          sensitiveData: "GET /protected/sensitive-data",
          sensitiveAction: "POST /protected/sensitive-action",
          userResource: "GET /protected/resource/:id",
          // Administração
          adminStats: "GET /admin/blacklist/stats",
          adminRevoke: "POST /admin/blacklist/revoke",
        },
      })
    })

    const authRoutes = require("./routes/authRoutes")
    this.app.use("/auth", authRoutes)

    const protectedRoutes = require("./routes/protectedRoutes")
    this.app.use("/protected", protectedRoutes)

    const adminRoutes = require("./routes/adminRoutes")
    this.app.use("/admin", adminRoutes)

    Logger.info("✅ Rotas configuradas")
  }

  setupErrorHandling() {
    // 404 Handler
    this.app.use("*", (req, res) => {
      ApiResponse.notFound(res, `Rota ${req.originalUrl} não encontrada`)
    })

    // Error Handler
    this.app.use((error, req, res, next) => {
      Logger.error("Erro não tratado:", error)

      if (error.name === "ValidationError") {
        return ApiResponse.badRequest(res, "Dados inválidos", error.details)
      }

      if (error.name === "JsonWebTokenError") {
        return ApiResponse.unauthorized(res, "Token inválido")
      }

      if (error.name === "TokenExpiredError") {
        return ApiResponse.unauthorized(res, "Token expirado")
      }

      ApiResponse.error(res, "Erro interno do servidor")
    })

    Logger.info("✅ Tratamento de erros configurado")
  }

  async start() {
    try {
      this.app.listen(this.port, () => {
        Logger.info(`🚀 Servidor rodando na porta ${this.port}`)
        Logger.info(`📚 Documentação: http://localhost:${this.port}/api-docs`)
        Logger.info(`❤️  Health Check: http://localhost:${this.port}/health`)
      })
    } catch (error) {
      Logger.error("Erro ao iniciar servidor:", error)
      throw error
    }
  }

  async shutdown() {
    Logger.info("🛑 Encerrando servidor...")
    TaskScheduler.cancelAll()
    await AppInitializer.cleanup()
    process.exit(0)
  }
}

// Inicialização
async function startServer() {
  try {
    const server = new Server()
    await server.initialize()
    await server.start()

    process.on("SIGTERM", () => server.shutdown())
    process.on("SIGINT", () => server.shutdown())
  } catch (error) {
    Logger.error("Falha ao iniciar aplicação:", error)
    process.exit(1)
  }
}

startServer()
