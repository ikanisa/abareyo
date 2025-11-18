import SwiftUI
import OTPUtils

struct PhoneEntryView: View {
    @StateObject private var viewModel = AuthViewModel()
    @State private var awaitingCode = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Phone number") {
                    TextField("e.g. +2507...", text: $viewModel.phoneNumber)
                        .keyboardType(.phonePad)
                        .textContentType(.telephoneNumber)
                        .disabled(viewModel.token != nil)
                    if let error = viewModel.errorMessage {
                        Text(error).foregroundStyle(.red)
                    }
                    if let token = viewModel.token {
                        Text("Authenticated: \(token.prefix(8))…").font(.footnote)
                    }
                    Button("Send code") {
                        Task {
                            await viewModel.requestCode()
                            if viewModel.errorMessage == nil {
                                awaitingCode = true
                            }
                        }
                    }
                    .disabled(viewModel.token != nil)
                }

                if awaitingCode {
                    OtpVerifyView(viewModel: viewModel)
                }
            }
            .navigationTitle("WhatsApp Login")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    if viewModel.token != nil {
                        Button("Logout") { viewModel.logout() }
                    }
                }
            }
        }
    }
}

struct PhoneEntryView_Previews: PreviewProvider {
    static var previews: some View {
        PhoneEntryView()
    }
}
