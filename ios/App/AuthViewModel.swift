import Foundation
import OTPUtils

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var phoneNumber: String = ""
    @Published var otp: String = ""
    @Published var statusMessage: String = ""
    @Published var errorMessage: String?
    @Published var token: String?
    @Published var remainingSeconds: Int = Int(resendIntervalSeconds)

    private let api = AuthAPI()
    private let keychain = KeychainTokenStorage()
    private let resendController = ResendController()
    private var countdownTask: Task<Void, Never>?

    init() {
        token = keychain.load()
    }

    func requestCode() async {
        let cleaned = sanitisePhoneNumber(phoneNumber)
        guard cleaned.count >= 10 else {
            errorMessage = "Enter a valid number"
            return
        }
        guard resendController.canSend() else {
            errorMessage = "Wait \(resendController.secondsUntilNext())s"
            return
        }

        do {
            let normalised = normalisePhoneNumber(cleaned)
            try await api.requestOtp(phoneNumber: normalised)
            resendController.registerSend()
            statusMessage = "Code sent to \(normalised)"
            errorMessage = nil
            restartCountdown()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func verifyCode() async {
        let code = normaliseOtp(otp)
        guard isValidOtp(code) else {
            errorMessage = "Enter all digits"
            return
        }
        do {
            let normalised = normalisePhoneNumber(phoneNumber)
            let jwt = try await api.verifyOtp(phoneNumber: normalised, code: code)
            keychain.save(token: jwt)
            token = jwt
            statusMessage = "Authenticated"
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func logout() {
        keychain.clear()
        token = nil
        statusMessage = "Signed out"
    }

    private func restartCountdown() {
        countdownTask?.cancel()
        remainingSeconds = Int(resendIntervalSeconds)
        countdownTask = Task { [weak self] in
            guard let self = self else { return }
            while self.remainingSeconds > 0 && !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                if Task.isCancelled { break }
                self.remainingSeconds -= 1
            }
        }
    }
}
