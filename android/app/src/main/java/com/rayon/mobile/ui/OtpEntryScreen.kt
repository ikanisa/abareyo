package com.rayon.mobile.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.rayon.mobile.otputils.RESEND_INTERVAL_SECONDS
import com.rayon.mobile.otputils.ResendController
import com.rayon.mobile.otputils.isValidOtp
import com.rayon.mobile.otputils.normaliseOtp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun OtpEntryScreen(
  phoneNumber: String,
  statusMessage: MutableState<String>,
  onVerify: suspend (String) -> Unit,
  onResend: suspend () -> Unit,
) {
  val otp = remember { mutableStateOf("") }
  val error = remember { mutableStateOf<String?>(null) }
  val remainingSeconds = remember { mutableStateOf(RESEND_INTERVAL_SECONDS) }
  val scope = rememberCoroutineScope()
  val resendController = remember { ResendController(RESEND_INTERVAL_SECONDS) }

  LaunchedEffect(phoneNumber) {
    remainingSeconds.value = RESEND_INTERVAL_SECONDS
    while (remainingSeconds.value > 0) {
      delay(1_000)
      remainingSeconds.value = remainingSeconds.value - 1
    }
  }

  Column(modifier = Modifier.padding(24.dp)) {
    Text(text = "Code sent to $phoneNumber")
    OutlinedTextField(
      modifier = Modifier
        .fillMaxWidth()
        .padding(top = 16.dp),
      value = otp.value,
      onValueChange = { value ->
        error.value = null
        otp.value = normaliseOtp(value)
      },
      label = { Text("6-digit code") },
    )
    error.value?.let { Text(text = it) }
    statusMessage.value.takeIf { it.isNotBlank() }?.let { Text(text = it) }
    Button(
      modifier = Modifier
        .padding(top = 24.dp)
        .fillMaxWidth(),
      onClick = {
        val code = normaliseOtp(otp.value)
        if (!isValidOtp(code)) {
          error.value = "Enter all six digits"
          return@Button
        }
        scope.launch {
          runCatching { onVerify(code) }
            .onFailure { error.value = it.message }
        }
      },
    ) {
      Text(text = "Verify")
    }
    Button(
      modifier = Modifier
        .padding(top = 12.dp)
        .fillMaxWidth(),
      enabled = remainingSeconds.value == 0,
      onClick = {
        if (!resendController.canSend()) {
          error.value = "Please wait ${resendController.secondsUntilNext()}s"
          return@Button
        }
        scope.launch {
          runCatching { onResend() }
            .onSuccess {
              resendController.registerSend()
              remainingSeconds.value = RESEND_INTERVAL_SECONDS
            }
            .onFailure { error.value = it.message }
        }
      },
    ) {
      val label = if (remainingSeconds.value == 0) "Resend" else "Resend in ${remainingSeconds.value}s"
      Text(text = label)
    }
  }
}
