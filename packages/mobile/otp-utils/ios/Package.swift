// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "OTPUtils",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(name: "OTPUtils", targets: ["OTPUtils"])
    ],
    targets: [
        .target(name: "OTPUtils", path: "Sources")
    ]
)
