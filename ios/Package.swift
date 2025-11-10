// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "GikundiroMobileAuth",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(name: "AuthModule", targets: ["AuthModule"]),
    ],
    targets: [
        .target(
            name: "AuthModule",
            path: "Auth"
        ),
        .testTarget(
            name: "AuthModuleTests",
            dependencies: ["AuthModule"],
            path: "AuthTests"
        ),
    ]
)
