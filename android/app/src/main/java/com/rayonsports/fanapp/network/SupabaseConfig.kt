package com.rayonsports.fanapp.network

data class SupabaseConfig(
    val url: String,
    val serviceKey: String,
)

object SupabaseConfigProvider {
    fun fromResources(context: android.content.Context): SupabaseConfig? {
        val resources = context.resources
        val url = com.rayonsports.fanapp.BuildConfig.SUPABASE_URL.takeIf { it.isNotBlank() }
            ?: resources.getString(com.rayonsports.fanapp.R.string.supabase_url)
        val key = com.rayonsports.fanapp.BuildConfig.SUPABASE_SERVICE_KEY.takeIf { it.isNotBlank() }
            ?: resources.getString(com.rayonsports.fanapp.R.string.supabase_service_key)
        if (url.isBlank() || key.isBlank()) {
            return null
        }
        return SupabaseConfig(url = url, serviceKey = key)
    }
}
