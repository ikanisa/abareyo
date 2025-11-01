package com.rayonsports.fanapp.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private const val RESEND_FALLBACK_SECONDS = 60

data class AuthUiState(
    val whatsappNumber: String = "",
    val code: String = "",
    val loading: Boolean = false,
    val verifying: Boolean = false,
    val error: String? = null,
    val info: String? = null,
    val session: VerificationSession? = null,
    val resendSeconds: Int = 0,
    val token: String? = null,
) {
    val canRequestCode: Boolean
        get() = whatsappNumber.trim().length >= 8

    val canVerify: Boolean
        get() = code.length == 6 && session != null
}

class AuthViewModel(
    private val repository: AuthRepository,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO,
) : ViewModel() {
    private val _state = MutableStateFlow(AuthUiState())
    val state: StateFlow<AuthUiState> = _state.asStateFlow()

    private var timerJob: Job? = null

    init {
        viewModelScope.launch {
            repository.token.collect { token ->
                _state.update { it.copy(token = token) }
            }
        }
    }

    fun updateWhatsappNumber(value: String) {
        _state.update { it.copy(whatsappNumber = value, error = null) }
    }

    fun updateCode(value: String) {
        val sanitized = value.filter { it.isDigit() }.take(6)
        _state.update { it.copy(code = sanitized, error = null) }
    }

    fun requestCode() {
        val number = state.value.whatsappNumber.trim()
        if (number.length < 8) {
            _state.update { it.copy(error = "Enter a valid WhatsApp number") }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null, info = null) }
            try {
                val session = withContext(ioDispatcher) {
                    repository.start(number)
                }
                _state.update {
                    it.copy(
                        loading = false,
                        session = session,
                        info = "Code sent via WhatsApp",
                        code = "",
                        resendSeconds = session.secondsUntilResend().takeIf { seconds -> seconds > 0 }
                            ?: RESEND_FALLBACK_SECONDS,
                    )
                }
                startTimer()
            } catch (error: Exception) {
                _state.update {
                    it.copy(
                        loading = false,
                        error = error.message ?: "Unable to start verification",
                    )
                }
            }
        }
    }

    fun resetVerification() {
        timerJob?.cancel()
        _state.update { it.copy(session = null, code = "", resendSeconds = 0) }
    }

    fun verify() {
        val current = state.value
        val sessionId = current.session?.sessionId
        if (sessionId.isNullOrBlank()) {
            _state.update { it.copy(error = "Start verification first") }
            return
        }
        if (current.code.length != 6) {
            _state.update { it.copy(error = "Enter the 6-digit code from WhatsApp") }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(verifying = true, error = null, info = null) }
            try {
                val result = withContext(ioDispatcher) {
                    repository.verify(sessionId, current.code)
                }
                timerJob?.cancel()
                _state.update {
                    it.copy(
                        verifying = false,
                        token = result.token,
                        info = "Verification successful",
                        session = null,
                        resendSeconds = 0,
                    )
                }
            } catch (error: Exception) {
                _state.update {
                    it.copy(
                        verifying = false,
                        error = error.message ?: "Verification failed",
                    )
                }
            }
        }
    }

    private fun startTimer() {
        timerJob?.cancel()
        val starting = state.value.resendSeconds
        if (starting <= 0) {
            _state.update { it.copy(resendSeconds = 0) }
            return
        }
        timerJob = viewModelScope.launch {
            var remaining = starting
            while (remaining > 0) {
                _state.update { it.copy(resendSeconds = remaining) }
                delay(1000)
                remaining -= 1
            }
            _state.update { it.copy(resendSeconds = 0) }
        }
    }
}
