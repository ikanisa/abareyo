import { Injectable } from '@nestjs/common';
import client, { Counter, Gauge, Histogram, Registry } from 'prom-client';

type HttpLabels = { method: string; route: string; statusCode: number };

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  private readonly httpCounter: Counter<HttpLabels>;
  private readonly httpDuration: Histogram<HttpLabels>;
  private readonly smsQueueDepth: Gauge<{ queue: string }>;
  private readonly gateScans: Counter<{ gate: string; outcome: 'verified' | 'rejected' }>;

  constructor() {
    this.registry = new client.Registry();
    client.collectDefaultMetrics({ register: this.registry });

    this.httpCounter = new client.Counter({
      name: 'rayon_http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'statusCode'] as const,
      registers: [this.registry],
    });

    this.httpDuration = new client.Histogram({
      name: 'rayon_http_request_duration_seconds',
      help: 'HTTP request duration seconds',
      labelNames: ['method', 'route', 'statusCode'] as const,
      buckets: [0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1, 2, 5],
      registers: [this.registry],
    });

    this.smsQueueDepth = new client.Gauge({
      name: 'rayon_sms_queue_depth',
      help: 'Depth of SMS processing queues',
      labelNames: ['queue'] as const,
      registers: [this.registry],
    });

    this.gateScans = new client.Counter({
      name: 'rayon_gate_scans_total',
      help: 'Gate scan outcomes',
      labelNames: ['gate', 'outcome'] as const,
      registers: [this.registry],
    });
  }

  observeHttpRequest(labels: HttpLabels, durationMs: number) {
    const { method, route, statusCode } = labels;
    this.httpCounter.inc({ method, route, statusCode });
    this.httpDuration.observe({ method, route, statusCode }, durationMs / 1000);
  }

  setSmsQueueDepth(queue: string, depth: number) {
    this.smsQueueDepth.set({ queue }, depth);
  }

  recordGateScan(params: { gate: string; outcome: 'verified' | 'rejected' }) {
    this.gateScans.inc({ gate: params.gate, outcome: params.outcome });
  }

  async getMetrics() {
    return await this.registry.metrics();
  }
}

