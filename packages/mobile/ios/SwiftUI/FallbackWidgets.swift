import SwiftUI
import Combine

private func buildWhatsappUrl(number: String, message: String) -> URL? {
    let digits = number.filter { $0.isNumber }
    let encoded = message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? message
    return URL(string: "https://wa.me/\(digits)?text=\(encoded)")
}

struct UssdFallbackWidget: View {
    var amount: Int
    var phone: String?
    var provider: String = "mtn"
    var escalationNumber: String = "250788000000"
    var supportNumber: String = "250788000000"

    private var telUri: URL? {
        let digits = phone ?? (provider == "airtel" ? "073xxxxxxx" : "078xxxxxxx")
        let prefix = provider == "airtel" ? "*500*1*" : "*182*1*1*"
        let payload = "tel:\(prefix)\(digits)*\(amount)%23"
        return URL(string: payload)
    }

    private var readableCode: String {
        guard let telUri else { return "" }
        return telUri.absoluteString.replacingOccurrences(of: "tel:", with: "").replacingOccurrences(of: "%23", with: "#")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("USSD fallback ready").font(.headline).foregroundColor(.white)
            Text("Redis outages or template rejections shouldn't block onboarding—share the shortcode and follow manual session provisioning.")
                .foregroundColor(.white.opacity(0.85))
            VStack(alignment: .leading, spacing: 4) {
                Text("Dial code").font(.caption).foregroundColor(.white.opacity(0.6))
                Text(readableCode).font(.title2).bold().foregroundColor(.white)
            }
            .padding()
            .background(Color.white.opacity(0.08))
            .cornerRadius(16)
            if let url = telUri {
                Button("Dial now") { UIApplication.shared.open(url) }
                    .buttonStyle(.borderedProminent)
            }
            HStack {
                if let supportUrl = buildWhatsappUrl(number: supportNumber, message: "USSD fallback for \(readableCode)") {
                    Button("Share via WhatsApp") { UIApplication.shared.open(supportUrl) }
                        .buttonStyle(.bordered)
                }
                if let escalationUrl = buildWhatsappUrl(number: escalationNumber, message: "Escalate OTP fallback") {
                    Button("Escalate") { UIApplication.shared.open(escalationUrl) }
                        .buttonStyle(.bordered)
                }
            }
        }
        .padding()
        .background(Color(red: 17/255, green: 24/255, blue: 39/255))
        .cornerRadius(24)
    }
}

struct PaymentReminderWidgetView: View {
    var amount: Int
    var reference: String?
    var supportNumber: String = "250788000000"
    var deeplink: URL? = URL(string: "rayon://payments/history")

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Payment-first reminder").font(.headline).foregroundColor(.white)
            Text("Customers must receive MTN/Airtel confirmation via SMS or WhatsApp before UI updates are marked complete.")
                .foregroundColor(.white.opacity(0.85))
            Text("Amount: RWF \(amount)").bold().foregroundColor(Color.green)
            if let reference {
                Text("Reference: \(reference)").foregroundColor(Color.green)
            }
            if let deeplink {
                Button("Open payment history") { UIApplication.shared.open(deeplink) }
                    .buttonStyle(.borderedProminent)
            }
            if let url = buildWhatsappUrl(number: supportNumber, message: "Payment confirmation for RWF \(amount)") {
                Button("Send WhatsApp receipt") { UIApplication.shared.open(url) }
                    .buttonStyle(.bordered)
            }
        }
        .padding()
        .background(Color(red: 15/255, green: 23/255, blue: 42/255))
        .cornerRadius(24)
    }
}

struct WhatsAppSessionHelperWidget: View {
    var phone: String
    var baseUrl: String
    var supportNumber: String = "250788000000"
    var escalationNumber: String = "250788000000"
    var manualSessionUrl: URL? = URL(string: "https://github.com/rayonhq/abareyo/blob/main/docs/runbooks/otp-fallbacks.md#2-manual-session-provisioning")

    @State private var lastStatus: String = "loading"
    @State private var lastSent: String = "-"
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("WhatsApp session helper").font(.headline).foregroundColor(.white)
            Text("Last status: \(lastStatus)").foregroundColor(.white)
            Text("Last sent: \(lastSent)").foregroundColor(.white)
            if let errorMessage {
                Text(errorMessage).foregroundColor(.red)
            }
            Button("Resend WhatsApp OTP") {
                if let url = URL(string: "\(baseUrl)/otp/whatsapp/resend?phone=\(phone)") {
                    UIApplication.shared.open(url)
                }
            }
            .buttonStyle(.borderedProminent)
            HStack {
                if let chatUrl = buildWhatsappUrl(number: supportNumber, message: "Checking OTP delivery for \(phone)") {
                    Button("Open chat") { UIApplication.shared.open(chatUrl) }
                        .buttonStyle(.bordered)
                }
                if let escalationUrl = buildWhatsappUrl(number: escalationNumber, message: "Escalate WhatsApp OTP") {
                    Button("Escalate") { UIApplication.shared.open(escalationUrl) }
                        .buttonStyle(.bordered)
                }
            }
            if let manualSessionUrl {
                Button("Manual session instructions") { UIApplication.shared.open(manualSessionUrl) }
                    .buttonStyle(.plain)
                    .foregroundColor(Color.cyan)
            }
        }
        .padding()
        .background(Color(red: 17/255, green: 24/255, blue: 39/255))
        .cornerRadius(24)
        .onAppear(perform: loadStatus)
    }

    private func loadStatus() {
        guard let url = URL(string: "\(baseUrl)/otp/status") else { return }
        URLSession.shared.dataTask(with: url) { data, _, error in
            guard let data else {
                DispatchQueue.main.async { self.errorMessage = error?.localizedDescription }
                return
            }
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let whatsapp = json["whatsapp"] as? [String: Any] {
                DispatchQueue.main.async {
                    self.lastStatus = whatsapp["lastDeliveryStatus"] as? String ?? "unknown"
                    self.lastSent = whatsapp["lastSentAt"] as? String ?? "-"
                    self.errorMessage = whatsapp["lastError"] as? String
                }
            }
        }.resume()
    }
}
