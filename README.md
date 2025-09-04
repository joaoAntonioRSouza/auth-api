# Sistema de Autenticação com JWT e Redis

Este projeto implementa um sistema completo de autenticação usando JWT (JSON Web Tokens) e Redis para gerenciamento de sessão e blacklist de tokens.

## Funcionalidades

- ✅ Registro de usuários
- ✅ Login com JWT
- ✅ Middleware de autenticação
- ✅ Blacklist de tokens no Redis
- ✅ Logout seguro
- ✅ Documentação Swagger
- ✅ Validação de dados
- ✅ Rate limiting

## Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados
- **Sequelize** - ORM
- **Redis** - Cache e blacklist de tokens
- **JWT** - Autenticação
- **Swagger** - Documentação da API

## Pré-requisitos

- Node.js (v16 ou superior)
- PostgreSQL
- Docker Desktop (para Redis)


## Documentação

Acesse a documentação da API em: `http://localhost:3000/api-docs`

## Endpoints

- `POST /auth/register` - Registro de usuário
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/profile` - Perfil do usuário (protegida)

## Testes

