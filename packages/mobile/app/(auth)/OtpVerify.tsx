import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, HelperText, Surface, Text, TextInput } from 'react-native-paper';
import { requestOtp, verifyOtp } from '@/api/auth';
import {
  ResendController,
  RESEND_INTERVAL_SECONDS,
  createCountdown,
  isValidOtp,
  normaliseOtp,
} from '@/otp-utils';
import type { CountdownHandle } from '@/otp-utils';
import { useAuth } from '@/providers/AuthProvider';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    padding: 24,
    borderRadius: 16,
  },
  spacer: {
    height: 24,
  },
});

export default function OtpVerifyScreen() {
  const router = useRouter();
  const { token, setToken, logout } = useAuth();
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(RESEND_INTERVAL_SECONDS);
  const countdownHandle = useRef<CountdownHandle | null>(null);
  const resendControllerRef = useRef(new ResendController(RESEND_INTERVAL_SECONDS));

  const startCountdown = useCallback(() => {
    countdownHandle.current?.stop();
    countdownHandle.current = createCountdown(RESEND_INTERVAL_SECONDS, setRemaining);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => countdownHandle.current?.stop();
  }, [startCountdown]);

  const handleVerify = async () => {
    const normalised = normaliseOtp(otp);
    if (!phone) {
      setError('Missing phone number context');
      return;
    }

    if (!isValidOtp(normalised)) {
      setError('Enter the 6-digit code from WhatsApp');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await verifyOtp(String(phone), normalised);
      await setToken(response.token);
      setStatus('All set! You can continue onboarding.');
      router.replace('/');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    const controller = resendControllerRef.current;
    if (!phone) {
      setError('Missing phone number context');
      return;
    }
    if (!controller.canSend()) {
      setError(`Please wait ${controller.secondsUntilNext()}s before requesting a new code.`);
      return;
    }

    try {
      await requestOtp(String(phone));
      controller.registerSend();
      startCountdown();
      setError(null);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : 'Unable to resend');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Surface elevation={2} style={styles.card}>
        <Text variant="headlineMedium">Enter the code</Text>
        <View style={styles.spacer} />
        <TextInput
          label="One-time password"
          value={otp}
          onChangeText={(value) => setOtp(normaliseOtp(value))}
          keyboardType="number-pad"
          maxLength={6}
          left={<TextInput.Affix text="🔐" />}
        />
        {error && <HelperText type="error">{error}</HelperText>}
        {status && <HelperText type="info">{status}</HelperText>}
        {token && (
          <HelperText type="info">You're already authenticated. Use logout to switch accounts.</HelperText>
        )}
        <Button
          mode="contained"
          style={{ marginTop: 16 }}
          onPress={handleVerify}
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          Verify
        </Button>
        <Button
          style={{ marginTop: 8 }}
          mode="text"
          onPress={handleResend}
          disabled={remaining > 0}
        >
          {remaining > 0 ? `Resend available in ${remaining}s` : 'Resend code'}
        </Button>
        <Button mode="text" onPress={logout} style={{ marginTop: 8 }}>
          Log out
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}
