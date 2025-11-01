package com.rayonsports.fanapp.data

import android.content.Context
import com.rayonsports.fanapp.data.entities.NonceRecord
import com.rayonsports.fanapp.data.entities.PendingTransaction

class TransactionRepository private constructor(context: Context) {
    private val database = AppDatabase.getInstance(context)
    private val nonceDao = database.nonceDao()
    private val pendingTransactionDao = database.pendingTransactionDao()

    suspend fun hasNonce(nonce: String): Boolean = nonceDao.hasNonce(nonce)

    suspend fun recordNonce(nonce: String) {
        nonceDao.insert(NonceRecord(nonce = nonce))
    }

    suspend fun savePendingTransaction(transactionId: String, payload: String) {
        pendingTransactionDao.upsert(
            PendingTransaction(
                transactionId = transactionId,
                payload = payload
            )
        )
    }

    suspend fun getPendingTransactions(): List<PendingTransaction> =
        pendingTransactionDao.findByStatus("pending")

    suspend fun markTransactionSynced(transactionId: String) {
        pendingTransactionDao.delete(transactionId)
    }

    companion object {
        @Volatile
        private var instance: TransactionRepository? = null

        fun getInstance(context: Context): TransactionRepository =
            instance ?: synchronized(this) {
                instance ?: TransactionRepository(context.applicationContext).also { instance = it }
            }
    }
}
