# GSM Modem Provisioning & Integration Runbook

## Objective
Stand up a resilient GSM modem gateway that receives Mobile Money confirmation SMS and forwards them to the backend `/sms/webhook` secured endpoint within 5 seconds of receipt.

## Hardware Baseline
- **Primary modem**: Huawei E3372h (USB) or Quectel EC25 (USB/LTE) with MTN + Airtel SIM slots (dual USB hub).
- **Host**: Intel NUC / Raspberry Pi 4 (4GB) running Ubuntu Server 22.04 LTS.
- **Backup modem**: Identical model kept onsite, pre-provisioned.
- **SIM rotation**: Dedicated MTN + Airtel business SIMs with SMS bundles; disable PIN lock prior to installation.

## Network & Security
- Place modem host on VLAN with outbound HTTPS (443) allowed to backend ingress + OpenAI (for optional validation) and inbound SSH from VPN.
- Enforce unattended-upgrades, UFW firewall (`allow 22/tcp`, `allow 443/tcp` if using HTTPS relay, block all else).
- Configure system time sync (chrony) to ensure accurate SMS timestamps.

## Software Stack
1. **OS packages**
   ```bash
   sudo apt update && sudo apt install build-essential git python3-pip gammu gammu-smsd redis-server
   ```
2. **Modem detection**
   ```bash
   lsusb
   sudo gammu --identify
   ```
3. **Daemon choice**: `gammu-smsd` with spool directory feeding a Node.js forwarder. We prefer gammu for battle-tested stability and multi-SIM handling.

## Directory Layout
```
/opt/gsm-gateway/
  .env
  gammu-smsdrc
  sms-forwarder.service
  src/
    forwarder.js
    queue.js
    healthcheck.js
  spool/
```

## Configuration
### `/opt/gsm-gateway/gammu-smsdrc`
```
[gammu]
port = /dev/ttyUSB0
connection = at115200
synchronizetime = yes

[smsd]
Service = files
LogFile = /var/log/gammu-smsd.log
LogFormat = textalldate
RunOnReceive = /opt/gsm-gateway/src/forwarder.js
NumberingPlan = unknown
UseDeliveryReports = yes
CheckSecurity = 1
```

### Node.js forwarder (`src/forwarder.js`)
Pseudo-code responsibilities:
1. Read inbound message payload from `stdin` (gammu JSON env vars).
2. Persist raw SMS to local spool (`spool/raw-<uuid>.json`).
3. POST to backend endpoint `POST {BACKEND_BASE_URL}/sms/webhook` with headers:
   - `Authorization: Bearer ${SMS_WEBHOOK_TOKEN}`
   - `x-sim-slot`, `x-modem-id`.
4. Retry with exponential backoff (1s, 5s, 15s, 60s) up to 10 attempts.
5. On success, move file to `spool/sent/`; on exhaustion move to `spool/error/` and raise alert.

### Systemd service (`sms-forwarder.service`)
```
[Unit]
Description=Rayon GSM SMS Forwarder
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/gsm-gateway/src/forwarder.js
Restart=always
User=gsm
EnvironmentFile=/opt/gsm-gateway/.env

[Install]
WantedBy=multi-user.target
```

## Health & Monitoring
- Expose local `/healthz` endpoint (forwarder) returning modem status via `gammu --getsmsstatus` every 30s.
- Push metrics to Prometheus (through node exporter) or send heartbeats to UptimeRobot.
- Alert on:
  - No SMS received in previous 30 minutes during active periods.
  - Repeated POST failures >3 in 5 minutes.
  - SIM storage >70% (gammu `--getsmsc`), trigger purge job.
- Low-confidence parses (below `SMS_PARSE_CONFIDENCE_THRESHOLD`) surface in `/admin/sms` for manual confirmation; operations should clear the queue before matchday gates open.

## Testing Procedure
1. Dial sample USSD from MTN handset paying small amount.
2. Confirm SMS arrives in `/var/log/gammu-smsd.log` within 5s.
3. Verify backend receives webhook (check Nest logs or `GET /admin/sms/raw` endpoint).
4. Run `npm run test:sms-pipeline` (backend integration test) to simulate parser success + pass issuance.

## Failover Plan
- Secondary modem connected to same host (`/dev/ttyUSB2`); run dual instances with dedicated configs.
- If host fails, swap USB modem to backup host pre-configured via Ansible.
- Manual attach UI in admin console allows processing payments while modem offline.

## Maintenance Tasks
- Rotate logs weekly (`logrotate` config for `/var/log/gammu-smsd.log`).
- Apply OS security updates monthly (cron `unattended-upgrades`).
- Refresh SIM bundles and validate connectivity before high-demand events.
- Quarterly validation of OpenAI parser version with fresh corpus.

## Timeline
- **Week 5** (USSD & SMS pipeline phase): procure hardware, install base OS, configure gammu + forwarder.
- **Week 6**: integrate modem gateway with staging backend; run end-to-end payment rehearsal.
- **Week 10**: deploy redundant unit and document failover rehearsal.
