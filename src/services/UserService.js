const User = require("../models/User")
const Logger = require("../utils/logger")

class UserService {
  /**
   * Registra um novo usuário
   */
  static async registerUser(userData) {
    try {
      const { name, email, password } = userData

      // Verifica se o email já existe
      const existingUser = await User.findByEmail(email)
      if (existingUser) {
        throw new Error("EMAIL_ALREADY_EXISTS")
      }

      // Cria o usuário
      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
      })

      Logger.info(`Novo usuário registrado: ${user.email}`)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      }
    } catch (error) {
      Logger.error("Erro ao registrar usuário:", error)

      if (error.message === "EMAIL_ALREADY_EXISTS") {
        throw error
      }

      if (error.name === "SequelizeValidationError") {
        const validationErrors = error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        }))
        const validationError = new Error("VALIDATION_ERROR")
        validationError.details = validationErrors
        throw validationError
      }

      if (error.name === "SequelizeUniqueConstraintError") {
        throw new Error("EMAIL_ALREADY_EXISTS")
      }

      throw new Error("REGISTRATION_FAILED")
    }
  }

  /**
   * Autentica um usuário
   */
  static async authenticateUser(email, password) {
    try {
      // Busca o usuário pelo email
      const user = await User.findOne({
        where: { email: email.toLowerCase().trim() },
      })

      if (!user) {
        throw new Error("INVALID_CREDENTIALS")
      }

      // Verifica a senha
      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        throw new Error("INVALID_CREDENTIALS")
      }

      Logger.info(`Usuário autenticado: ${user.email}`)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    } catch (error) {
      Logger.error("Erro ao autenticar usuário:", error)

      if (error.message === "INVALID_CREDENTIALS") {
        throw error
      }

      throw new Error("AUTHENTICATION_FAILED")
    }
  }

  /**
   * Busca usuário por ID
   */
  static async getUserById(userId) {
    try {
      const user = await User.findByPk(userId)
      if (!user) {
        throw new Error("USER_NOT_FOUND")
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    } catch (error) {
      Logger.error("Erro ao buscar usuário:", error)

      if (error.message === "USER_NOT_FOUND") {
        throw error
      }

      throw new Error("USER_FETCH_FAILED")
    }
  }

  /**
   * Atualiza dados do usuário
   */
  static async updateUser(userId, updateData) {
    try {
      const user = await User.findByPk(userId)
      if (!user) {
        throw new Error("USER_NOT_FOUND")
      }

      // Remove campos que não devem ser atualizados diretamente
      const { password, email, ...allowedUpdates } = updateData

      await user.update(allowedUpdates)

      Logger.info(`Usuário atualizado: ${user.email}`)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt,
      }
    } catch (error) {
      Logger.error("Erro ao atualizar usuário:", error)

      if (error.message === "USER_NOT_FOUND") {
        throw error
      }

      throw new Error("USER_UPDATE_FAILED")
    }
  }
}

module.exports = UserService
