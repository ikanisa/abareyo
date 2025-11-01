import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public struct AuthStartResponse: Codable {
    public let sessionId: String
    public let expiresAt: String?
    public let resendAt: String?
}

public struct AuthVerifyResponse: Codable {
    public let token: String
    public let refreshToken: String?
    public let userId: String?
}

public protocol AuthNetworking {
    func start(whatsappNumber: String) async throws -> AuthStartResponse
    func verify(sessionId: String, code: String) async throws -> AuthVerifyResponse
}

public struct AuthAPI: AuthNetworking {
    public static let shared = AuthAPI()

    private let baseURL: URL
    private let urlSession: URLSession

    public init(baseURL: URL? = AuthAPI.resolveBaseURL(), session: URLSession = .shared) {
        let resolved = baseURL ?? URL(string: "https://localhost")!
        self.baseURL = resolved
        self.urlSession = session
    }

    public func start(whatsappNumber: String) async throws -> AuthStartResponse {
        let request = try makeRequest(path: "/auth/whatsapp/start", payload: ["whatsappNumber": whatsappNumber])
        let (data, response) = try await urlSession.data(for: request)
        try validate(response: response, data: data)
        return try JSONDecoder().decode(AuthStartResponse.self, from: data)
    }

    public func verify(sessionId: String, code: String) async throws -> AuthVerifyResponse {
        let request = try makeRequest(path: "/auth/whatsapp/verify", payload: ["sessionId": sessionId, "code": code])
        let (data, response) = try await urlSession.data(for: request)
        try validate(response: response, data: data)
        return try JSONDecoder().decode(AuthVerifyResponse.self, from: data)
    }

    private func makeRequest(path: String, payload: [String: Any]) throws -> URLRequest {
        let normalized = path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let url = baseURL.appendingPathComponent(normalized)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: payload, options: [])
        return request
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        guard (200..<300).contains(http.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? ""
            throw NSError(domain: "AuthAPI", code: http.statusCode, userInfo: [NSLocalizedDescriptionKey: message])
        }
    }

    public static func resolveBaseURL() -> URL? {
        if let env = ProcessInfo.processInfo.environment["API_BASE_URL"], let url = URL(string: env), !env.isEmpty {
            return url
        }
        if let plistValue = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String,
           let url = URL(string: plistValue) {
            return url
        }
        return nil
    }
}
