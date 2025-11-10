package com.gikundiro.app.ussd

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import com.gikundiro.app.FanAppPlugin

class UssdManager(private val context: Context) {
    private val mainHandler = Handler(Looper.getMainLooper())

    fun execute(code: String, preferredSlotIndex: Int? = null) {
        val telephonyManager = context.getSystemService(TelephonyManager::class.java)
        if (telephonyManager == null) {
            emitError("telephony", "Telephony services unavailable")
            launchDialerFallback(code)
            return
        }
        val subscriptionManager = context.getSystemService(SubscriptionManager::class.java)
        val subscriptions = subscriptionManager?.activeSubscriptionInfoList.orEmpty()
        val tm = when {
            preferredSlotIndex != null -> {
                val subInfo = subscriptions.getOrNull(preferredSlotIndex)
                subInfo?.let { telephonyManager.createForSubscriptionId(it.subscriptionId) }
            }
            subscriptions.size > 1 -> telephonyManager.createForSubscriptionId(subscriptions.first().subscriptionId)
            else -> telephonyManager
        }
        if (tm == null) {
            emitError("telephony", "Unable to determine SIM slot")
            launchDialerFallback(code)
            return
        }
        try {
            tm.sendUssdRequest(
                code,
                object : TelephonyManager.UssdResponseCallback() {
                    override fun onReceiveUssdResponse(
                        telephonyManager: TelephonyManager?,
                        request: String?,
                        response: CharSequence?
                    ) {
                        mainHandler.post {
                            FanAppPlugin.emit(
                                USSDEventSuccess,
                                mapOf(
                                    "request" to (request ?: code),
                                    "response" to response?.toString().orEmpty()
                                )
                            )
                        }
                    }

                    override fun onReceiveUssdResponseFailed(
                        telephonyManager: TelephonyManager?,
                        request: String?,
                        failureCode: Int
                    ) {
                        mainHandler.post {
                            emitError("ussd", "USSD request failed: $failureCode")
                            launchDialerFallback(code)
                        }
                    }
                },
                mainHandler
            )
        } catch (error: SecurityException) {
            emitError("permission", error.message ?: "Missing permission")
            launchDialerFallback(code)
        } catch (error: Exception) {
            emitError("ussd", error.message ?: "Unknown error")
            launchDialerFallback(code)
        }
    }

    private fun launchDialerFallback(code: String) {
        val encoded = Uri.encode(code)
        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$encoded"))
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        ContextCompat.startActivity(context, intent, null)
        FanAppPlugin.emit(
            USSDEventFallback,
            mapOf("code" to code)
        )
    }

    private fun emitError(stage: String, message: String) {
        FanAppPlugin.emit(
            USSDEventError,
            mapOf("stage" to stage, "message" to message)
        )
    }

    companion object {
        const val USSDEventSuccess = "ussd:success"
        const val USSDEventError = "ussd:error"
        const val USSDEventFallback = "ussd:fallback"
    }
}
