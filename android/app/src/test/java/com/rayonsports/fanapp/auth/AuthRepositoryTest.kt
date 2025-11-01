package com.rayonsports.fanapp.auth

import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

private class InMemoryTokenStore : TokenStore {
    private var stored: String? = null

    override val token = kotlinx.coroutines.flow.flow { emit(stored) }

    override suspend fun save(token: String) {
        stored = token
    }

    override suspend fun clear() {
        stored = null
    }
}

class AuthRepositoryTest {
    private val service = mockk<AuthApiService>()
    private val tokenStore = InMemoryTokenStore()
    private val repository = AuthRepository(service, tokenStore)

    @Test
    fun `start returns verification session`() = runBlocking {
        coEvery { service.start(any()) } returns StartResponse(sessionId = "abc", resendAt = "2024-01-01T00:00:00Z")

        val session = repository.start("+250700000000")

        assertEquals("abc", session.sessionId)
        assertEquals("2024-01-01T00:00:00Z", session.resendAt)
        assertEquals(60, session.secondsUntilResend(nowMillis = 0))
        coVerify { service.start(StartRequest(whatsappNumber = "+250700000000")) }
    }

    @Test
    fun `verify persists token`() = runBlocking {
        coEvery { service.verify(any()) } returns VerifyResponse(token = "jwt-token", userId = "user-1")

        val result = repository.verify("session", "123456")

        assertEquals("jwt-token", result.token)
        assertEquals("user-1", result.userId)
        assertEquals("jwt-token", tokenStore.token.first())
        coVerify { service.verify(VerifyRequest(sessionId = "session", code = "123456")) }

        tokenStore.clear()
        assertNull(tokenStore.token.first())
    }
}
