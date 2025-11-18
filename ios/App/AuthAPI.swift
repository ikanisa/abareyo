import Foundation

struct OtpRequestPayload: Codable {
    let phoneNumber: String
}

struct OtpVerifyPayload: Codable {
    let phoneNumber: String
    let code: String
}

struct OtpVerifyResponse: Codable {
    let token: String
}

final class AuthAPI {
    private let baseURL: URL
    private let session: URLSession

    init(baseURL: URL = URL(string: ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "https://example.com")!, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    func requestOtp(phoneNumber: String) async throws {
        var request = URLRequest(url: baseURL.appending(path: "/api/mobile/whatsapp/request"))
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(OtpRequestPayload(phoneNumber: phoneNumber))
        let (_, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
    }

    func verifyOtp(phoneNumber: String, code: String) async throws -> String {
        var request = URLRequest(url: baseURL.appending(path: "/api/mobile/whatsapp/verify"))
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(OtpVerifyPayload(phoneNumber: phoneNumber, code: code))
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        let payload = try JSONDecoder().decode(OtpVerifyResponse.self, from: data)
        return payload.token
    }
}
