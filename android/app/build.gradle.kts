import java.util.Base64

plugins {
    id("com.android.application")
    kotlin("android")
}

val keystoreDir = layout.buildDirectory.dir("keystore")
val keystoreFile = keystoreDir.map { it.file("release.jks") }
val keystoreBase64 = System.getenv("ANDROID_KEYSTORE_BASE64")
    ?: project.findProperty("ANDROID_KEYSTORE_BASE64") as? String

if (keystoreBase64 != null) {
    val bytes = Base64.getDecoder().decode(keystoreBase64)
    val file = keystoreFile.get().asFile
    if (!file.exists()) {
        file.parentFile.mkdirs()
        file.writeBytes(bytes)
    }
}

fun resolvedSecret(envKey: String): String {
    val envValue = providers.environmentVariable(envKey).orNull
        ?: project.findProperty(envKey) as? String
        ?: ""
    return envValue.replace("\"", "\\\"")
}

android {
    namespace = "com.abareyo.mobile"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.abareyo.mobile"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    signingConfigs {
        create("release") {
            if (keystoreBase64 != null) {
                storeFile = keystoreFile.get().asFile
                storePassword = resolvedSecret("ANDROID_KEYSTORE_PASSWORD")
                keyAlias = resolvedSecret("ANDROID_KEYSTORE_ALIAS")
                keyPassword = resolvedSecret("ANDROID_KEY_PASSWORD").ifBlank { storePassword }
            } else {
                println("[android] Warning: ANDROID_KEYSTORE_BASE64 not provided; release builds will not be signed.")
            }
        }
    }

    buildTypes {
        getByName("debug") {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
            resValue("string", "app_name", "Abareyo Dev")
            listOf(
                "API_BASE_URL",
                "SUPABASE_URL",
                "SUPABASE_ANON_KEY",
                "SUPABASE_SERVICE_ROLE_KEY"
            ).forEach { key ->
                buildConfigField("String", key, "\"${resolvedSecret(key)}\"")
            }
        }
        getByName("release") {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
            listOf(
                "API_BASE_URL",
                "SUPABASE_URL",
                "SUPABASE_ANON_KEY",
                "SUPABASE_SERVICE_ROLE_KEY"
            ).forEach { key ->
                buildConfigField("String", key, "\"${resolvedSecret(key)}\"")
            }
        }
    }

    buildFeatures {
        buildConfig = true
    }
}
