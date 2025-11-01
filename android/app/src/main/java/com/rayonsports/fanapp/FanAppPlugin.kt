package com.rayonsports.fanapp

import android.content.Intent
import androidx.lifecycle.lifecycleScope
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.rayonsports.fanapp.data.TransactionRepository
import com.rayonsports.fanapp.reader.ReaderModeActivity
import com.rayonsports.fanapp.ussd.UssdManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@CapacitorPlugin(name = "FanApp")
class FanAppPlugin : Plugin() {
    init {
        instance = this
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        if (instance == this) {
            instance = null
        }
    }

    @PluginMethod
    fun noop(call: com.getcapacitor.PluginCall) {
        call.resolve()
    }

    @PluginMethod
    fun startReaderMode(call: com.getcapacitor.PluginCall) {
        val activity = activity
        if (activity == null) {
            call.reject("Activity unavailable")
            return
        }
        val intent = Intent(activity, ReaderModeActivity::class.java)
        activity.startActivity(intent)
        call.resolve()
    }

    @PluginMethod
    fun runUssd(call: com.getcapacitor.PluginCall) {
        val code = call.getString("code")
        if (code.isNullOrBlank()) {
            call.reject("USSD code required")
            return
        }
        val slotIndex = call.getInt("simSlot")
        val manager = UssdManager(context)
        val result = runCatching { manager.execute(code, slotIndex) }
        if (result.isFailure) {
            call.reject(result.exceptionOrNull()?.message ?: "Unable to initiate USSD session")
            return
        }
        call.resolve()
    }

    @PluginMethod
    fun getPendingTransactions(call: com.getcapacitor.PluginCall) {
        val repository = TransactionRepository.getInstance(context)
        val scope = activity?.lifecycleScope ?: lifecycleScope
        scope.launch(Dispatchers.IO) {
            try {
                val pending = repository.getPendingTransactions()
                val array = JSArray()
                pending.forEach { transaction ->
                    val obj = JSObject()
                    obj.put("transactionId", transaction.transactionId)
                    obj.put("payload", transaction.payload)
                    obj.put("status", transaction.status)
                    obj.put("createdAt", transaction.createdAt.toString())
                    array.put(obj)
                }
                withContext(Dispatchers.Main) {
                    val result = JSObject()
                    result.put("transactions", array)
                    call.resolve(result)
                }
            } catch (error: Exception) {
                withContext(Dispatchers.Main) {
                    call.reject(error.message ?: "Failed to load transactions")
                }
            }
        }
    }

    @PluginMethod
    fun markTransactionSynced(call: com.getcapacitor.PluginCall) {
        val transactionId = call.getString("transactionId")
        if (transactionId.isNullOrBlank()) {
            call.reject("transactionId required")
            return
        }
        val repository = TransactionRepository.getInstance(context)
        val scope = activity?.lifecycleScope ?: lifecycleScope
        scope.launch(Dispatchers.IO) {
            try {
                repository.markTransactionSynced(transactionId)
                withContext(Dispatchers.Main) { call.resolve() }
            } catch (error: Exception) {
                withContext(Dispatchers.Main) {
                    call.reject(error.message ?: "Failed to update transaction")
                }
            }
        }
    }

    companion object {
        @Volatile
        private var instance: FanAppPlugin? = null

        fun emit(event: String, payload: Map<String, Any?> = emptyMap()) {
            val plugin = instance ?: return
            val data = JSObject()
            payload.forEach { (key, value) ->
                when (value) {
                    null -> data.put(key, JSObject.NULL)
                    is Boolean -> data.put(key, value)
                    is Int -> data.put(key, value)
                    is Long -> data.put(key, value)
                    is Double -> data.put(key, value)
                    is String -> data.put(key, value)
                    else -> data.put(key, value.toString())
                }
            }
            plugin.bridge.triggerWindowJSEvent(event, data.toString())
        }
    }
}
