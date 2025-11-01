-- SMS Payment Processing Schema
-- This migration creates tables for storing SMS messages, parsed payment data,
-- and mobile money payment tracking for automatic payment allocation.

set search_path = public;

-- === SMS STORAGE TABLES ===

-- Raw SMS messages received from mobile devices
CREATE TABLE IF NOT EXISTS sms_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text, -- sender phone number
  text text NOT NULL, -- raw SMS content
  received_at timestamptz NOT NULL DEFAULT NOW(),
  processed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sms_raw_user_id ON sms_raw(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_raw_received_at ON sms_raw(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_raw_processed ON sms_raw(processed) WHERE NOT processed;

COMMENT ON TABLE sms_raw IS 'Stores raw SMS messages received from mobile devices for mobile money payments';
COMMENT ON COLUMN sms_raw.phone_number IS 'Sender phone number (e.g., mobile money provider)';
COMMENT ON COLUMN sms_raw.processed IS 'Whether the SMS has been processed by the parser';

-- Parsed SMS payment data extracted via OpenAI
CREATE TABLE IF NOT EXISTS sms_parsed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sms_id uuid NOT NULL REFERENCES sms_raw(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- Amount in RWF
  currency text NOT NULL DEFAULT 'RWF',
  payer_mask text, -- Masked phone number of payer
  ref text, -- Transaction reference from SMS
  timestamp timestamptz, -- Transaction timestamp from SMS (if available)
  confidence numeric(3,2) CHECK (confidence >= 0 AND confidence <= 1), -- OpenAI parse confidence 0-1
  created_at timestamptz NOT NULL DEFAULT NOW(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sms_parsed_sms_id ON sms_parsed(sms_id);
CREATE INDEX IF NOT EXISTS idx_sms_parsed_ref ON sms_parsed(ref);
CREATE INDEX IF NOT EXISTS idx_sms_parsed_amount ON sms_parsed(amount);

COMMENT ON TABLE sms_parsed IS 'Structured payment data extracted from SMS using OpenAI';
COMMENT ON COLUMN sms_parsed.confidence IS 'AI confidence score for the parse result (0.0 to 1.0)';

-- === MOBILE MONEY PAYMENT TRACKING ===

-- Mobile money payments with allocation status
CREATE TABLE IF NOT EXISTS mobile_money_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sms_parsed_id uuid REFERENCES sms_parsed(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'RWF',
  ref text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'allocated', 'failed', 'manual')),
  
  -- Allocation details
  allocated_to text, -- Type: 'ticket_order', 'shop_order', 'insurance_quote', 'sacco_deposit', etc.
  allocated_id uuid, -- ID of the allocated record
  allocated_at timestamptz,
  
  -- Metadata
  error_message text,
  manual_approval boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id),
  
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_momo_payments_user_id ON mobile_money_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_momo_payments_status ON mobile_money_payments(status);
CREATE INDEX IF NOT EXISTS idx_momo_payments_ref ON mobile_money_payments(ref);
CREATE INDEX IF NOT EXISTS idx_momo_payments_sms_parsed_id ON mobile_money_payments(sms_parsed_id);
CREATE INDEX IF NOT EXISTS idx_momo_payments_allocated_to ON mobile_money_payments(allocated_to);

COMMENT ON TABLE mobile_money_payments IS 'Tracks mobile money payments and their allocation to orders/deposits';
COMMENT ON COLUMN mobile_money_payments.status IS 'Payment status: pending (awaiting allocation), allocated (matched to order), failed (allocation error), manual (requires manual intervention)';
COMMENT ON COLUMN mobile_money_payments.allocated_to IS 'Type of record the payment was allocated to';
COMMENT ON COLUMN mobile_money_payments.allocated_id IS 'UUID of the allocated record (order, deposit, etc.)';

-- === RLS POLICIES ===

-- Enable RLS
ALTER TABLE sms_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_parsed ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_money_payments ENABLE ROW LEVEL SECURITY;

-- sms_raw policies
CREATE POLICY "Users can insert their own SMS" 
  ON sms_raw FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own SMS" 
  ON sms_raw FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can view all SMS" 
  ON sms_raw FOR SELECT 
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can update SMS" 
  ON sms_raw FOR UPDATE 
  USING (auth.jwt()->>'role' = 'service_role');

-- sms_parsed policies
CREATE POLICY "Users can view parsed SMS for their messages" 
  ON sms_parsed FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM sms_raw 
      WHERE sms_raw.id = sms_parsed.sms_id 
      AND sms_raw.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage parsed SMS" 
  ON sms_parsed FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- mobile_money_payments policies
CREATE POLICY "Users can view their own payments" 
  ON mobile_money_payments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all payments" 
  ON mobile_money_payments FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- === TRIGGERS ===

-- Update timestamp trigger for mobile_money_payments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mobile_money_payments_updated_at
  BEFORE UPDATE ON mobile_money_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- === FUNCTIONS ===

-- Function to get user's pending payments
CREATE OR REPLACE FUNCTION get_user_pending_payments(p_user_id uuid)
RETURNS TABLE (
  payment_id uuid,
  amount integer,
  currency text,
  ref text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    mobile_money_payments.amount,
    mobile_money_payments.currency,
    mobile_money_payments.ref,
    mobile_money_payments.created_at
  FROM mobile_money_payments
  WHERE user_id = p_user_id
    AND status = 'pending'
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_pending_payments IS 'Returns pending mobile money payments for a user';
