package com.gikundiro.app.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import java.util.concurrent.TimeUnit

data class MerchantKey(
    val merchantId: String,
    val secret: String,
)

class MerchantKeyRepository(
    private val config: SupabaseConfig,
    private val client: OkHttpClient = OkHttpClient.Builder()
        .callTimeout(15, TimeUnit.SECONDS)
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()
) {
    suspend fun fetchMerchantKeys(): List<MerchantKey> = withContext(Dispatchers.IO) {
        val url = "${config.url.trimEnd('/')}/rest/v1/merchant_keys?select=merchant_id,secret"
        val request = Request.Builder()
            .url(url)
            .get()
            .addHeader("apikey", config.serviceKey)
            .addHeader("Authorization", "Bearer ${config.serviceKey}")
            .addHeader("Accept", "application/json")
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IllegalStateException("Supabase merchant key request failed: ${response.code}")
            }
            val body = response.body?.string().orEmpty()
            if (body.isBlank()) return@withContext emptyList()
            val array = JSONArray(body)
            buildList {
                for (index in 0 until array.length()) {
                    val obj = array.getJSONObject(index)
                    val merchantId = obj.optString("merchant_id")
                    val secret = obj.optString("secret")
                    if (merchantId.isNotBlank() && secret.isNotBlank()) {
                        add(MerchantKey(merchantId = merchantId, secret = secret))
                    }
                }
            }
        }
    }

    suspend fun recordNonce(nonce: String) = withContext(Dispatchers.IO) {
        val url = "${config.url.trimEnd('/')}/rest/v1/nonce_history"
        val payload = "{\"nonce\":\"$nonce\"}"
        val request = Request.Builder()
            .url(url)
            .post(payload.toRequestBody("application/json".toMediaType()))
            .addHeader("apikey", config.serviceKey)
            .addHeader("Authorization", "Bearer ${config.serviceKey}")
            .addHeader("Prefer", "resolution=merge-duplicates")
            .build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IllegalStateException("Failed to persist nonce remotely: ${response.code}")
            }
        }
    }
}
