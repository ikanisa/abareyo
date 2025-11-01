package com.rayonsports.fanapp.auth

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

private class FakeAuthService : AuthApiService {
    override suspend fun start(request: StartRequest): StartResponse =
        StartResponse(sessionId = "session", resendAt = null)

    override suspend fun verify(request: VerifyRequest): VerifyResponse =
        VerifyResponse(token = "token-123", userId = "user-1")
}

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {
    private val dispatcher = StandardTestDispatcher()
    private val tokenStore = InMemoryTokenStore()
    private val repository = AuthRepository(FakeAuthService(), tokenStore)

    @Test
    fun `verify requires six digits`() = runTest(dispatcher) {
        val viewModel = AuthViewModel(repository, dispatcher)
        viewModel.updateWhatsappNumber("+250700000000")
        viewModel.requestCode()
        dispatcher.scheduler.advanceUntilIdle()

        viewModel.updateCode("123")
        viewModel.verify()
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals("Enter the 6-digit code from WhatsApp", viewModel.state.value.error)
    }

    @Test
    fun `successful verification stores token`() = runTest(dispatcher) {
        val viewModel = AuthViewModel(repository, dispatcher)
        viewModel.updateWhatsappNumber("+250700000000")
        viewModel.requestCode()
        dispatcher.scheduler.advanceUntilIdle()

        viewModel.updateCode("123456")
        viewModel.verify()
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals("token-123", viewModel.state.value.token)
        assertEquals("Verification successful", viewModel.state.value.info)
    }
}

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
