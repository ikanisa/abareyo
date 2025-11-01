package com.rayonsports.fanapp.data.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.Instant

@Entity(tableName = "pending_transactions")
data class PendingTransaction(
    @PrimaryKey
    @ColumnInfo(name = "transaction_id")
    val transactionId: String,
    @ColumnInfo(name = "payload")
    val payload: String,
    @ColumnInfo(name = "status")
    val status: String = "pending",
    @ColumnInfo(name = "created_at")
    val createdAt: Instant = Instant.now()
)
