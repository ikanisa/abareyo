import { Injectable, Logger } from '@nestjs/common';
import type { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

  registerServer(server: Server) {
    this.server = server;
    this.logger.log('Realtime gateway attached');
  }

  emit<T = unknown>(event: string, payload: T) {
    if (!this.server) {
      this.logger.debug(`Dropping realtime event '${event}' – gateway not ready`);
      return;
    }

    this.server.emit(event, payload);
  }

  notifyTicketOrderConfirmed(payload: {
    orderId: string;
    paymentId: string;
    passes: { passId: string; zone?: string | null }[];
  }) {
    this.emit('tickets.order.confirmed', payload);
  }

  notifyGateScan(payload: {
    passId: string;
    result: 'verified' | 'used' | 'refunded';
    gate?: string | null;
    stewardId?: string | null;
  }) {
    this.emit('tickets.gate.scan', payload);
  }

  notifyGateMetrics(payload: { matchId: string; gate: string; total: number; rejected: number }) {
    this.emit('tickets.gate.metrics', payload);
  }

  notifyMatchUpdated(payload: { matchId: string; status: string }) {
    this.emit('match.updated', payload);
  }

  notifyMembershipActivated(payload: { membershipId: string; validUntil: string }) {
    this.emit('membership.activated', payload);
  }

  notifyShopOrderConfirmed(payload: { orderId: string; paymentId: string }) {
    this.emit('shop.order.confirmed', payload);
  }

  notifyDonationConfirmed(payload: { donationId: string; paymentId: string }) {
    this.emit('fundraising.donation.confirmed', payload);
  }

  notifyPaymentForManualReview(payload: { smsParsedId: string; amount: number }) {
    this.emit('payments.manual_review', payload);
  }

  notifySmsReceived(payload: { smsId: string; from: string; receivedAt: string }) {
    this.emit('sms.received', payload);
  }

  notifySmsParsed(payload: { smsId: string; parsedId: string; amount: number; confidence: number }) {
    this.emit('sms.parsed', payload);
  }
}
