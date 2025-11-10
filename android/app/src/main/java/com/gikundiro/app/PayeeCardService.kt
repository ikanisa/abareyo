package com.gikundiro.app

import android.nfc.cardemulation.HostApduService
import android.os.Bundle
import android.util.Log

class PayeeCardService : HostApduService() {
    override fun processCommandApdu(commandApdu: ByteArray?, extras: Bundle?): ByteArray? {
        if (commandApdu == null) {
            return STATUS_FAILED
        }

        if (!TapMoMoSessionManager.isArmed()) {
            Log.w(TAG, "TapMoMo session inactive; rejecting APDU")
            return STATUS_NOT_READY
        }

        return if (isSelectAid(commandApdu)) {
            val payload = TapMoMoSessionManager.nextPayload()
            if (payload == null) {
                Log.w(TAG, "No TapMoMo payload available")
                TapMoMoSessionManager.prefetch()
                STATUS_NO_PAYLOAD
            } else {
                Log.i(TAG, "Serving TapMoMo payload nonce=${payload.nonce}")
                payload.payload + STATUS_SUCCESS
            }
        } else {
            STATUS_INS_NOT_SUPPORTED
        }
    }

    override fun onDeactivated(reason: Int) {
        if (reason == DEACTIVATION_DESELECTED || reason == DEACTIVATION_LINK_LOSS) {
            Log.i(TAG, "TapMoMo session deactivated (reason=$reason)")
        }
    }

    private fun isSelectAid(commandApdu: ByteArray): Boolean {
        return commandApdu.size >= 4 &&
            commandApdu[0] == 0x00.toByte() &&
            commandApdu[1] == 0xA4.toByte() &&
            commandApdu[2] == 0x04.toByte()
    }

    companion object {
        private const val TAG = "PayeeCardService"
        private val STATUS_SUCCESS = byteArrayOf(0x90.toByte(), 0x00.toByte())
        private val STATUS_FAILED = byteArrayOf(0x6F.toByte(), 0x00.toByte())
        private val STATUS_NOT_READY = byteArrayOf(0x69.toByte(), 0x85.toByte())
        private val STATUS_NO_PAYLOAD = byteArrayOf(0x6A.toByte(), 0x82.toByte())
        private val STATUS_INS_NOT_SUPPORTED = byteArrayOf(0x6D.toByte(), 0x00.toByte())

        private operator fun ByteArray.plus(other: ByteArray): ByteArray {
            val result = ByteArray(this.size + other.size)
            System.arraycopy(this, 0, result, 0, this.size)
            System.arraycopy(other, 0, result, this.size, other.size)
            return result
        }
    }
}
