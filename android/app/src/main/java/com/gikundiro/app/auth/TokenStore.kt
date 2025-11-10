package com.gikundiro.app.auth

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

interface TokenStore {
    val token: Flow<String?>
    suspend fun save(token: String)
    suspend fun clear()
}

private val Context.authDataStore by preferencesDataStore(name = "auth_preferences")

class PreferencesTokenStore(private val context: Context) : TokenStore {
    companion object {
        private val TOKEN_KEY = stringPreferencesKey("jwt")
    }

    override val token: Flow<String?> = context.authDataStore.data.map { prefs ->
        prefs[TOKEN_KEY]
    }

    override suspend fun save(token: String) {
        context.authDataStore.edit { prefs ->
            prefs[TOKEN_KEY] = token
        }
    }

    override suspend fun clear() {
        context.authDataStore.edit { prefs ->
            prefs.remove(TOKEN_KEY)
        }
    }
}
