package com.rayonsports.fanapp

import android.util.Base64
import android.util.Log
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.Collections
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

object TapMoMoSessionManager {
    private const val TAG = "TapMoMoSession"
    private const val PAYLOAD_ENDPOINT = "/merchant/tapmomo/payload"

    data class Session(
        val baseUrl: String,
        val cookieHeader: String?,
        val bearerToken: String?,
        val armedUntil: Long,
        val payloads: MutableList<PayloadRecord> = Collections.synchronizedList(mutableListOf()),
        val usedNonces: MutableSet<String> = Collections.synchronizedSet(mutableSetOf())
    )

    data class PayloadRecord(
        val payload: ByteArray,
        val nonce: String,
        val expiresAtMillis: Long,
        val signature: String,
        @Volatile var consumed: Boolean = false
    )

    private val executor = Executors.newSingleThreadExecutor()

    @Volatile
    private var session: Session? = null

    @Synchronized
    fun arm(
        baseUrl: String,
        cookieHeader: String?,
        bearerToken: String?,
        durationSeconds: Int,
        seed: PayloadRecord?
    ) {
        val now = System.currentTimeMillis()
        val expiresAt = now + TimeUnit.SECONDS.toMillis(durationSeconds.toLong())
        val trimmedBaseUrl = if (baseUrl.endsWith("/")) baseUrl.dropLast(1) else baseUrl
        val newSession = Session(
            baseUrl = trimmedBaseUrl,
            cookieHeader = cookieHeader,
            bearerToken = bearerToken,
            armedUntil = expiresAt
        )
        seed?.let { record ->
            if (!record.isExpired(now)) {
                newSession.payloads.add(record)
            }
        }
        session = newSession
        Log.i(TAG, "TapMoMo session armed until ${expiresAt}")
    }

    fun clear() {
        session = null
    }

    fun isArmed(): Boolean {
        val current = session ?: return false
        val now = System.currentTimeMillis()
        if (now >= current.armedUntil) {
            clear()
            return false
        }
        return true
    }

    fun nextPayload(): PayloadRecord? {
        val current = session ?: return null
        val now = System.currentTimeMillis()
        current.payloads.removeAll { it.isExpired(now) || (it.consumed && now > it.expiresAtMillis) }
        val available = current.payloads.firstOrNull { !it.consumed && !it.isExpired(now) }
        if (available != null) {
            available.consumed = true
            current.usedNonces.add(available.nonce)
            return available
        }
        return fetchAndCachePayload(current)
    }

    private fun fetchAndCachePayload(current: Session): PayloadRecord? {
        val now = System.currentTimeMillis()
        if (now >= current.armedUntil) {
            Log.w(TAG, "Session expired before fetching payload")
            return null
        }
        val result = tryFetchPayload(current) ?: return null
        if (current.usedNonces.contains(result.nonce)) {
            Log.w(TAG, "Discarding payload with reused nonce: ${result.nonce}")
            return null
        }
        if (result.isExpired(now)) {
            Log.w(TAG, "Discarding expired payload from API")
            return null
        }
        current.payloads.add(result)
        result.consumed = true
        current.usedNonces.add(result.nonce)
        return result
    }

    fun prefetch() {
        val current = session ?: return
        executor.execute {
            fetchAndCachePayload(current)
        }
    }

    private fun tryFetchPayload(current: Session): PayloadRecord? {
        val url = URL(current.baseUrl + PAYLOAD_ENDPOINT)
        val connection = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Content-Type", "application/json")
            current.cookieHeader?.takeIf { it.isNotBlank() }?.let { setRequestProperty("Cookie", it) }
            current.bearerToken?.takeIf { it.isNotBlank() }?.let { setRequestProperty("Authorization", "Bearer $it") }
            doOutput = false
            connectTimeout = 3000
            readTimeout = 3000
        }
        return try {
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            if (stream == null) {
                Log.e(TAG, "TapMoMo payload request failed: empty response stream")
                return null
            }
            val body = BufferedReader(InputStreamReader(stream, StandardCharsets.UTF_8)).use { reader ->
                reader.lineSequence().joinToString(separator = "")
            }
            if (code !in 200..299) {
                Log.e(TAG, "TapMoMo payload request failed: HTTP $code $body")
                null
            } else {
                parsePayload(body)
            }
        } catch (error: Exception) {
            Log.e(TAG, "Unable to fetch TapMoMo payload", error)
            null
        } finally {
            connection.disconnect()
        }
    }

    private fun parsePayload(body: String): PayloadRecord? {
        return try {
            val json = JSONObject(body)
            if (!json.optBoolean("ok", false)) {
                Log.w(TAG, "TapMoMo API returned error payload: $body")
                return null
            }
            val data = json.getJSONObject("data")
            val encodedPayload = data.getString("payload")
            val nonce = data.getString("nonce")
            val expiresAtSeconds = data.optLong("expiresAt", 0L)
            val signature = data.optString("signature", "")
            val payloadBytes = Base64.decode(encodedPayload, Base64.NO_WRAP)
            val expiresMillis = if (expiresAtSeconds > 0) TimeUnit.SECONDS.toMillis(expiresAtSeconds) else 0L
            PayloadRecord(
                payload = payloadBytes,
                nonce = nonce,
                expiresAtMillis = expiresMillis,
                signature = signature
            )
        } catch (error: Exception) {
            Log.e(TAG, "Failed to parse TapMoMo payload", error)
            null
        }
    }

    private fun PayloadRecord.isExpired(now: Long): Boolean {
        return expiresAtMillis in 1..Long.MAX_VALUE && now >= expiresAtMillis
    }
}
