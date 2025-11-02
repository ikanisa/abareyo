plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.kapt")
}

android {
    namespace = "com.rayonsports.fanapp"
    compileSdk = 34

    fun resolveSecret(property: String, env: String? = null): String? {
        val gradleValue = providers.gradleProperty(property).orNull
            ?: findProperty(property) as? String
        if (!gradleValue.isNullOrBlank()) {
            return gradleValue
        }
        val envKey = env ?: property.uppercase().replace('.', '_')
        return System.getenv(envKey)?.takeIf { it.isNotBlank() }
    }

    defaultConfig {
        applicationId = "com.rayonsports.fanapp"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        val supabaseUrl = resolveSecret("supabase.url", "SUPABASE_URL") ?: ""
        val supabaseServiceKey = resolveSecret("supabase.service_key", "SUPABASE_SERVICE_KEY") ?: ""
        val apiBaseUrl = resolveSecret("api.base_url", "API_BASE_URL") ?: ""

        buildConfigField("String", "SUPABASE_URL", "\"$supabaseUrl\"")
        buildConfigField("String", "SUPABASE_SERVICE_KEY", "\"$supabaseServiceKey\"")
        buildConfigField("String", "API_BASE_URL", "\"$apiBaseUrl\"")
    }

    val releaseSigning = signingConfigs.create("release") {
        val keystorePath = resolveSecret("android.keystore.path", "ANDROID_KEYSTORE_PATH")
        val keystorePassword = resolveSecret("android.keystore.password", "ANDROID_KEYSTORE_PASSWORD")
        val keyAliasValue = resolveSecret("android.keystore.alias", "ANDROID_KEY_ALIAS")
        val keyPasswordValue = resolveSecret("android.keystore.key_password", "ANDROID_KEY_PASSWORD")

        if (!keystorePath.isNullOrBlank() && !keyAliasValue.isNullOrBlank()) {
            storeFile = file(keystorePath)
            storePassword = keystorePassword
            keyAlias = keyAliasValue
            keyPassword = keyPasswordValue
        }
    }

    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("debug")
        }

        getByName("release") {
            if (releaseSigning.storeFile != null && !releaseSigning.keyAlias.isNullOrBlank()) {
                signingConfig = releaseSigning
            }
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    splits {
        abi {
            isEnable = true
            reset()
            include("armeabi-v7a", "arm64-v8a", "x86_64")
            isUniversalApk = false
        }
    }

    bundle {
        abi {
            enableSplit = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = true
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.15"
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.activity:activity-ktx:1.8.2")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.2")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.6.2")
    implementation("androidx.navigation:navigation-compose:2.7.7")
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.11.0")
    implementation("com.squareup.moshi:moshi-kotlin:1.15.1")
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("io.mockk:mockk:1.13.9")
    implementation("com.getcapacitor:capacitor-android:5.7.0")
}
