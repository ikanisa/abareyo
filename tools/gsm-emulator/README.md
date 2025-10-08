# GSM Emulator Helper

This folder provides a lightweight helper script for local development before the physical GSM modem is available.

## Usage
1. Start the Nest backend locally (see `backend/README.md`).
2. Export the SMS webhook token so the emulator can authenticate:
   ```bash
   export SMS_WEBHOOK_TOKEN=dev-token
   ```
3. Run the script with Node 20+ (fetch API required):
   ```bash
   node send-sms.js "Payment received of 5,000 RWF for order RS-123" --from=0788000000
   ```

The script performs an HTTP POST to `http://localhost:5000/api/sms/webhook` with the supplied text, mimicking the payload produced by the modem forwarder.

## Flags
- `--from` sets the originating MSISDN (defaults to `UNKNOWN`).
- `--received-at` allows forcing a timestamp (ISO8601).
- `--token` overrides the `SMS_WEBHOOK_TOKEN` environment variable.

This emulator is a stop-gap for pipeline testing; once the physical modem is online, swap over to the daemon described in `docs/architecture/gsm-modem-runbook.md`.
