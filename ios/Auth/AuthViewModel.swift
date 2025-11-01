#if canImport(Combine)
import Foundation
import Combine

@MainActor
public final class AuthViewModel: ObservableObject {
    @Published public private(set) var whatsappNumber: String = ""
    @Published public private(set) var code: String = ""
    @Published public private(set) var infoMessage: String?
    @Published public private(set) var errorMessage: String?
    @Published public private(set) var isRequesting: Bool = false
    @Published public private(set) var isVerifying: Bool = false
    @Published public private(set) var resendSeconds: Int = 0
    @Published public private(set) var token: String?

    private var sessionId: String?
    private var timer: Timer?
    private let networking: AuthNetworking
    private let storage: TokenStorage

    public init(networking: AuthNetworking = AuthAPI.shared, storage: TokenStorage = KeychainTokenStorage()) {
        self.networking = networking
        self.storage = storage
        Task {
            token = try? await storage.readToken()
        }
    }

    deinit {
        timer?.invalidate()
    }

    public var canRequestCode: Bool {
        whatsappNumber.trimmingCharacters(in: .whitespacesAndNewlines).count >= 8
    }

    public var canVerify: Bool {
        code.count == 6 && sessionId != nil
    }

    public func updateWhatsappNumber(_ value: String) {
        whatsappNumber = value
        errorMessage = nil
    }

    public func updateCode(_ value: String) {
        let filtered = value.filter { $0.isNumber }.prefix(6)
        code = String(filtered)
        errorMessage = nil
    }

    public func requestCode() {
        guard canRequestCode else {
            errorMessage = "Enter a valid WhatsApp number"
            return
        }
        isRequesting = true
        errorMessage = nil
        infoMessage = nil
        Task {
            do {
                let response = try await networking.start(whatsappNumber: whatsappNumber)
                sessionId = response.sessionId
                code = ""
                let seconds = AuthViewModel.secondsUntil(response.resendAt)
                startTimer(seconds: seconds > 0 ? seconds : 60)
                infoMessage = "Code sent via WhatsApp"
            } catch {
                errorMessage = error.localizedDescription
            }
            isRequesting = false
        }
    }

    public func verify() {
        guard let session = sessionId else {
            errorMessage = "Start verification first"
            return
        }
        guard code.count == 6 else {
            errorMessage = "Enter the 6-digit code from WhatsApp"
            return
        }
        isVerifying = true
        errorMessage = nil
        infoMessage = nil
        let currentCode = code
        Task {
            do {
                let response = try await networking.verify(sessionId: session, code: currentCode)
                try await storage.save(token: response.token)
                token = response.token
                infoMessage = "Verification successful"
                sessionId = nil
                resendSeconds = 0
                timer?.invalidate()
            } catch {
                errorMessage = error.localizedDescription
            }
            isVerifying = false
        }
    }

    public func reset() {
        timer?.invalidate()
        sessionId = nil
        resendSeconds = 0
        code = ""
    }

    private func startTimer(seconds: Int) {
        timer?.invalidate()
        resendSeconds = seconds
        guard seconds > 0 else { return }
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] timer in
            guard let self else {
                timer.invalidate()
                return
            }
            if self.resendSeconds <= 1 {
                self.resendSeconds = 0
                timer.invalidate()
            } else {
                self.resendSeconds -= 1
            }
        }
    }

    private static func secondsUntil(_ iso: String?) -> Int {
        guard let iso else { return 0 }
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: iso) else { return 0 }
        return max(0, Int(date.timeIntervalSinceNow.rounded()))
    }
}
#else
import Foundation

public final class AuthViewModel {
    public init(networking: AuthNetworking = AuthAPI.shared, storage: TokenStorage = KeychainTokenStorage()) {}
}
#endif
