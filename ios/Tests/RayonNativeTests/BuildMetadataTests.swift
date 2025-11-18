import XCTest
@testable import RayonNative

final class BuildMetadataTests: XCTestCase {
    func testFormattedMetadata() throws {
        let metadata = BuildMetadata(appVersion: "1.2.3", buildNumber: 42, commit: "abcdef123456")
        XCTAssertEqual(metadata.formatted, "1.2.3 (42) - abcdef1")
    }

    func testEnabledFlags() throws {
        let payload: [String: Bool] = [
            "whatsappBridge": true,
            "nfcPilot": false
        ]

        XCTAssertEqual(NativeFeatureFlag.enabledFlags(from: payload), [.whatsappBridge])
    }
}
