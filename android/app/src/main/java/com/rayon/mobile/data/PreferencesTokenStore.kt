package com.rayon.mobile.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.preferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.tokenDataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_tokens")

class PreferencesTokenStore(private val context: Context) {
  private val tokenKey = preferencesKey<String>("jwt")

  val token: Flow<String?> = context.tokenDataStore.data
    .catch { exception ->
      if (exception is IOException) {
        emit(emptyPreferences())
      } else {
        throw exception
      }
    }
    .map { prefs -> prefs[tokenKey] }

  suspend fun save(tokenValue: String) {
    context.tokenDataStore.edit { prefs ->
      prefs[tokenKey] = tokenValue
    }
  }

  suspend fun clear() {
    context.tokenDataStore.edit { prefs ->
      prefs.remove(tokenKey)
    }
  }
}
