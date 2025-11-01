#if canImport(Combine)
import XCTest
@testable import AuthModule

final class MockNetworking: AuthNetworking {
    var startCallCount = 0
    var verifyCallCount = 0
    var startResponse: AuthStartResponse
    var verifyResponse: AuthVerifyResponse

    init(
        startResponse: AuthStartResponse = AuthStartResponse(sessionId: "session", expiresAt: nil, resendAt: nil),
        verifyResponse: AuthVerifyResponse = AuthVerifyResponse(token: "token", refreshToken: nil, userId: "user")
    ) {
        self.startResponse = startResponse
        self.verifyResponse = verifyResponse
    }

    func start(whatsappNumber: String) async throws -> AuthStartResponse {
        startCallCount += 1
        return startResponse
    }

    func verify(sessionId: String, code: String) async throws -> AuthVerifyResponse {
        verifyCallCount += 1
        return verifyResponse
    }
}

final class InMemoryTokenStorage: TokenStorage {
    private(set) var stored: String?

    func readToken() async throws -> String? {
        stored
    }

    func save(token: String) async throws {
        stored = token
    }

    func clear() async throws {
        stored = nil
    }
}

final class AuthViewModelTests: XCTestCase {
    func testVerifyRequiresSixDigits() async {
        let networking = MockNetworking()
        let storage = InMemoryTokenStorage()
        let viewModel = AuthViewModel(networking: networking, storage: storage)

        await MainActor.run {
            viewModel.updateWhatsappNumber("+250700000000")
            viewModel.requestCode()
        }

        await Task.yield()

        await MainActor.run {
            viewModel.updateCode("123")
            viewModel.verify()
            XCTAssertEqual(viewModel.errorMessage, "Enter the 6-digit code from WhatsApp")
            XCTAssertEqual(networking.verifyCallCount, 0)
        }
    }

    func testSuccessfulVerificationPersistsToken() async {
        let networking = MockNetworking(
            startResponse: AuthStartResponse(sessionId: "session", expiresAt: nil, resendAt: nil),
            verifyResponse: AuthVerifyResponse(token: "jwt-token", refreshToken: nil, userId: "user")
        )
        let storage = InMemoryTokenStorage()
        let viewModel = AuthViewModel(networking: networking, storage: storage)

        await MainActor.run {
            viewModel.updateWhatsappNumber("+250700000000")
            viewModel.requestCode()
        }

        await Task.yield()

        await MainActor.run {
            viewModel.updateCode("123456")
            viewModel.verify()
        }

        await Task.yield()

        await MainActor.run {
            XCTAssertEqual(viewModel.token, "jwt-token")
            XCTAssertEqual(storage.stored, "jwt-token")
            XCTAssertEqual(networking.verifyCallCount, 1)
        }
    }
}
#endif
