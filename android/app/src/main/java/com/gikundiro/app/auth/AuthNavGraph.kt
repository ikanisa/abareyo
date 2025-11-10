package com.gikundiro.app.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController

private object AuthDestinations {
    const val Start = "auth/start"
    const val Verify = "auth/verify"
    const val Success = "auth/success"
}

@Composable
fun AuthNavGraph(
    viewModel: AuthViewModel,
    navController: NavHostController = rememberNavController(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(state.session) {
        if (state.session != null && navController.currentDestination?.route != AuthDestinations.Verify) {
            navController.navigate(AuthDestinations.Verify)
        }
    }

    LaunchedEffect(state.token) {
        if (!state.token.isNullOrEmpty()) {
            navController.navigate(AuthDestinations.Success) {
                popUpTo(AuthDestinations.Start) { inclusive = true }
            }
        }
    }

    NavHost(navController = navController, startDestination = AuthDestinations.Start) {
        composable(AuthDestinations.Start) {
            StartScreen(
                state = state,
                onNumberChange = viewModel::updateWhatsappNumber,
                onSubmit = viewModel::requestCode,
            )
        }
        composable(AuthDestinations.Verify) {
            VerifyScreen(
                state = state,
                onCodeChange = viewModel::updateCode,
                onBack = {
                    viewModel.resetVerification()
                    navController.popBackStack()
                },
                onVerify = viewModel::verify,
                onResend = viewModel::requestCode,
            )
        }
        composable(AuthDestinations.Success) {
            SuccessScreen(state = state)
        }
    }
}

@Composable
private fun StartScreen(
    state: AuthUiState,
    onNumberChange: (String) -> Unit,
    onSubmit: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("Link your WhatsApp number", style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = state.whatsappNumber,
            onValueChange = onNumberChange,
            label = { Text("WhatsApp number") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        if (!state.error.isNullOrEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(state.error ?: "", color = MaterialTheme.colorScheme.error)
        }
        if (!state.info.isNullOrEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(state.info ?: "", color = MaterialTheme.colorScheme.primary)
        }
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = onSubmit,
            enabled = state.canRequestCode && !state.loading,
            modifier = Modifier.fillMaxWidth(),
        ) {
            if (state.loading) {
                CircularProgressIndicator(modifier = Modifier.height(20.dp), strokeWidth = 2.dp)
            } else {
                Text("Send code")
            }
        }
    }
}

@Composable
private fun VerifyScreen(
    state: AuthUiState,
    onCodeChange: (String) -> Unit,
    onBack: () -> Unit,
    onVerify: () -> Unit,
    onResend: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("Enter the code we sent", style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = state.code,
            onValueChange = onCodeChange,
            label = { Text("6-digit code") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        if (!state.info.isNullOrEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(state.info ?: "", color = MaterialTheme.colorScheme.primary)
        }
        if (!state.error.isNullOrEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(state.error ?: "", color = MaterialTheme.colorScheme.error)
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            if (state.resendSeconds > 0) {
                "Resend available in ${state.resendSeconds}s"
            } else {
                "You can resend a new code."
            },
            style = MaterialTheme.typography.bodyMedium,
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = onVerify,
            enabled = state.canVerify && !state.verifying,
            modifier = Modifier.fillMaxWidth(),
        ) {
            if (state.verifying) {
                CircularProgressIndicator(modifier = Modifier.height(20.dp), strokeWidth = 2.dp)
            } else {
                Text("Verify")
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Button(
            onClick = onResend,
            enabled = state.resendSeconds <= 0 && !state.loading,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Resend code")
        }
        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
            Text("Back")
        }
    }
}

@Composable
private fun SuccessScreen(state: AuthUiState) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("You're verified", style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(12.dp))
        Text("Token saved: ${state.token ?: ""}")
    }
}
