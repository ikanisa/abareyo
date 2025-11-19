import SwiftUI
import OTPUtils

struct OtpVerifyView: View {
    @ObservedObject var viewModel: AuthViewModel

    var body: some View {
        Section("Verification") {
            TextField("6-digit code", text: $viewModel.otp)
                .keyboardType(.numberPad)
                .onChange(of: viewModel.otp) { _, newValue in
                    viewModel.otp = normaliseOtp(newValue)
                }
            if let error = viewModel.errorMessage {
                Text(error).foregroundStyle(.red)
            }
            if !viewModel.statusMessage.isEmpty {
                Text(viewModel.statusMessage).font(.footnote)
            }
            Button("Verify") {
                Task { await viewModel.verifyCode() }
            }
            Button(viewModel.remainingSeconds == 0 ? "Resend" : "Resend in \(viewModel.remainingSeconds)s") {
                Task { await viewModel.requestCode() }
            }
            .disabled(viewModel.remainingSeconds > 0)
        }
    }
}

struct OtpVerifyView_Previews: PreviewProvider {
    static var previews: some View {
        OtpVerifyView(viewModel: AuthViewModel())
    }
}
