# SMS Payment Processing - Quick Start Guide

This guide will help you get the SMS mobile money payment processing feature up and running.

## Prerequisites

1. **Android Device or Emulator** (API level 19+)
2. **OpenAI API Key** with access to GPT-4o
3. **Supabase Project** with service role key
4. **Node.js 20.x** and npm installed

## 1. Environment Setup

Create or update your `.env.local` file with the required variables:

```bash
# Required for SMS processing
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Already in .env.example
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/api
```

## 2. Database Migration

Apply the SMS payment schema migration:

```bash
# For local development
supabase start
supabase migration up --local

# For production
supabase migration up --remote
```

Verify tables were created:
```bash
supabase db ls
```

You should see:
- `sms_raw`
- `sms_parsed`
- `mobile_money_payments`

## 3. Install Dependencies

```bash
npm ci
```

## 4. Build the Application

```bash
# Build Next.js app
npm run build

# Sync with Capacitor (creates Android project)
npx cap sync
```

## 5. Android Setup

### Option A: Android Studio (Recommended)

1. Open Android Studio
2. Open the `android` folder from the project
3. Wait for Gradle sync to complete
4. Connect Android device or start emulator
5. Click Run button or press Shift+F10

### Option B: Command Line

```bash
# Open Android Studio with project
npm run cap:android
```

Or build APK manually:
```bash
cd android
./gradlew assembleDebug
```

## 6. Testing the Feature

### Step 1: Launch the App

1. Open the app on your Android device/emulator
2. Sign in with a test user account

### Step 2: Enable SMS Permissions

1. Navigate to the **Payments** page (add to navigation if needed)
2. Go to the **SMS Settings** tab
3. Click **"Grant SMS Permission"**
4. Accept the permission in the Android dialog

### Step 3: Test with Sample SMS

#### Method A: Using ADB (Emulator/Rooted Device)

```bash
# Send test SMS via ADB
adb emu sms send +250788000000 "MTN Mobile Money: You have received 5000 RWF from ***789. Transaction Ref: MP123456789. Date: 15 Nov 2025 14:30"
```

#### Method B: Using Physical Device

1. Have someone send you a real mobile money payment
2. Or forward a previous mobile money SMS to your device

### Step 4: Verify Processing

1. The app should detect the SMS automatically (if listening is enabled)
2. Or manually trigger processing:
   - Go to **Payment History** tab
   - Pull to refresh
3. Check that the payment appears in the list
4. Verify status shows "pending" or "allocated"

### Step 5: Check Database

```bash
# Query sms_raw
supabase db query "SELECT * FROM sms_raw ORDER BY created_at DESC LIMIT 5;"

# Query sms_parsed
supabase db query "SELECT * FROM sms_parsed ORDER BY created_at DESC LIMIT 5;"

# Query mobile_money_payments
supabase db query "SELECT * FROM mobile_money_payments ORDER BY created_at DESC LIMIT 5;"
```

## 7. Troubleshooting

### Permission Denied

**Problem**: User denies SMS permission

**Solution**:
1. Go to device Settings > Apps > Rayon Sports
2. Enable SMS permission manually
3. Return to app and click "Recheck Permission"

### SMS Not Detected

**Problem**: SMS exists but not showing in app

**Solutions**:
1. Verify SMS permission is granted
2. Check SMS is in device inbox (not drafts/sent)
3. Check sender matches mobile money provider
4. Try manual refresh in Payment History

### OpenAI Parsing Fails

**Problem**: SMS saved but not parsed

**Solutions**:
1. Check OpenAI API key is valid: `echo $OPENAI_API_KEY`
2. Verify API has credits/quota remaining
3. Check Supabase function logs:
   ```bash
   supabase functions logs parse-sms
   ```
4. Review SMS format matches expected pattern

### Payment Not Allocated

**Problem**: Payment parsed but status is "pending"

**Solutions**:
1. Create a test ticket order with matching amount:
   ```typescript
   // In ticket order page
   const order = {
     total: 5000, // Must match SMS amount exactly
     status: 'pending'
   };
   ```
2. Ensure order was created within 3-day window
3. Check Supabase function logs:
   ```bash
   supabase functions logs match-payment
   ```

### Build Errors

**Problem**: Android build fails

**Solutions**:
1. Clean Gradle cache:
   ```bash
   cd android
   ./gradlew clean
   ```
2. Sync Capacitor again:
   ```bash
   npx cap sync
   ```
3. Check Android SDK is installed (API 33+)

## 8. Manual Testing Checklist

- [ ] SMS permission request works
- [ ] Permission status displayed correctly
- [ ] Can read SMS messages from inbox
- [ ] SMS processing API accepts messages
- [ ] OpenAI parsing extracts correct data
- [ ] Payment record created in database
- [ ] Payment matches to pending order
- [ ] Order status updates to "paid"
- [ ] Payment history displays correctly
- [ ] Status badges show proper colors
- [ ] Manual payment entry works
- [ ] Filtering by status works
- [ ] Refresh updates payment list

## 9. Production Deployment

Before deploying to production:

1. **Test thoroughly** with real mobile money SMS
2. **Verify OpenAI costs** and set up billing alerts
3. **Enable SMS webhook** for external SMS forwarding (optional)
4. **Monitor Supabase logs** for errors
5. **Set up alerting** for failed payments
6. **Document support process** for users

### Production Environment Variables

```bash
# Production
OPENAI_API_KEY=sk-proj-production-key
SUPABASE_SERVICE_ROLE_KEY=production-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
NEXT_PUBLIC_SITE_URL=https://app.rayonsports.com
```

## 10. Monitoring

### Key Metrics to Track

1. **SMS Processing Rate**
   ```sql
   SELECT 
     COUNT(*) as total,
     COUNT(*) FILTER (WHERE processed) as processed,
     COUNT(*) FILTER (WHERE NOT processed) as pending
   FROM sms_raw
   WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

2. **Payment Allocation Success Rate**
   ```sql
   SELECT 
     status,
     COUNT(*) as count,
     ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
   FROM mobile_money_payments
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY status;
   ```

3. **OpenAI Parse Confidence**
   ```sql
   SELECT 
     AVG(confidence) as avg_confidence,
     MIN(confidence) as min_confidence,
     MAX(confidence) as max_confidence
   FROM sms_parsed
   WHERE created_at > NOW() - INTERVAL '7 days';
   ```

## 11. Common SMS Formats

The system is trained to parse these formats:

### MTN Mobile Money (Rwanda)
```
MTN Mobile Money: You have received 5000 RWF from ***789.
Transaction Ref: MP123456789
Date: 15 Nov 2025 14:30
```

### Airtel Money (Rwanda)
```
Airtel Money: You have received 5000 RWF
Sender: ***456
Ref: AM987654321
```

### Bank SMS
```
Your account has been credited with RWF 5,000
From: SAVINGS ACCOUNT
Ref: TXN123456
```

## 12. Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase function logs
3. Check OpenAI API status
4. Review the full documentation: `docs/SMS_PAYMENT_PROCESSING.md`
5. Open an issue on GitHub with:
   - Error message
   - SMS format (redacted)
   - Logs from Supabase
   - Steps to reproduce

## Resources

- [Full Documentation](./SMS_PAYMENT_PROCESSING.md)
- [Capacitor Android Docs](https://capacitorjs.com/docs/android)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
