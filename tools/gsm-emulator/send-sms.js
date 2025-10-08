#!/usr/bin/env node

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node send-sms.js "<message>" [--from=0788...] [--received-at=ISO8601] [--token=secret] [--url=http://localhost:5000]');
  process.exit(1);
}

const payloadText = args[0];
const options = Object.fromEntries(
  args.slice(1).map((pair) => {
    const [key, value] = pair.replace(/^--/, '').split('=');
    return [key, value ?? ''];
  }),
);

const baseUrl = options.url ?? process.env.BACKEND_BASE_URL ?? 'http://localhost:5000';
const token = options.token ?? process.env.SMS_WEBHOOK_TOKEN;

if (!token) {
  console.error('Missing SMS webhook token. Pass --token= or export SMS_WEBHOOK_TOKEN.');
  process.exit(1);
}

const body = {
  text: payloadText,
  from: options.from ?? 'UNKNOWN',
  to: options.to ?? 'RayonGateway',
  receivedAt: options['received-at'],
};

const target = `${baseUrl.replace(/\/$/, '')}/api/sms/webhook`;

async function main() {
  const response = await fetch(target, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      'x-modem-id': options.modem ?? 'emulator',
      'x-sim-slot': options.slot ?? 'sim1',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Webhook failed [${response.status}]: ${text}`);
    process.exit(1);
  }

  const json = await response.json();
  console.log('Webhook accepted:', json);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
