package com.rayon.widgets

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

private fun buildWhatsappUrl(number: String, message: String): String {
    val digits = number.filter { it.isDigit() }
    val encoded = Uri.encode(message)
    return "https://wa.me/$digits?text=$encoded"
}

@Composable
fun UssdFallbackCard(
    amount: Int,
    phone: String?,
    provider: String = "mtn",
    escalationNumber: String = "250788000000",
    supportNumber: String = "250788000000"
) {
    val context = LocalContext.current
    val dialCode = remember(amount, phone, provider) {
        when (provider) {
            "airtel" -> "tel:*500*1*${phone ?: "073xxxxxxx"}*$amount%23"
            else -> "tel:*182*1*1*${phone ?: "078xxxxxxx"}*$amount%23"
        }
    }
    val readableCode = dialCode.removePrefix("tel:").replace("%23", "#")

    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("USSD fallback ready", color = Color.White, fontWeight = FontWeight.Bold)
            Text(
                "Redis outages or template rejections shouldn't block onboarding—share the shortcode and follow manual session provisioning.",
                color = Color(0xCCFFFFFF)
            )
            Column(
                modifier = Modifier
                    .background(Color(0x33FFFFFF), RoundedCornerShape(16.dp))
                    .padding(12.dp)
            ) {
                Text("Dial code", color = Color(0xAAFFFFFF))
                Text(readableCode, color = Color.White, fontWeight = FontWeight.Bold)
            }
            Button(onClick = {
                context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse(dialCode)))
            }) {
                Text("Dial now")
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(onClick = {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(buildWhatsappUrl(supportNumber, "USSD fallback for $readableCode"))))
                }, modifier = Modifier.weight(1f)) {
                    Text("Share via WhatsApp")
                }
                OutlinedButton(onClick = {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(buildWhatsappUrl(escalationNumber, "Escalate OTP fallback"))))
                }, modifier = Modifier.weight(1f)) {
                    Text("Escalate")
                }
            }
        }
    }
}

@Composable
fun PaymentReminderCard(
    amount: Int,
    reference: String?,
    supportNumber: String = "250788000000",
    deeplink: String = "rayon://payments/history"
) {
    val context = LocalContext.current
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFF0f172a)),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Payment-first reminder", color = Color(0xFFF1F5F9), fontWeight = FontWeight.Bold)
            Text(
                "Customers must receive MTN/Airtel confirmation via SMS or WhatsApp before UI updates are marked complete.",
                color = Color(0xE6E8F0FF)
            )
            Text("Amount: RWF %,d".format(amount), color = Color(0xFF34d399))
            reference?.let {
                Text("Reference: $it", color = Color(0xFF34d399))
            }
            Button(onClick = {
                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(deeplink)))
            }) { Text("Open payment history") }
            OutlinedButton(onClick = {
                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(buildWhatsappUrl(supportNumber, "Payment confirmation for RWF %,d".format(amount)))))
            }) { Text("Send WhatsApp receipt") }
        }
    }
}

@Composable
fun WhatsAppSessionHelperCard(
    phone: String,
    baseUrl: String,
    supportNumber: String = "250788000000",
    escalationNumber: String = "250788000000",
    manualSessionUrl: String = "https://github.com/rayonhq/abareyo/blob/main/docs/runbooks/otp-fallbacks.md#2-manual-session-provisioning"
) {
    val context = LocalContext.current
    val statusState = remember { mutableStateOf("loading") }
    val lastSentState = remember { mutableStateOf("-") }
    val errorState = remember { mutableStateOf<String?>(null) }

    LaunchedEffect(phone, baseUrl) {
        try {
            val payload = withContext(Dispatchers.IO) {
                val url = URL("$baseUrl/otp/status")
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                }
                conn.inputStream.bufferedReader().use { it.readText() }
            }
            val json = JSONObject(payload)
            val whatsapp = json.optJSONObject("whatsapp")
            statusState.value = whatsapp?.optString("lastDeliveryStatus") ?: "unknown"
            lastSentState.value = whatsapp?.optString("lastSentAt") ?: "-"
            errorState.value = whatsapp?.optString("lastError")?.takeIf { it.isNotEmpty() }
        } catch (err: Exception) {
            errorState.value = err.message
        }
    }

    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("WhatsApp session helper", color = Color.White, fontWeight = FontWeight.Bold)
            Text("Last status: ${statusState.value}", color = Color.White)
            Text("Last sent: ${lastSentState.value}", color = Color.White)
            errorState.value?.let { Text(it, color = Color(0xFFF87171)) }
            Button(onClick = {
                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("$baseUrl/otp/whatsapp/resend?phone=$phone")))
            }) { Text("Resend WhatsApp OTP") }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(onClick = {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(buildWhatsappUrl(supportNumber, "Checking OTP delivery for $phone"))))
                }, modifier = Modifier.weight(1f)) { Text("Open chat") }
                OutlinedButton(onClick = {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(buildWhatsappUrl(escalationNumber, "Escalate WhatsApp OTP"))))
                }, modifier = Modifier.weight(1f)) { Text("Escalate") }
            }
            Text(
                "Manual session instructions",
                color = Color(0xFF38bdf8),
                modifier = Modifier.clickable {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(manualSessionUrl)))
                }
            )
        }
    }
}
