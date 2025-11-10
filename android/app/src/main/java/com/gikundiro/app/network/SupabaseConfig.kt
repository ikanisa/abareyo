package com.gikundiro.app.network

data class SupabaseConfig(
    val url: String,
    val serviceKey: String,
)

object SupabaseConfigProvider {
    fun fromResources(context: android.content.Context): SupabaseConfig? {
        val resources = context.resources
        val url = com.gikundiro.app.BuildConfig.SUPABASE_URL.takeIf { it.isNotBlank() }
            ?: resources.getString(com.gikundiro.app.R.string.supabase_url)
        val key = com.gikundiro.app.BuildConfig.SUPABASE_SERVICE_KEY.takeIf { it.isNotBlank() }
            ?: resources.getString(com.gikundiro.app.R.string.supabase_service_key)
        if (url.isBlank() || key.isBlank()) {
            return null
        }
        return SupabaseConfig(url = url, serviceKey = key)
    }
}
