import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, HelperText, Surface, Text, TextInput } from 'react-native-paper';
import { requestOtp } from '@/api/auth';
import { normalisePhoneNumber, sanitisePhoneNumber } from '@/otp-utils';
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
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
});

export default function PhoneEntryScreen() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [rawPhone, setRawPhone] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneNumber = useMemo(() => sanitisePhoneNumber(rawPhone), [rawPhone]);
  const canSubmit = phoneNumber.length >= 10 && !isSubmitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const normalised = normalisePhoneNumber(phoneNumber);
      await requestOtp(normalised);
      router.push({ pathname: '/(auth)/OtpVerify', params: { phone: normalised } });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to request OTP');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Surface elevation={2} style={styles.card}>
        <Text variant="headlineMedium">Sign in with WhatsApp</Text>
        <View style={styles.spacer} />
        <TextInput
          label="Phone number"
          value={rawPhone}
          onChangeText={setRawPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          left={<TextInput.Affix text="📱" />}
          disabled={Boolean(token)}
        />
        <HelperText type="info">We'll send a WhatsApp message with a verification code.</HelperText>
        {error && <HelperText type="error">{error}</HelperText>}
        {token && (
          <HelperText type="info">You're already signed in. You can log out below.</HelperText>
        )}
        <Button
          mode="contained"
          style={{ marginTop: 16 }}
          onPress={handleSubmit}
          disabled={!canSubmit || Boolean(token)}
          loading={isSubmitting}
        >
          Send code
        </Button>
        {token && (
          <Button mode="text" onPress={logout} style={{ marginTop: 8 }}>
            Log out
          </Button>
        )}
      </Surface>
      <View style={styles.footer}>
        <Text variant="bodyMedium" accessibilityRole="text">
          WhatsApp messages may incur carrier fees.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
