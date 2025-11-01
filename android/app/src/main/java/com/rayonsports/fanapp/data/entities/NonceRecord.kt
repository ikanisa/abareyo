package com.rayonsports.fanapp.data.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.Instant

@Entity(tableName = "nonce_history")
data class NonceRecord(
    @PrimaryKey
    @ColumnInfo(name = "nonce")
    val nonce: String,
    @ColumnInfo(name = "created_at")
    val createdAt: Instant = Instant.now()
)
