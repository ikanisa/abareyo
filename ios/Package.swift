// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "RayonNative",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "RayonNative",
            targets: ["RayonNative"]
        )
    ],
    targets: [
        .target(name: "RayonNative"),
        .testTarget(
            name: "RayonNativeTests",
            dependencies: ["RayonNative"]
        )
    ]
)
