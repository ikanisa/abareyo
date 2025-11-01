'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface MobileMoneyPayment {
  id: string;
  amount: number;
  currency: string;
  ref: string | null;
  status: 'pending' | 'allocated' | 'failed' | 'manual';
  allocated_to: string | null;
  allocated_id: string | null;
  allocated_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface PaymentHistoryData {
  payments: MobileMoneyPayment[];
  counts: {
    total: number;
    pending: number;
    allocated: number;
    failed: number;
    manual: number;
  };
}

export function MobileMoneyPaymentHistory() {
  const [data, setData] = useState<PaymentHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments/mobile-money');
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'allocated':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'manual':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      allocated: 'default',
      pending: 'secondary',
      failed: 'destructive',
      manual: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getAllocatedToLabel = (allocatedTo: string | null) => {
    if (!allocatedTo) return 'Unallocated';
    
    const labels: Record<string, string> = {
      ticket_order: 'Ticket Order',
      shop_order: 'Shop Order',
      insurance_quote: 'Insurance Policy',
      sacco_deposit: 'SACCO Deposit',
    };

    return labels[allocatedTo] || allocatedTo;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mobile Money Payments</CardTitle>
          <CardDescription>Loading payment history...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data || data.payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mobile Money Payments</CardTitle>
          <CardDescription>No payments found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your mobile money payment history will appear here once payments are detected.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mobile Money Payments</CardTitle>
            <CardDescription>
              {data.counts.total} total payments • {data.counts.pending} pending
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {data.payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">{getStatusIcon(payment.status)}</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {payment.amount.toLocaleString()} {payment.currency}
                  </span>
                  {getStatusBadge(payment.status)}
                </div>
                
                {payment.ref && (
                  <p className="text-sm text-muted-foreground">
                    Ref: {payment.ref}
                  </p>
                )}
                
                {payment.allocated_to && (
                  <p className="text-sm text-muted-foreground">
                    → {getAllocatedToLabel(payment.allocated_to)}
                  </p>
                )}
                
                {payment.error_message && (
                  <p className="text-sm text-red-600">
                    Error: {payment.error_message}
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(payment.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
