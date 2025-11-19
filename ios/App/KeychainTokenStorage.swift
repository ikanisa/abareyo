import Foundation
import Security

final class KeychainTokenStorage {
    private let service = "com.rayon.mobile.auth"
    private let account = "jwt"

    func load() -> String? {
        var query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: account,
            kSecReturnData: true as CFBoolean
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess, let data = item as? Data else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }

    func save(token: String) {
        if let data = token.data(using: .utf8) {
            let query: [CFString: Any] = [
                kSecClass: kSecClassGenericPassword,
                kSecAttrService: service,
                kSecAttrAccount: account
            ]
            SecItemDelete(query as CFDictionary)
            var attributes = query
            attributes[kSecValueData] = data
            SecItemAdd(attributes as CFDictionary, nil)
        }
    }

    func clear() {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: account
        ]
        SecItemDelete(query as CFDictionary)
    }
}
