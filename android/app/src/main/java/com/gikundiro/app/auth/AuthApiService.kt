package com.gikundiro.app.auth

import retrofit2.http.Body
import retrofit2.http.POST

data class StartRequest(val whatsappNumber: String)

data class StartResponse(
    val sessionId: String,
    val expiresAt: String? = null,
    val resendAt: String? = null,
)

data class VerifyRequest(val sessionId: String, val code: String)

data class VerifyResponse(
    val token: String,
    val refreshToken: String? = null,
    val userId: String? = null,
)

interface AuthApiService {
    @POST("/auth/whatsapp/start")
    suspend fun start(@Body request: StartRequest): StartResponse

    @POST("/auth/whatsapp/verify")
    suspend fun verify(@Body request: VerifyRequest): VerifyResponse
}
