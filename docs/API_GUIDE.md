# Guia da API de Autenticação

## Visão Geral

Esta API fornece um sistema completo de autenticação usando JWT (JSON Web Tokens) e Redis para gerenciamento seguro de sessões.

## Configuração Inicial

### 1. Variáveis de Ambiente

Crie um arquivo `.env` com as seguintes variáveis:

\`\`\`env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_database
DB_USER=postgres
DB_PASSWORD=sua_senha

# JWT Configuration
JWT_SECRET=sua_chave_secreta_jwt_muito_segura
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server Configuration
PORT=3000
NODE_ENV=development
\`\`\`

### 2. Inicialização

\`\`\`bash
# Instalar dependências
npm install

# Iniciar Redis (Docker)
docker-compose up -d

# Iniciar servidor
npm run dev
\`\`\`

## Fluxo de Autenticação

### 1. Registro de Usuário

\`\`\`bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "minhasenha123",
    "confirmPassword": "minhasenha123"
  }'
\`\`\`

**Resposta:**
\`\`\`json
{
  "success": true,
  "message": "Registro realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "name": "João Silva",
      "email": "joao@email.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
\`\`\`

### 2. Login

\`\`\`bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "password": "minhasenha123"
  }'
\`\`\`

**Resposta:**
\`\`\`json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "João Silva",
      "email": "joao@email.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": "24h",
    "expiresAt": "2024-01-02T00:00:00.000Z"
  }
}
\`\`\`

### 3. Acessar Rotas Protegidas

\`\`\`bash
curl -X GET http://localhost:3000/protected/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
\`\`\`

### 4. Logout

\`\`\`bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
\`\`\`

## Endpoints Disponíveis

### Autenticação
- `POST /auth/register` - Registro de usuário
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout (adiciona token à blacklist)
- `GET /auth/profile` - Perfil do usuário
- `POST /auth/refresh` - Renovar token

### Rotas Protegidas
- `GET /protected/dashboard` - Dashboard do usuário
- `PUT /protected/profile` - Atualizar perfil
- `GET /protected/sensitive-data` - Dados sensíveis (token fresco)
- `POST /protected/sensitive-action` - Ação com auditoria
- `GET /protected/resource/:id` - Recurso específico

### Administração
- `GET /admin/blacklist/stats` - Estatísticas da blacklist
- `POST /admin/blacklist/revoke` - Revogar token específico
- `POST /admin/blacklist/cleanup` - Limpeza de tokens expirados
- `DELETE /admin/blacklist/clear` - Limpar blacklist (dev only)

### Utilitários
- `GET /health` - Status das conexões
- `GET /api-docs` - Documentação Swagger

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autorizado |
| 403 | Acesso negado |
| 404 | Não encontrado |
| 429 | Rate limit excedido |
| 500 | Erro interno |

## Rate Limiting

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/auth/login` | 5 tentativas | 15 minutos |
| `/auth/register` | 3 tentativas | 1 hora |
| `/auth/refresh` | 10 tentativas | 10 minutos |
| `/admin/*` | 20 tentativas | 5 minutos |
| Geral | 100 requests | 15 minutos |

## Segurança

### JWT Token
- Algoritmo: HS256
- Expiração: 24h (configurável)
- Payload: userId, email, name, iat
- Blacklist: Redis com TTL automático

### Validações
- Senhas: mínimo 6 caracteres
- Emails: formato válido e único
- Nomes: 2-100 caracteres
- Rate limiting por IP

### Auditoria
- Log de todas as ações sensíveis
- Rastreamento de IP e User-Agent
- Timestamps de todas as operações

## Exemplos de Integração

### JavaScript (Frontend)

\`\`\`javascript
class AuthAPI {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL
    this.token = localStorage.getItem('token')
  }

  async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    return response.json()
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await response.json()
    
    if (data.success) {
      this.token = data.data.token
      localStorage.setItem('token', this.token)
    }
    
    return data
  }

  async logout() {
    const response = await fetch(`${this.baseURL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` }
    })
    
    if (response.ok) {
      this.token = null
      localStorage.removeItem('token')
    }
    
    return response.json()
  }

  async getDashboard() {
    const response = await fetch(`${this.baseURL}/protected/dashboard`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    })
    return response.json()
  }
}
\`\`\`

### Python

\`\`\`python
import requests

class AuthAPI:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.token = None
    
    def register(self, name, email, password):
        response = requests.post(f"{self.base_url}/auth/register", json={
            "name": name,
            "email": email,
            "password": password,
            "confirmPassword": password
        })
        return response.json()
    
    def login(self, email, password):
        response = requests.post(f"{self.base_url}/auth/login", json={
            "email": email,
            "password": password
        })
        data = response.json()
        
        if data.get("success"):
            self.token = data["data"]["token"]
        
        return data
    
    def logout(self):
        if not self.token:
            return {"error": "No token available"}
        
        response = requests.post(f"{self.base_url}/auth/logout", 
            headers={"Authorization": f"Bearer {self.token}"})
        
        if response.ok:
            self.token = None
        
        return response.json()
    
    def get_dashboard(self):
        if not self.token:
            return {"error": "No token available"}
        
        response = requests.get(f"{self.base_url}/protected/dashboard",
            headers={"Authorization": f"Bearer {self.token}"})
        
        return response.json()
\`\`\`

## Troubleshooting

### Problemas Comuns

1. **"Token inválido"**
   - Verifique se o token está sendo enviado no header correto
   - Confirme se o JWT_SECRET está configurado

2. **"Muitas tentativas"**
   - Aguarde o tempo de rate limit
   - Verifique se não há múltiplas instâncias fazendo requests

3. **"Erro de conexão com Redis"**
   - Verifique se o Redis está rodando
   - Confirme as configurações de conexão

4. **"Erro de conexão com banco"**
   - Verifique se o PostgreSQL está rodando
   - Confirme as credenciais do banco

### Logs

Os logs são estruturados e incluem:
- Timestamp
- Nível (INFO, ERROR, WARN, DEBUG)
- Contexto da operação
- Dados relevantes (sem informações sensíveis)

### Monitoramento

- Health check: `GET /health`
- Estatísticas: `GET /admin/blacklist/stats`
- Logs estruturados para análise
