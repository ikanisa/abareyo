package com.rayon.mobile.auth

import com.rayon.mobile.data.PreferencesTokenStore
import com.rayon.mobile.network.OtpRequest
import com.rayon.mobile.network.OtpVerifyRequest
import com.rayon.mobile.network.SupabaseWhatsAppClient
import com.rayon.mobile.network.WhatsAppAuthService

class AuthRepository(
  private val retrofitService: WhatsAppAuthService,
  private val httpClient: SupabaseWhatsAppClient,
  private val tokenStore: PreferencesTokenStore,
) {
  suspend fun requestOtp(phone: String) {
    val payload = OtpRequest(phoneNumber = phone)
    // Dual dispatch so either backend (Retrofit) or Supabase edge returns first
    runCatching { retrofitService.request(payload) }
    httpClient.requestOtp(payload)
  }

  suspend fun verifyOtp(phone: String, code: String): String {
    val payload = OtpVerifyRequest(phoneNumber = phone, code = code)
    val response = runCatching { retrofitService.verify(payload) }.getOrElse {
      httpClient.verifyOtp(payload)
    }
    tokenStore.save(response.token)
    return response.token
  }

  suspend fun logout() {
    tokenStore.clear()
  }
}
