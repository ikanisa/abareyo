import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/sms/process
 * Process SMS message from mobile device, parse payment details, and store in database
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
    const { smsId, phoneNumber, text, receivedAt } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'SMS text is required' },
        { status: 400 }
      );
    }

    // Insert raw SMS into database
    const { data: smsRaw, error: insertError } = await supabase
      .from('sms_raw')
      .insert({
        id: smsId,
        user_id: user.id,
        phone_number: phoneNumber,
        text: text,
        received_at: receivedAt ? new Date(receivedAt).toISOString() : new Date().toISOString(),
        processed: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting SMS:', insertError);
      return NextResponse.json(
        { error: 'Failed to save SMS', details: insertError.message },
        { status: 500 }
      );
    }

    // Call parse-sms edge function to parse the SMS using OpenAI
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json(
        { 
          success: true, 
          smsId: smsRaw.id,
          warning: 'SMS saved but parsing unavailable - missing configuration'
        },
        { status: 200 }
      );
    }

    try {
      const parseResponse = await fetch(
        `${supabaseUrl}/functions/v1/parse-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ sms_id: smsRaw.id }),
        }
      );

      if (!parseResponse.ok) {
        const errorText = await parseResponse.text();
        console.error('Parse SMS function error:', errorText);
        
        return NextResponse.json(
          {
            success: true,
            smsId: smsRaw.id,
            warning: 'SMS saved but parsing failed',
          },
          { status: 200 }
        );
      }

      const parseResult = await parseResponse.json();

      return NextResponse.json(
        {
          success: true,
          smsId: smsRaw.id,
          parsedId: parseResult.sms_parsed_id,
          message: 'SMS processed successfully',
        },
        { status: 200 }
      );
    } catch (parseError) {
      console.error('Error calling parse function:', parseError);
      return NextResponse.json(
        {
          success: true,
          smsId: smsRaw.id,
          warning: 'SMS saved but parsing failed',
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error processing SMS:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sms/process
 * Get processing status and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's SMS processing stats
    const { data: stats, error: statsError } = await supabase
      .from('sms_raw')
      .select('id, processed, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (statsError) {
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    const processed = stats?.filter((s) => s.processed).length || 0;
    const pending = stats?.filter((s) => !s.processed).length || 0;

    return NextResponse.json({
      total: stats?.length || 0,
      processed,
      pending,
      recent: stats,
    });
  } catch (error) {
    console.error('Error fetching SMS stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
