const swaggerJsdoc = require("swagger-jsdoc")

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: process.env.API_TITLE || "Authentication API with JWT and Redis",
      version: process.env.API_VERSION || "1.0.0",
      description:
        process.env.API_DESCRIPTION ||
        `
        Sistema completo de autenticação usando JWT (JSON Web Tokens) e Redis para gerenciamento de sessão e blacklist de tokens.
        
        ## Funcionalidades
        - ✅ Registro e login de usuários
        - ✅ Autenticação JWT com Bearer Token
        - ✅ Blacklist de tokens no Redis para logout seguro
        - ✅ Middleware de proteção de rotas
        - ✅ Rate limiting por endpoint
        - ✅ Auditoria de ações sensíveis
        - ✅ Validação de dados robusta
        
        ## Como usar
        1. Registre um usuário em \`POST /auth/register\`
        2. Faça login em \`POST /auth/login\` para obter o token JWT
        3. Use o token no header \`Authorization: Bearer <token>\` para acessar rotas protegidas
        4. Faça logout em \`POST /auth/logout\` para invalidar o token
        
        ## Segurança
        - Tokens são armazenados em blacklist no Redis após logout
        - Rate limiting previne ataques de força bruta
        - Validação rigorosa de dados de entrada
        - Auditoria completa de ações sensíveis
      `,
      contact: {
        name: "Suporte da API",
        email: "suporte@exemplo.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Servidor de Desenvolvimento",
      },
      {
        url: "https://api.exemplo.com",
        description: "Servidor de Produção",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Insira o token JWT obtido no login. Formato: Bearer <token>",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "ID único do usuário",
              example: 1,
            },
            name: {
              type: "string",
              description: "Nome completo do usuário",
              minLength: 2,
              maxLength: 100,
              example: "João Silva",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email único do usuário",
              example: "joao@email.com",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Data de criação da conta",
              example: "2024-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Data da última atualização",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
          required: ["id", "name", "email", "createdAt", "updatedAt"],
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Login realizado com sucesso",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/User",
                },
                token: {
                  type: "string",
                  description: "JWT token para autenticação",
                  example:
                    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiam9hb0BlbWFpbC5jb20iLCJpYXQiOjE2NDA5OTUyMDB9.signature",
                },
                tokenType: {
                  type: "string",
                  example: "Bearer",
                },
                expiresIn: {
                  type: "string",
                  description: "Tempo de expiração do token",
                  example: "24h",
                },
                expiresAt: {
                  type: "string",
                  format: "date-time",
                  description: "Data/hora de expiração do token",
                  example: "2024-01-02T00:00:00.000Z",
                },
              },
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T12:00:00.000Z",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              description: "Mensagem de erro",
              example: "Email ou senha inválidos",
            },
            errors: {
              type: "array",
              description: "Lista detalhada de erros (opcional)",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    example: "email",
                  },
                  message: {
                    type: "string",
                    example: "Email deve ter um formato válido",
                  },
                },
              },
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T12:00:00.000Z",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operação realizada com sucesso",
            },
            data: {
              type: "object",
              description: "Dados da resposta (varia por endpoint)",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T12:00:00.000Z",
            },
          },
        },
        DashboardData: {
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                name: { type: "string", example: "João Silva" },
                email: { type: "string", example: "joao@email.com" },
                memberSince: { type: "string", format: "date-time" },
              },
            },
            session: {
              type: "object",
              properties: {
                loginTime: { type: "string", format: "date-time" },
                expiresAt: { type: "string", format: "date-time" },
                remainingTime: { type: "integer", description: "Segundos restantes" },
              },
            },
            stats: {
              type: "object",
              properties: {
                totalLogins: { type: "integer", example: 15 },
                lastLogin: { type: "string", format: "date-time" },
              },
            },
            notifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  message: { type: "string" },
                  type: { type: "string", enum: ["info", "warning", "error"] },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        BlacklistStats: {
          type: "object",
          properties: {
            blacklist: {
              type: "object",
              properties: {
                totalTokens: {
                  type: "integer",
                  description: "Número total de tokens na blacklist",
                  example: 15,
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                },
                redisStatus: {
                  type: "string",
                  enum: ["connected", "error"],
                  example: "connected",
                },
              },
            },
            server: {
              type: "object",
              properties: {
                uptime: {
                  type: "number",
                  description: "Tempo de atividade do servidor em segundos",
                  example: 3600,
                },
                memory: {
                  type: "object",
                  description: "Uso de memória do processo",
                },
                nodeVersion: {
                  type: "string",
                  example: "v18.17.0",
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Token de acesso inválido ou ausente",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Token de acesso requerido",
                timestamp: "2024-01-01T12:00:00.000Z",
              },
            },
          },
        },
        ForbiddenError: {
          description: "Acesso negado - permissões insuficientes",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Acesso negado: você não tem permissão para acessar este recurso",
                timestamp: "2024-01-01T12:00:00.000Z",
              },
            },
          },
        },
        ValidationError: {
          description: "Dados de entrada inválidos",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Dados inválidos",
                errors: [
                  {
                    field: "email",
                    message: "Email deve ter um formato válido",
                  },
                  {
                    field: "password",
                    message: "Senha deve ter pelo menos 6 caracteres",
                  },
                ],
                timestamp: "2024-01-01T12:00:00.000Z",
              },
            },
          },
        },
        RateLimitError: {
          description: "Muitas tentativas - rate limit excedido",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Muitas tentativas. Tente novamente em 15 minutos.",
                timestamp: "2024-01-01T12:00:00.000Z",
              },
            },
          },
        },
        InternalServerError: {
          description: "Erro interno do servidor",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Erro interno do servidor",
                timestamp: "2024-01-01T12:00:00.000Z",
              },
            },
          },
        },
      },
      examples: {
        RegisterRequest: {
          summary: "Exemplo de registro de usuário",
          value: {
            name: "João Silva",
            email: "joao@email.com",
            password: "minhasenha123",
            confirmPassword: "minhasenha123",
          },
        },
        LoginRequest: {
          summary: "Exemplo de login",
          value: {
            email: "joao@email.com",
            password: "minhasenha123",
          },
        },
        UpdateProfileRequest: {
          summary: "Exemplo de atualização de perfil",
          value: {
            name: "João Silva Santos",
          },
        },
        SensitiveActionRequest: {
          summary: "Exemplo de ação sensível",
          value: {
            action: "delete_data",
            data: {
              resourceId: "123",
              reason: "cleanup",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "Endpoints para registro, login, logout e gerenciamento de tokens",
      },
      {
        name: "Protected",
        description: "Endpoints protegidos que requerem autenticação JWT",
      },
      {
        name: "Admin",
        description: "Endpoints administrativos para gerenciamento do sistema",
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/models/*.js", "./src/controllers/*.js"],
}

const specs = swaggerJsdoc(options)
module.exports = specs
