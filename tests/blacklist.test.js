const RedisTokenBlacklistRepository = require("../src/repositories/RedisTokenBlacklistRepository")
const BlacklistService = require("../src/services/BlacklistService")
const JWTService = require("../src/services/JWTService")
const jest = require("jest") // Import jest to declare the variable

// Mock do Redis para testes
const mockRedisClient = {
  setEx: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
}

describe("BlacklistService", () => {
  let blacklistRepository
  let blacklistService

  beforeEach(() => {
    blacklistRepository = new RedisTokenBlacklistRepository(mockRedisClient)
    blacklistService = new BlacklistService(blacklistRepository, JWTService)
    jest.clearAllMocks()
  })

  describe("revokeToken", () => {
    it("deve adicionar token válido à blacklist", async () => {
      const token = "valid.jwt.token"
      const mockDecoded = {
        payload: {
          userId: 1,
          email: "test@example.com",
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora no futuro
        },
      }

      jest.spyOn(JWTService, "decodeToken").mockReturnValue(mockDecoded)
      jest.spyOn(JWTService, "getTokenRemainingTime").mockReturnValue(3600)
      mockRedisClient.setEx.mockResolvedValue("OK")

      const result = await blacklistService.revokeToken(token, "test")

      expect(result).toBe(true)
      expect(mockRedisClient.setEx).toHaveBeenCalledWith("blacklist:token:" + token, 3600, "revoked")
    })

    it("não deve adicionar token expirado à blacklist", async () => {
      const token = "expired.jwt.token"
      const mockDecoded = {
        payload: {
          userId: 1,
          email: "test@example.com",
          exp: Math.floor(Date.now() / 1000) - 3600, // 1 hora no passado
        },
      }

      jest.spyOn(JWTService, "decodeToken").mockReturnValue(mockDecoded)
      jest.spyOn(JWTService, "getTokenRemainingTime").mockReturnValue(0)

      const result = await blacklistService.revokeToken(token, "test")

      expect(result).toBe(true)
      expect(mockRedisClient.setEx).not.toHaveBeenCalled()
    })
  })

  describe("isTokenRevoked", () => {
    it("deve retornar true para token na blacklist", async () => {
      const token = "blacklisted.token"
      mockRedisClient.get.mockResolvedValue("revoked")

      const result = await blacklistService.isTokenRevoked(token)

      expect(result).toBe(true)
      expect(mockRedisClient.get).toHaveBeenCalledWith("blacklist:token:" + token)
    })

    it("deve retornar false para token não na blacklist", async () => {
      const token = "valid.token"
      mockRedisClient.get.mockResolvedValue(null)

      const result = await blacklistService.isTokenRevoked(token)

      expect(result).toBe(false)
    })

    it("deve retornar false em caso de erro no Redis", async () => {
      const token = "any.token"
      mockRedisClient.get.mockRejectedValue(new Error("Redis error"))

      const result = await blacklistService.isTokenRevoked(token)

      expect(result).toBe(false) // fail-open behavior
    })
  })
})
