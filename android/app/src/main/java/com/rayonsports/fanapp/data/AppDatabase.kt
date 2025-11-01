package com.rayonsports.fanapp.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.rayonsports.fanapp.data.dao.NonceDao
import com.rayonsports.fanapp.data.dao.PendingTransactionDao
import com.rayonsports.fanapp.data.entities.NonceRecord
import com.rayonsports.fanapp.data.entities.PendingTransaction

@Database(
    entities = [NonceRecord::class, PendingTransaction::class],
    version = 1,
    exportSchema = true
)
@TypeConverters(InstantConverter::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun nonceDao(): NonceDao
    abstract fun pendingTransactionDao(): PendingTransactionDao

    companion object {
        @Volatile
        private var instance: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "fanapp.db"
                ).fallbackToDestructiveMigration().build().also { instance = it }
            }
    }
}
