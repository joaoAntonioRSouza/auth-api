const sequelize = require("./database")
const Logger = require("../utils/logger")

class DatabaseInitializer {
  static async initialize() {
    try {
      // Testa a conexão
      await sequelize.authenticate()
      Logger.info("✅ Conexão com PostgreSQL estabelecida com sucesso")

      // Sincroniza os modelos (em desenvolvimento)
      if (process.env.NODE_ENV === "development") {
        await sequelize.sync({ alter: true })
        Logger.info("✅ Modelos sincronizados com o banco de dados")
      }

      return true
    } catch (error) {
      Logger.error("❌ Erro ao conectar com o banco de dados:", error)
      throw error
    }
  }

  static async close() {
    try {
      await sequelize.close()
      Logger.info("✅ Conexão com o banco de dados fechada")
    } catch (error) {
      Logger.error("❌ Erro ao fechar conexão com o banco:", error)
    }
  }

  static getSequelize() {
    return sequelize
  }
}

module.exports = DatabaseInitializer
