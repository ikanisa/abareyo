import Foundation

public struct BuildMetadata: Codable, Equatable {
    public let appVersion: String
    public let buildNumber: Int
    public let commit: String

    public init(appVersion: String, buildNumber: Int, commit: String) {
        self.appVersion = appVersion
        self.buildNumber = buildNumber
        self.commit = commit
    }

    public var formatted: String {
        "\(appVersion) (\(buildNumber)) - \(commit.prefix(7))"
    }
}

public enum NativeFeatureFlag: String, CaseIterable {
    case whatsappBridge
    case nfcPilot

    public static func enabledFlags(from payload: [String: Bool]) -> [NativeFeatureFlag] {
        allCases.filter { payload[$0.rawValue] == true }
    }
}
