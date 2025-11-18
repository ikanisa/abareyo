package com.rayon.mobile.auth

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.rayon.mobile.data.PreferencesTokenStore
import com.rayon.mobile.network.SupabaseWhatsAppClient
import com.rayon.mobile.network.WhatsAppAuthService
import com.rayon.mobile.ui.OtpEntryScreen
import com.rayon.mobile.otputils.normalisePhoneNumber
import com.rayon.mobile.otputils.sanitisePhoneNumber
import io.ktor.client.HttpClient
import io.ktor.client.engine.android.Android
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory

class AuthActivity : ComponentActivity() {
  private val tokenStore by lazy { PreferencesTokenStore(this) }
  private val httpClient by lazy { HttpClient(Android) }

  private fun buildRepository(): AuthRepository {
    val baseUrl = BuildConfig.API_BASE_URL
    val retrofit = Retrofit.Builder()
      .baseUrl(baseUrl)
      .addConverterFactory(MoshiConverterFactory.create())
      .build()
      .create(WhatsAppAuthService::class.java)

    return AuthRepository(
      retrofit,
      SupabaseWhatsAppClient(httpClient, baseUrl.trimEnd('/')),
      tokenStore,
    )
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val repository = buildRepository()

    setContent {
      val scope = rememberCoroutineScope()
      val phone = remember { mutableStateOf("") }
      val awaitingCode = remember { mutableStateOf(false) }
      val statusMessage = remember { mutableStateOf("") }
      val phoneError = remember { mutableStateOf<String?>(null) }
      val token by tokenStore.token.collectAsState(initial = null)

      MaterialTheme {
        Surface(modifier = Modifier.padding(24.dp)) {
          Column {
            Text(text = "WhatsApp Login")
            OutlinedTextField(
              modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp),
              value = phone.value,
              onValueChange = { value ->
                phone.value = sanitisePhoneNumber(value)
                phoneError.value = null
              },
              label = { Text(text = "Phone number") },
              enabled = token == null,
            )
            phoneError.value?.let { Text(text = it, color = MaterialTheme.colorScheme.error) }
            token?.let { Text(text = "Signed in", modifier = Modifier.padding(top = 8.dp)) }
            Button(
              modifier = Modifier
                .padding(top = 16.dp)
                .fillMaxWidth(),
              enabled = token == null,
              onClick = {
                val sanitised = sanitisePhoneNumber(phone.value)
                if (sanitised.length < 10) {
                  phoneError.value = "Enter a full number"
                  return@Button
                }
                scope.launch {
                  runCatching { repository.requestOtp(normalisePhoneNumber(sanitised)) }
                    .onSuccess {
                      awaitingCode.value = true
                      statusMessage.value = "Code sent"
                    }
                    .onFailure { phoneError.value = it.message }
                }
              },
            ) {
              Text(text = "Send code")
            }
            if (awaitingCode.value) {
              OtpEntryScreen(
                phoneNumber = normalisePhoneNumber(phone.value),
                statusMessage = statusMessage,
                onVerify = { code ->
                  repository.verifyOtp(normalisePhoneNumber(phone.value), code)
                },
                onResend = {
                  repository.requestOtp(normalisePhoneNumber(phone.value))
                },
              )
            }
            Button(
              modifier = Modifier
                .padding(top = 16.dp)
                .fillMaxWidth(),
              enabled = token != null,
              onClick = {
                scope.launch {
                  repository.logout()
                }
              },
            ) {
              Text(text = "Log out")
            }
          }
        }
      }
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    httpClient.close()
  }
}
