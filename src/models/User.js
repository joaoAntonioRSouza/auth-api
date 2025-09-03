const { DataTypes } = require("sequelize")
const bcrypt = require("bcryptjs")
const sequelize = require("../config/database")

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do usuário
 *         name:
 *           type: string
 *           description: Nome completo do usuário
 *           minLength: 2
 *           maxLength: 100
 *         email:
 *           type: string
 *           format: email
 *           description: Email único do usuário
 *         password:
 *           type: string
 *           description: Senha do usuário (mínimo 6 caracteres)
 *           minLength: 6
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *       example:
 *         id: 1
 *         name: "João Silva"
 *         email: "joao@email.com"
 *         createdAt: "2024-01-01T00:00:00.000Z"
 *         updatedAt: "2024-01-01T00:00:00.000Z"
 */

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Nome é obrigatório",
        },
        len: {
          args: [2, 100],
          msg: "Nome deve ter entre 2 e 100 caracteres",
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        msg: "Este email já está em uso",
      },
      validate: {
        isEmail: {
          msg: "Email deve ter um formato válido",
        },
        notEmpty: {
          msg: "Email é obrigatório",
        },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Senha é obrigatória",
        },
        len: {
          args: [6, 255],
          msg: "Senha deve ter pelo menos 6 caracteres",
        },
      },
    },
  },
  {
    tableName: "users",
    timestamps: true,
    hooks: {
      // Hash da senha antes de salvar
      beforeCreate: async (user) => {
        if (user.password) {
          const saltRounds = 12
          user.password = await bcrypt.hash(user.password, saltRounds)
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const saltRounds = 12
          user.password = await bcrypt.hash(user.password, saltRounds)
        }
      },
    },
  },
)

// Métodos de instância
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

User.prototype.toJSON = function () {
  const values = { ...this.get() }
  delete values.password // Remove senha do JSON
  return values
}

// Métodos estáticos
User.findByEmail = function (email) {
  return this.findOne({
    where: { email: email.toLowerCase() },
  })
}

module.exports = User
