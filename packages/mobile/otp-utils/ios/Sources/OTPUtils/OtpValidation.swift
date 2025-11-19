import Foundation

public let otpLength: Int = 6
public let resendIntervalSeconds: TimeInterval = 30

public func sanitisePhoneNumber(_ raw: String) -> String {
    let allowed = raw.replacingOccurrences(of: "[^0-9+]", with: "", options: .regularExpression)
    let singlePlus = allowed.replacingOccurrences(of: "\\+{2,}", with: "+", options: .regularExpression)
    return singlePlus.replacingOccurrences(of: "(\\+)(?=\\+)", with: "", options: .regularExpression)
}

public func normalisePhoneNumber(_ raw: String) -> String {
    let trimmed = sanitisePhoneNumber(raw).trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmed.hasPrefix("+") {
        return trimmed
    }
    return "+" + trimmed
}

public func normaliseOtp(_ raw: String) -> String {
    let digits = raw.replacingOccurrences(of: "\\D", with: "", options: .regularExpression)
    return String(digits.prefix(otpLength))
}

public func isValidOtp(_ raw: String) -> Bool {
    return normaliseOtp(raw).count == otpLength
}

public final class ResendController {
    private let windowSeconds: TimeInterval
    private var nextAllowedAt: Date = .distantPast

    public init(windowSeconds: TimeInterval = resendIntervalSeconds) {
        self.windowSeconds = windowSeconds
    }

    public func canSend(now: Date = .init()) -> Bool {
        return now >= nextAllowedAt
    }

    public func registerSend(now: Date = .init()) {
        nextAllowedAt = now.addingTimeInterval(windowSeconds)
    }

    public func secondsUntilNext(now: Date = .init()) -> Int {
        guard !canSend(now: now) else { return 0 }
        return Int(ceil(nextAllowedAt.timeIntervalSince(now)))
    }
}
