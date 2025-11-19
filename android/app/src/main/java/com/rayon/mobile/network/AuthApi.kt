package com.rayon.mobile.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.request.url
import retrofit2.http.Body
import retrofit2.http.POST

private const val DEFAULT_ENDPOINT = "api/mobile/whatsapp"

data class OtpRequest(val phoneNumber: String)
data class OtpVerifyRequest(val phoneNumber: String, val code: String)
data class OtpRequestResponse(val correlationId: String)
data class OtpVerifyResponse(val token: String)

interface WhatsAppAuthService {
  @POST("$DEFAULT_ENDPOINT/request")
  suspend fun request(@Body payload: OtpRequest): OtpRequestResponse

  @POST("$DEFAULT_ENDPOINT/verify")
  suspend fun verify(@Body payload: OtpVerifyRequest): OtpVerifyResponse
}

class SupabaseWhatsAppClient(private val httpClient: HttpClient, private val baseUrl: String) {
  suspend fun requestOtp(payload: OtpRequest): OtpRequestResponse =
    httpClient.post {
      url("$baseUrl/$DEFAULT_ENDPOINT/request")
      setBody(payload)
    }.body()

  suspend fun verifyOtp(payload: OtpVerifyRequest): OtpVerifyResponse =
    httpClient.post {
      url("$baseUrl/$DEFAULT_ENDPOINT/verify")
      setBody(payload)
    }.body()
}
