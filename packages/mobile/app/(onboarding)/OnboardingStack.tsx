import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Switch, Button, StyleSheet, ActivityIndicator } from "react-native";

import type { OnboardingPreferences } from "./api";
import {
  startWhatsappAuth,
  submitOnboarding,
  verifyWhatsappCode,
} from "./api";
import { getAuthToken, saveAuthToken, setInMemoryToken } from "./authStorage";

type Step = 0 | 1 | 2 | 3;

type VerificationSession = {
  id: string;
  expiresAt?: string;
  resendAt?: string;
};

const languages: { value: OnboardingPreferences["language"]; label: string }[] = [
  { value: "rw", label: "Kinyarwanda" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

const initialState: OnboardingPreferences = {
  whatsappNumber: "",
  momoNumber: "",
  useWhatsappForMomo: true,
  language: "rw",
  publicProfile: true,
  notifications: {
    kickoff: true,
    goals: true,
    final: true,
    club: true,
  },
};

type Props = {
  onCompleted?: (result: { userId: string; userCode?: string }) => void;
};

export function OnboardingStack({ onCompleted }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [prefs, setPrefs] = useState(initialState);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [session, setSession] = useState<VerificationSession | null>(null);
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getAuthToken()
      .then((stored) => {
        if (mounted && stored) {
          setToken(stored);
          setInMemoryToken(stored);
        }
      })
      .catch((error) => {
        console.warn("Failed to bootstrap auth token", error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return undefined;
    }
    const interval = setInterval(() => {
      setResendSeconds((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [resendSeconds]);

  const canResend = resendSeconds <= 0;

  const secondsLabel = useMemo(() => {
    if (canResend) {
      return "You can request a new code.";
    }
    return `Resend available in ${resendSeconds}s`;
  }, [canResend, resendSeconds]);

  const clampToStep = useCallback((value: number): Step => {
    const clamped = Math.max(0, Math.min(3, value));
    return clamped as Step;
  }, []);

  const goBack = () => setStep((current) => clampToStep(current - 1));
  const goNext = () => setStep((current) => clampToStep(current + 1));

  const hydrateSession = (response: VerificationSession, message?: string) => {
    setSession(response);
    setOtp("");
    setOtpMessage(message ?? "We sent a 6-digit code to your WhatsApp chat.");
    setOtpError(null);
    const seconds = secondsUntil(response.resendAt);
    setResendSeconds(seconds === 0 ? 60 : seconds);
  };

  const handleStartVerification = async () => {
    setAuthLoading(true);
    setOtpError(null);
    try {
      const response = await startWhatsappAuth(prefs.whatsappNumber);
      hydrateSession({
        id: response.sessionId,
        expiresAt: response.expiresAt,
        resendAt: response.resendAt,
      });
      setStep(1);
    } catch (error) {
      console.error("Failed to initiate WhatsApp auth", error);
      setOtpError(error instanceof Error ? error.message : "Unable to start verification");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) {
      return;
    }
    await handleStartVerification();
  };

  const handleVerifyCode = async () => {
    if (!session?.id) {
      setOtpError("Start verification first");
      return;
    }
    if (otp.trim().length !== 6) {
      setOtpError("Enter the 6-digit code from WhatsApp");
      return;
    }

    setVerifyLoading(true);
    setOtpError(null);
    try {
      const result = await verifyWhatsappCode(session.id, otp.trim());
      await saveAuthToken(result.token);
      setToken(result.token);
      setInMemoryToken(result.token);
      setSession(null);
      setResendSeconds(0);
      setOtpMessage("You're verified. Continue personalising your experience.");
      setStep(2);
    } catch (error) {
      console.error("Failed to verify code", error);
      setOtpError(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!token) {
      setSubmitError("Verify your WhatsApp number before finishing onboarding.");
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const result = await submitOnboarding(prefs);
      setSubmitSuccess("Preferences synced to Supabase");
      onCompleted?.(result);
    } catch (submitError) {
      console.error("Failed to submit onboarding", submitError);
      setSubmitError(submitError instanceof Error ? submitError.message : "Unknown error");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>Guest friendly setup</Text>
      <Text style={styles.title}>Tailor your Rayon Sports experience</Text>
      <Text style={styles.subtitle}>Four quick steps and you're match ready.</Text>

      {step === 0 ? (
        <ContactStep
          value={prefs}
          onChange={setPrefs}
          onNext={handleStartVerification}
          loading={authLoading}
          error={otpError}
        />
      ) : null}

      {step === 1 ? (
        <OtpStep
          whatsappNumber={prefs.whatsappNumber}
          value={otp}
          onChange={setOtp}
          onVerify={handleVerifyCode}
          onResend={handleResend}
          message={otpMessage}
          error={otpError}
          loading={verifyLoading}
          resendLabel={secondsLabel}
          canResend={canResend}
          onBack={goBack}
        />
      ) : null}

      {step === 2 ? (
        <LanguageStep
          value={prefs}
          onChange={setPrefs}
          onNext={goNext}
          onBack={goBack}
        />
      ) : null}

      {step === 3 ? (
        <NotificationStep
          value={prefs}
          onChange={setPrefs}
          onSubmit={handleSubmit}
          onBack={goBack}
          loading={submitLoading}
          error={submitError}
          success={submitSuccess}
        />
      ) : null}
    </View>
  );
}

type StepProps = {
  value: OnboardingPreferences;
  onChange: (next: OnboardingPreferences) => void;
};

type ContactStepProps = StepProps & {
  onNext: () => void;
  loading: boolean;
  error?: string | null;
};

const ContactStep = ({ value, onChange, onNext, loading, error }: ContactStepProps) => {
  const canContinue =
    value.whatsappNumber.trim().length >= 8 && (value.useWhatsappForMomo || value.momoNumber?.length);

  return (
    <View style={styles.card}>
      <Text style={styles.stepLabel}>Step 1</Text>
      <Text style={styles.cardTitle}>How should we reach you?</Text>
      <Text style={styles.cardSubtitle}>We only use your contact for match alerts and account recovery.</Text>
      <Text style={styles.notice}>
        We use your WhatsApp number for OTP logins and club updates. Uzakira amakuru na OTP kuri WhatsApp kandi ushobora
        guhagarika igihe ushakiye.
      </Text>
      <TextInput
        accessibilityLabel="WhatsApp number"
        placeholder="e.g. +2507XXXXXXX"
        style={styles.input}
        keyboardType="phone-pad"
        value={value.whatsappNumber}
        onChangeText={(text) => onChange({ ...value, whatsappNumber: text })}
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Use WhatsApp number for MoMo</Text>
        <Switch
          value={value.useWhatsappForMomo}
          onValueChange={(next) => onChange({ ...value, useWhatsappForMomo: next })}
        />
      </View>
      {!value.useWhatsappForMomo ? (
        <TextInput
          accessibilityLabel="MoMo number"
          placeholder="078XX"
          style={styles.input}
          keyboardType="phone-pad"
          value={value.momoNumber ?? ""}
          onChangeText={(text) => onChange({ ...value, momoNumber: text })}
        />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actionsRow}>
        <Button title="Send code" onPress={onNext} disabled={!canContinue || loading} />
        {loading ? <ActivityIndicator color="#0ea5e9" /> : null}
      </View>
    </View>
  );
};

type OtpStepProps = {
  whatsappNumber: string;
  value: string;
  onChange: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
  message: string | null;
  error: string | null;
  loading: boolean;
  resendLabel: string;
  canResend: boolean;
  onBack: () => void;
};

const OtpStep = ({
  whatsappNumber,
  value,
  onChange,
  onVerify,
  onResend,
  message,
  error,
  loading,
  resendLabel,
  canResend,
  onBack,
}: OtpStepProps) => {
  const canVerify = value.trim().length === 6;

  return (
    <View style={styles.card}>
      <Text style={styles.stepLabel}>Step 2</Text>
      <Text style={styles.cardTitle}>Confirm your WhatsApp number</Text>
      <Text style={styles.cardSubtitle}>
        Enter the 6-digit code we sent to <Text style={styles.emphasis}>{whatsappNumber}</Text>.
      </Text>
      <TextInput
        accessibilityLabel="Verification code"
        placeholder="••••••"
        style={styles.input}
        keyboardType="number-pad"
        maxLength={6}
        value={value}
        onChangeText={onChange}
      />
      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actionsRow}>
        <Button title="Back" onPress={onBack} />
        <View style={styles.primaryAction}>
          {loading ? (
            <ActivityIndicator color="#0ea5e9" />
          ) : (
            <Button title="Verify" onPress={onVerify} disabled={!canVerify} />
          )}
        </View>
      </View>
      <View style={styles.resendRow}>
        <Text style={styles.subtitle}>{resendLabel}</Text>
        <Button title="Resend code" onPress={onResend} disabled={!canResend || loading} />
      </View>
    </View>
  );
};

type LanguageStepProps = StepProps & {
  onNext: () => void;
  onBack: () => void;
};

const LanguageStep = ({ value, onChange, onNext, onBack }: LanguageStepProps) => (
  <View style={styles.card}>
    <Text style={styles.stepLabel}>Step 3</Text>
    <Text style={styles.cardTitle}>Language & visibility</Text>
    <Text style={styles.cardSubtitle}>Pick your preferred language and whether other fans can find you.</Text>

    <View style={styles.languageRow}>
      {languages.map((item) => (
        <Text
          key={item.value}
          onPress={() => onChange({ ...value, language: item.value })}
          style={[styles.languageChip, value.language === item.value ? styles.languageChipActive : null]}
        >
          {item.label}
        </Text>
      ))}
    </View>

    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>Show me in the public member directory</Text>
      <Switch
        value={value.publicProfile}
        onValueChange={(next) => onChange({ ...value, publicProfile: next })}
      />
    </View>

    <View style={styles.actionsRow}>
      <Button title="Back" onPress={onBack} />
      <Button title="Continue" onPress={onNext} />
    </View>
  </View>
);

type NotificationStepProps = StepProps & {
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
  success: string | null;
};

const NotificationStep = ({ value, onChange, onSubmit, onBack, loading, error, success }: NotificationStepProps) => (
  <View style={styles.card}>
    <Text style={styles.stepLabel}>Step 4</Text>
    <Text style={styles.cardTitle}>Match reminders</Text>
    <Text style={styles.cardSubtitle}>Choose which notifications to receive. We'll sync them to Supabase.</Text>

    {(Object.keys(value.notifications) as (keyof OnboardingPreferences["notifications"])[]).map((key) => (
      <View key={key} style={styles.switchRow}>
        <Text style={styles.switchLabel}>{labelForNotification(key)}</Text>
        <Switch
          value={value.notifications[key]}
          onValueChange={(next) =>
            onChange({
              ...value,
              notifications: { ...value.notifications, [key]: next },
            })
          }
        />
      </View>
    ))}

    {error ? <Text style={styles.error}>{error}</Text> : null}
    {success ? <Text style={styles.success}>{success}</Text> : null}

    <View style={styles.actionsRow}>
      <Button title="Back" onPress={onBack} />
      <View style={styles.primaryAction}>
        {loading ? <ActivityIndicator color="#0ea5e9" /> : <Button title="Finish" onPress={onSubmit} />}
      </View>
    </View>
  </View>
);

const labelForNotification = (key: keyof OnboardingPreferences["notifications"]): string => {
  switch (key) {
    case "kickoff":
      return "Kick-off reminders";
    case "goals":
      return "Goal alerts";
    case "final":
      return "Full-time result";
    case "club":
      return "Club news";
    default:
      return key;
  }
};

const secondsUntil = (iso?: string) => {
  if (!iso) {
    return 0;
  }
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) {
    return 0;
  }
  return Math.max(0, Math.round((timestamp - Date.now()) / 1000));
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    backgroundColor: "#040f1a",
    justifyContent: "flex-start",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(14,165,233,0.2)",
    color: "#e0f2ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 12,
  },
  notice: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 18,
  },
  card: {
    backgroundColor: "rgba(4, 15, 26, 0.75)",
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  stepLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "white",
    backgroundColor: "rgba(15,23,42,0.6)",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  switchLabel: {
    flex: 1,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  languageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  languageChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.6)",
  },
  languageChipActive: {
    backgroundColor: "rgba(14,165,233,0.3)",
    color: "white",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  primaryAction: {
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: "#f97316",
    fontSize: 14,
  },
  success: {
    color: "#22c55e",
    fontSize: 14,
  },
  emphasis: {
    fontWeight: "700",
    color: "white",
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
});

export default OnboardingStack;
