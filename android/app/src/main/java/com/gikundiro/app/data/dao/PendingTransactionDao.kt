package com.gikundiro.app.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.gikundiro.app.data.entities.PendingTransaction

@Dao
interface PendingTransactionDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(transaction: PendingTransaction)

    @Query("SELECT * FROM pending_transactions WHERE status = :status")
    suspend fun findByStatus(status: String): List<PendingTransaction>

    @Update
    suspend fun update(transaction: PendingTransaction)

    @Query("DELETE FROM pending_transactions WHERE transaction_id = :transactionId")
    suspend fun delete(transactionId: String)
}
