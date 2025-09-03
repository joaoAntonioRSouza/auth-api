const Joi = require("joi")

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required().messages({
    "string.empty": "Nome é obrigatório",
    "string.min": "Nome deve ter pelo menos 2 caracteres",
    "string.max": "Nome deve ter no máximo 100 caracteres",
    "any.required": "Nome é obrigatório",
  }),

  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Email deve ter um formato válido",
    "string.empty": "Email é obrigatório",
    "any.required": "Email é obrigatório",
  }),

  password: Joi.string().min(6).max(128).required().messages({
    "string.min": "Senha deve ter pelo menos 6 caracteres",
    "string.max": "Senha deve ter no máximo 128 caracteres",
    "string.empty": "Senha é obrigatória",
    "any.required": "Senha é obrigatória",
  }),

  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Confirmação de senha deve ser igual à senha",
    "any.required": "Confirmação de senha é obrigatória",
  }),
})

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Email deve ter um formato válido",
    "string.empty": "Email é obrigatório",
    "any.required": "Email é obrigatório",
  }),

  password: Joi.string().required().messages({
    "string.empty": "Senha é obrigatória",
    "any.required": "Senha é obrigatória",
  }),
})

/**
 * Middleware de validação
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Retorna todos os erros
      stripUnknown: true, // Remove campos não definidos no schema
    })

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }))

      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors,
        timestamp: new Date().toISOString(),
      })
    }

    // Substitui req.body pelos dados validados e limpos
    req.body = value
    next()
  }
}

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  registerSchema,
  loginSchema,
}
