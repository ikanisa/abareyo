package com.gikundiro.app

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.PluginMethod
import java.util.concurrent.TimeUnit

@CapacitorPlugin(name = "TapMoMo")
class TapMoMoPlugin : Plugin() {
    @PluginMethod
    fun arm(call: PluginCall) {
        val baseUrl = call.getString("baseUrl")
        if (baseUrl.isNullOrBlank()) {
            call.reject("baseUrl is required")
            return
        }
        val durationSeconds = call.getInt("durationSeconds", 60)
        val cookie = call.getString("cookie")
        val bearer = call.getString("bearerToken")
        val payloadObject = call.getObject("initialPayload")
        val seed = payloadObject?.let { parsePayload(it) }
        TapMoMoSessionManager.arm(baseUrl, cookie, bearer, durationSeconds, seed)
        TapMoMoSessionManager.prefetch()
        val response = JSObject().apply {
            put("armedUntil", System.currentTimeMillis() + TimeUnit.SECONDS.toMillis(durationSeconds.toLong()))
        }
        call.resolve(response)
    }

    private fun parsePayload(payload: JSObject): TapMoMoSessionManager.PayloadRecord? {
        val payloadData = payload.getString("payload") ?: return null
        val nonce = payload.getString("nonce") ?: return null
        val expiresAtSeconds = payload.getLong("expiresAt") ?: 0L
        val signature = payload.getString("signature") ?: ""
        return TapMoMoSessionManager.PayloadRecord(
            payload = android.util.Base64.decode(payloadData, android.util.Base64.NO_WRAP),
            nonce = nonce,
            expiresAtMillis = if (expiresAtSeconds > 0) TimeUnit.SECONDS.toMillis(expiresAtSeconds) else 0L,
            signature = signature,
            consumed = false
        )
    }
}
