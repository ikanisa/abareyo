package com.rayon.mobile.otputils

import kotlin.math.ceil

const val OTP_LENGTH = 6
const val RESEND_INTERVAL_SECONDS = 30

fun sanitisePhoneNumber(raw: String): String =
  raw.replace(Regex("[^0-9+]"), "")
    .replace(Regex("\\+{2,}"), "+")
    .replace(Regex("(\\+)(?=\\+)"), "")

fun normalisePhoneNumber(raw: String): String {
  val trimmed = sanitisePhoneNumber(raw).trim()
  return if (trimmed.startsWith("+")) trimmed else "+$trimmed"
}

fun normaliseOtp(raw: String): String = raw.replace(Regex("\\D"), "").take(OTP_LENGTH)

fun isValidOtp(raw: String): Boolean = normaliseOtp(raw).length == OTP_LENGTH

class ResendController(private val windowSeconds: Int = RESEND_INTERVAL_SECONDS) {
  private var nextAllowedAt: Long = 0

  fun canSend(now: Long = System.currentTimeMillis()): Boolean = now >= nextAllowedAt

  fun registerSend(now: Long = System.currentTimeMillis()) {
    nextAllowedAt = now + windowSeconds * 1_000L
  }

  fun secondsUntilNext(now: Long = System.currentTimeMillis()): Int {
    if (canSend(now)) return 0
    return ceil((nextAllowedAt - now) / 1_000.0).toInt()
  }
}
