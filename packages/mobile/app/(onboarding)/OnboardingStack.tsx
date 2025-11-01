import { useState } from "react";
import { View, Text, TextInput, Switch, Button, StyleSheet, ActivityIndicator } from "react-native";

import type { OnboardingPreferences } from "./api";
import { submitOnboarding } from "./api";

type Step = 0 | 1 | 2;

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const goNext = () => setStep((current) => Math.min(2, (current + 1) as Step));
  const goBack = () => setStep((current) => Math.max(0, (current - 1) as Step));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await submitOnboarding(prefs);
      setSuccess("Preferences synced to Supabase");
      onCompleted?.(result);
    } catch (submitError) {
      console.error("Failed to submit onboarding", submitError);
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>Guest friendly setup</Text>
      <Text style={styles.title}>Tailor your Rayon Sports experience</Text>
      <Text style={styles.subtitle}>Three quick steps and you're match ready.</Text>

      {step === 0 ? (
        <StepOne
          value={prefs}
          onChange={setPrefs}
          onNext={goNext}
        />
      ) : null}

      {step === 1 ? (
        <StepTwo
          value={prefs}
          onChange={setPrefs}
          onNext={goNext}
          onBack={goBack}
        />
      ) : null}

      {step === 2 ? (
        <StepThree
          value={prefs}
          onChange={setPrefs}
          onSubmit={handleSubmit}
          onBack={goBack}
          loading={loading}
          error={error}
          success={success}
        />
      ) : null}
    </View>
  );
}

type StepProps = {
  value: OnboardingPreferences;
  onChange: (next: OnboardingPreferences) => void;
};

type StepOneProps = StepProps & {
  onNext: () => void;
};

const StepOne = ({ value, onChange, onNext }: StepOneProps) => {
  const canContinue = value.whatsappNumber.trim().length >= 8 && (value.useWhatsappForMomo || value.momoNumber?.length);
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
      <Button title="Continue" onPress={onNext} disabled={!canContinue} />
    </View>
  );
};

type StepTwoProps = StepProps & {
  onNext: () => void;
  onBack: () => void;
};

const StepTwo = ({ value, onChange, onNext, onBack }: StepTwoProps) => (
  <View style={styles.card}>
    <Text style={styles.stepLabel}>Step 2</Text>
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

type StepThreeProps = StepProps & {
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
  success: string | null;
};

const StepThree = ({ value, onChange, onSubmit, onBack, loading, error, success }: StepThreeProps) => (
  <View style={styles.card}>
    <Text style={styles.stepLabel}>Step 3</Text>
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
});

export default OnboardingStack;
