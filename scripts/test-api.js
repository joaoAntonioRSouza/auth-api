/**
 * Script de teste completo da API
 * Execute com: node scripts/test-api.js
 */

const fetch = require("node-fetch")

const API_BASE = process.env.API_URL || "http://localhost:3000"

class APITester {
  constructor() {
    this.token = null
    this.userId = null
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    console.log(`🔄 ${config.method || "GET"} ${endpoint}`)

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (response.ok) {
        console.log(`✅ ${response.status} - ${data.message || "Success"}`)
        return { success: true, data, status: response.status }
      } else {
        console.log(`❌ ${response.status} - ${data.message || "Error"}`)
        return { success: false, data, status: response.status }
      }
    } catch (error) {
      console.log(`💥 Network Error: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  async testHealthCheck() {
    console.log("\n📊 Testing Health Check...")
    return await this.request("/health")
  }

  async testRegister() {
    console.log("\n👤 Testing User Registration...")

    const userData = {
      name: "Test User",
      email: `test${Date.now()}@example.com`,
      password: "testpassword123",
      confirmPassword: "testpassword123",
    }

    const result = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })

    if (result.success) {
      this.userId = result.data.data.user.id
      console.log(`   User ID: ${this.userId}`)
    }

    return result
  }

  async testLogin() {
    console.log("\n🔐 Testing Login...")

    const loginData = {
      email: `test${Date.now()}@example.com`,
      password: "testpassword123",
    }

    // Primeiro registra um usuário para fazer login
    await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...loginData,
        name: "Login Test User",
        confirmPassword: loginData.password,
      }),
    })

    const result = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(loginData),
    })

    if (result.success) {
      this.token = result.data.data.token
      this.userId = result.data.data.user.id
      console.log(`   Token: ${this.token.substring(0, 20)}...`)
      console.log(`   Expires: ${result.data.data.expiresAt}`)
    }

    return result
  }

  async testProtectedRoutes() {
    console.log("\n🛡️  Testing Protected Routes...")

    if (!this.token) {
      console.log("❌ No token available, skipping protected routes")
      return { success: false, message: "No token" }
    }

    // Test dashboard
    console.log("\n   Testing Dashboard...")
    const dashboard = await this.request("/protected/dashboard")

    // Test profile update
    console.log("\n   Testing Profile Update...")
    const profileUpdate = await this.request("/protected/profile", {
      method: "PUT",
      body: JSON.stringify({
        name: "Updated Test User",
      }),
    })

    // Test sensitive data
    console.log("\n   Testing Sensitive Data...")
    const sensitiveData = await this.request("/protected/sensitive-data")

    // Test user resource
    console.log("\n   Testing User Resource...")
    const userResource = await this.request(`/protected/resource/${this.userId}`)

    return {
      dashboard: dashboard.success,
      profileUpdate: profileUpdate.success,
      sensitiveData: sensitiveData.success,
      userResource: userResource.success,
    }
  }

  async testAdminRoutes() {
    console.log("\n👑 Testing Admin Routes...")

    if (!this.token) {
      console.log("❌ No token available, skipping admin routes")
      return { success: false, message: "No token" }
    }

    // Test blacklist stats
    console.log("\n   Testing Blacklist Stats...")
    const stats = await this.request("/admin/blacklist/stats")

    return { stats: stats.success }
  }

  async testLogout() {
    console.log("\n🚪 Testing Logout...")

    if (!this.token) {
      console.log("❌ No token available, skipping logout")
      return { success: false, message: "No token" }
    }

    const result = await this.request("/auth/logout", {
      method: "POST",
    })

    if (result.success) {
      console.log("   Token added to blacklist")

      // Test accessing protected route with blacklisted token
      console.log("\n   Testing Blacklisted Token...")
      const blacklistedAccess = await this.request("/protected/dashboard")

      if (!blacklistedAccess.success) {
        console.log("✅ Blacklisted token correctly rejected")
      } else {
        console.log("❌ Blacklisted token was accepted (ERROR)")
      }
    }

    return result
  }

  async testRateLimiting() {
    console.log("\n⏱️  Testing Rate Limiting...")

    // Test login rate limiting (5 attempts in 15 minutes)
    console.log("\n   Testing Login Rate Limit...")

    const promises = []
    for (let i = 0; i < 7; i++) {
      promises.push(
        this.request("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: "nonexistent@example.com",
            password: "wrongpassword",
          }),
        }),
      )
    }

    const results = await Promise.all(promises)
    const rateLimited = results.some((r) => r.status === 429)

    if (rateLimited) {
      console.log("✅ Rate limiting is working")
    } else {
      console.log("❌ Rate limiting may not be working")
    }

    return { rateLimited }
  }

  async runAllTests() {
    console.log("🧪 Starting API Tests...")
    console.log(`📍 API Base URL: ${API_BASE}`)

    const results = {
      healthCheck: await this.testHealthCheck(),
      register: await this.testRegister(),
      login: await this.testLogin(),
      protectedRoutes: await this.testProtectedRoutes(),
      adminRoutes: await this.testAdminRoutes(),
      rateLimiting: await this.testRateLimiting(),
      logout: await this.testLogout(),
    }

    console.log("\n📋 Test Summary:")
    console.log("================")

    Object.entries(results).forEach(([test, result]) => {
      const status = result.success ? "✅" : "❌"
      console.log(`${status} ${test}`)
    })

    const totalTests = Object.keys(results).length
    const passedTests = Object.values(results).filter((r) => r.success).length

    console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`)

    if (passedTests === totalTests) {
      console.log("🎉 All tests passed!")
      process.exit(0)
    } else {
      console.log("⚠️  Some tests failed")
      process.exit(1)
    }
  }
}

// Execute tests
if (require.main === module) {
  const tester = new APITester()
  tester.runAllTests().catch((error) => {
    console.error("💥 Test execution failed:", error)
    process.exit(1)
  })
}

module.exports = APITester
