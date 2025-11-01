import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/payments/mobile-money
 * Get user's mobile money payment history with allocation status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Filter by status
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabase
      .from('mobile_money_payments')
      .select(
        `
        id,
        amount,
        currency,
        ref,
        status,
        allocated_to,
        allocated_id,
        allocated_at,
        error_message,
        manual_approval,
        created_at,
        updated_at
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status && ['pending', 'allocated', 'failed', 'manual'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: payments, error: paymentsError } = await query;

    if (paymentsError) {
      console.error('Error fetching mobile money payments:', paymentsError);
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    // Get counts by status
    const { data: statusCounts } = await supabase
      .from('mobile_money_payments')
      .select('status')
      .eq('user_id', user.id);

    const counts = {
      total: statusCounts?.length || 0,
      pending: statusCounts?.filter((p) => p.status === 'pending').length || 0,
      allocated: statusCounts?.filter((p) => p.status === 'allocated').length || 0,
      failed: statusCounts?.filter((p) => p.status === 'failed').length || 0,
      manual: statusCounts?.filter((p) => p.status === 'manual').length || 0,
    };

    return NextResponse.json({
      payments: payments || [],
      counts,
      pagination: {
        limit,
        offset,
        total: counts.total,
      },
    });
  } catch (error) {
    console.error('Error in mobile-money API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/mobile-money
 * Create a manual mobile money payment record (for testing or manual entry)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { amount, ref, currency = 'RWF' } = body;

    if (!amount || !ref) {
      return NextResponse.json(
        { error: 'Amount and reference are required' },
        { status: 400 }
      );
    }

    // Insert payment record
    const { data: payment, error: insertError } = await supabase
      .from('mobile_money_payments')
      .insert({
        user_id: user.id,
        amount: parseInt(amount, 10),
        currency,
        ref,
        status: 'pending',
        manual_approval: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating payment:', insertError);
      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 500 }
      );
    }

    // Try to trigger allocation via match-payment function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/match-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ 
            payment_id: payment.id,
            amount: payment.amount,
            ref: payment.ref
          }),
        });
      } catch (err) {
        console.warn('Match payment function call failed:', err);
      }
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error creating manual payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
