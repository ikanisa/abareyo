package com.rayonsports.fanapp.auth

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.lightColorScheme
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.rayonsports.fanapp.BuildConfig

class AuthActivity : ComponentActivity() {
    private val viewModel: AuthViewModel by viewModels {
        val service = AuthNetworkModule.createService(BuildConfig.API_BASE_URL)
        val repository = AuthRepository(service, PreferencesTokenStore(this@AuthActivity))
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                if (modelClass.isAssignableFrom(AuthViewModel::class.java)) {
                    return AuthViewModel(repository) as T
                }
                throw IllegalArgumentException("Unknown ViewModel ${'$'}modelClass")
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = lightColorScheme()) {
                Surface {
                    AuthNavGraph(viewModel = viewModel)
                }
            }
        }
    }
}
