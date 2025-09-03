class ApiResponse {
  static success(res, data = null, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    })
  }

  static error(res, message = "Internal Server Error", statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    })
  }

  static unauthorized(res, message = "Unauthorized") {
    return this.error(res, message, 401)
  }

  static forbidden(res, message = "Forbidden") {
    return this.error(res, message, 403)
  }

  static notFound(res, message = "Resource not found") {
    return this.error(res, message, 404)
  }

  static badRequest(res, message = "Bad Request", errors = null) {
    return this.error(res, message, 400, errors)
  }
}

module.exports = ApiResponse
