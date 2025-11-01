package com.rayonsports.fanapp.reader

import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.lifecycle.lifecycleScope
import com.rayonsports.fanapp.FanAppPlugin
import com.rayonsports.fanapp.R
import com.rayonsports.fanapp.data.TransactionRepository
import com.rayonsports.fanapp.network.MerchantKeyRepository
import com.rayonsports.fanapp.network.SupabaseConfigProvider
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import kotlin.text.Charsets
import java.security.MessageDigest
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

class ReaderModeActivity : ComponentActivity() {
    private val readerFlags =
        NfcAdapter.FLAG_READER_NFC_A or
            NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK

    private val coroutineHandler = CoroutineExceptionHandler { _, error ->
        Log.e(TAG, "Reader mode failure", error)
        FanAppPlugin.emit(
            READER_MODE_ERROR_EVENT,
            mapOf(
                "stage" to "reader", "message" to (error.message ?: "Unknown error")
            )
        )
        finish()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.empty_layout)
        enableReaderMode()
    }

    override fun onPause() {
        super.onPause()
        disableReaderMode()
    }

    override fun onResume() {
        super.onResume()
        enableReaderMode()
    }

    private fun enableReaderMode() {
        val adapter = NfcAdapter.getDefaultAdapter(this)
        adapter?.enableReaderMode(this, ::onTagDiscovered, readerFlags, Bundle())
    }

    private fun disableReaderMode() {
        val adapter = NfcAdapter.getDefaultAdapter(this)
        adapter?.disableReaderMode(this)
    }

    private fun onTagDiscovered(tag: Tag) {
        lifecycleScope.launch(coroutineHandler) {
            val isoDep = IsoDep.get(tag) ?: error("ISO-DEP technology missing")
            val payload = withContext(Dispatchers.IO) {
                isoDep.connect()
                try {
                    val selectCommand = buildSelectAidApdu(CUSTOM_AID)
                    isoDep.transceive(selectCommand)
                    val response = isoDep.transceive(GET_DATA_COMMAND)
                    String(response, Charsets.UTF_8).trim { it <= '\u0000' }
                } finally {
                    runCatching { isoDep.close() }
                }
            }
            processPayload(payload)
        }
    }

    private suspend fun processPayload(payload: String) {
        val parsed = parsePayload(payload)
        val config = SupabaseConfigProvider.fromResources(this)
            ?: error("Missing Supabase configuration")
        val merchantRepository = MerchantKeyRepository(config)
        val keys = try {
            merchantRepository.fetchMerchantKeys()
        } catch (error: Exception) {
            FanAppPlugin.emit(
                READER_MODE_ERROR_EVENT,
                mapOf("stage" to "network", "message" to (error.message ?: "Unable to load merchant keys"))
            )
            return
        }
        val matchingKey = keys.firstOrNull { it.merchantId == parsed.merchantId }
            ?: error("Merchant key unavailable")
        val hmacValid = verifyHmac(parsed, matchingKey.secret)
        if (!hmacValid) {
            FanAppPlugin.emit(
                READER_MODE_ERROR_EVENT,
                mapOf("stage" to "verification", "message" to "Invalid signature")
            )
            return
        }
        val transactionRepository = TransactionRepository.getInstance(this)
        if (transactionRepository.hasNonce(parsed.nonce)) {
            FanAppPlugin.emit(
                READER_MODE_ERROR_EVENT,
                mapOf("stage" to "nonce", "message" to "Nonce already used")
            )
            return
        }
        transactionRepository.recordNonce(parsed.nonce)
        transactionRepository.savePendingTransaction(parsed.transactionId, payload)
        runCatching { merchantRepository.recordNonce(parsed.nonce) }
        FanAppPlugin.emit(
            READER_MODE_SUCCESS_EVENT,
            mapOf(
                "transactionId" to parsed.transactionId,
                "merchantId" to parsed.merchantId,
                "amount" to parsed.amount,
                "nonce" to parsed.nonce
            )
        )
        finish()
    }

    private fun parsePayload(raw: String): MerchantPayload {
        val json = JSONObject(raw)
        return MerchantPayload(
            merchantId = json.getString("merchantId"),
            transactionId = json.getString("transactionId"),
            amount = json.getDouble("amount"),
            nonce = json.getString("nonce"),
            signature = json.getString("hmac")
        )
    }

    private fun verifyHmac(payload: MerchantPayload, key: String): Boolean {
        val mac = Mac.getInstance("HmacSHA256")
        val spec = SecretKeySpec(key.toByteArray(Charsets.UTF_8), "HmacSHA256")
        mac.init(spec)
        val message = listOf(
            payload.merchantId,
            payload.transactionId,
            payload.amount.toString(),
            payload.nonce
        ).joinToString(":")
        val expected = mac.doFinal(message.toByteArray(Charsets.UTF_8))
        val provided = hexStringToByteArray(payload.signature)
        return MessageDigest.isEqual(provided, expected)
    }

    private fun hexStringToByteArray(value: String): ByteArray {
        val clean = value.replace("[^0-9A-Fa-f]".toRegex(), "")
        require(clean.length % 2 == 0) { "Invalid hex string" }
        return ByteArray(clean.length / 2) { index ->
            val start = index * 2
            clean.substring(start, start + 2).toInt(16).toByte()
        }
    }

    companion object {
        private const val TAG = "ReaderModeActivity"
        const val CUSTOM_AID = "F012345678"
        private val GET_DATA_COMMAND = byteArrayOf(0x00, 0xCA.toByte(), 0x00, 0x00, 0x00)
        const val READER_MODE_SUCCESS_EVENT = "readerMode:success"
        const val READER_MODE_ERROR_EVENT = "readerMode:error"

        private fun buildSelectAidApdu(aid: String): ByteArray {
            val cleanAid = aid.replace(" ", "")
            val aidBytes = cleanAid.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
            val header = byteArrayOf(0x00, 0xA4.toByte(), 0x04, 0x00, aidBytes.size.toByte())
            return header + aidBytes
        }
    }
}

data class MerchantPayload(
    val merchantId: String,
    val transactionId: String,
    val amount: Double,
    val nonce: String,
    val signature: String
)
