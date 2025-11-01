package com.rayonsports.fanapp.auth

import java.time.Instant
import java.time.format.DateTimeParseException
import kotlinx.coroutines.flow.Flow

data class VerificationSession(
    val sessionId: String,
    val expiresAt: String? = null,
    val resendAt: String? = null,
) {
    fun secondsUntilResend(nowMillis: Long = System.currentTimeMillis()): Int {
        val target = resendAt?.let {
            try {
                Instant.parse(it).toEpochMilli()
            } catch (error: DateTimeParseException) {
                null
            }
        }
        if (target != null) {
            val remaining = ((target - nowMillis) / 1000).toInt()
            return remaining.coerceAtLeast(0)
        }
        return 60
    }
}

data class VerificationResult(val token: String, val userId: String? = null)

class AuthRepository(
    private val service: AuthApiService,
    private val tokenStore: TokenStore,
) {
    val token: Flow<String?> = tokenStore.token

    suspend fun start(whatsappNumber: String): VerificationSession {
        val response = service.start(StartRequest(whatsappNumber = whatsappNumber))
        return VerificationSession(
            sessionId = response.sessionId,
            expiresAt = response.expiresAt,
            resendAt = response.resendAt,
        )
    }

    suspend fun verify(sessionId: String, code: String): VerificationResult {
        val response = service.verify(VerifyRequest(sessionId = sessionId, code = code))
        tokenStore.save(response.token)
        return VerificationResult(token = response.token, userId = response.userId)
    }

    suspend fun clearToken() {
        tokenStore.clear()
    }
}
