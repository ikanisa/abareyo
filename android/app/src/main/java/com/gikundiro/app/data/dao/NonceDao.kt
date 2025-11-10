package com.gikundiro.app.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.gikundiro.app.data.entities.NonceRecord

@Dao
interface NonceDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(record: NonceRecord)

    @Query("SELECT EXISTS(SELECT 1 FROM nonce_history WHERE nonce = :nonce)")
    suspend fun hasNonce(nonce: String): Boolean
}
