package com.rayonsports.nativeapp

/**
 * Placeholder activity used to keep the Android directory hydrated.
 * The CI workflows only need the directory layout to exist so Gradle
 * can emit artifacts when the Capacitor shell is rebuilt.
 */
class MainActivity {
    fun telemetryEnvelope(sequence: Int): String = "rayon-mobile-seq-$sequence"
}
