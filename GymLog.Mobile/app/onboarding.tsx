import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "../theme/colors";
import Input from "../components/Input";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { calculatePlan, completeOnboarding } from "../services/user";
import {
  Sex,
  ActivityLevel,
  GoalType,
  OnboardingData,
  OnboardingResult,
  PlanOption,
} from "../dto/onboarding";

export default function Onboarding() {
  const { completeOnboarding: markOnboardingDone } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [sex, setSex] = useState<Sex>("Male");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("Moderate");

  const [result, setResult] = useState<OnboardingResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const defaultDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 25);
    return d;
  })();

  function toIsoDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }

  function computeAge(d: Date): number {
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  }

  function formatDob(d: Date): string {
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function onDobChange(event: any, date?: Date) {
    if (Platform.OS === "android") setShowPicker(false);
    if (event.type === "dismissed" || !date) return;
    setBirthDate(date);
  }

  function buildData(): OnboardingData {
    return {
      sex,
      birthDate: birthDate ? toIsoDate(birthDate) : toIsoDate(defaultDob),
      heightCm: parseInt(height, 10),
      weightKg: parseFloat(weight),
      activityLevel,
      goalType: goalType!,
    };
  }

  function handleContinue() {
    if (step === 1 && !goalType) {
      setError("Please pick a goal.");
      return;
    }
    if (step === 2 && (!birthDate || !height || !weight)) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setStep(step + 1);
  }

  function handleBack() {
    setError(null);
    setStep(step - 1);
  }

  async function handleCalculate() {
    setError(null);
    setLoading(true);

    const res = await calculatePlan(buildData());
    setLoading(false);

    if (!res) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setResult(res);
    setSelectedIndex(res.options.length > 1 ? 1 : 0);
    setStep(4);
  }

  async function handleGetStarted() {
    if (!result) return;
    setError(null);
    setLoading(true);

    const chosen = result.options[selectedIndex];
    const ok = await completeOnboarding(buildData(), chosen.calories);
    setLoading(false);

    if (!ok) {
      setError("Something went wrong. Please try again.");
      return;
    }

    await markOnboardingDone();
    router.replace("/plan-finder" as any);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dots}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.dot, step >= n && styles.dotActive]} />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {step === 1 && (
          <View>
            <Text style={styles.title}>What's your goal?</Text>
            <Text style={styles.subtitle}>
              We'll tailor your calories and recommendations.
            </Text>

            <GoalCard
              emoji="📉"
              title="Lose weight"
              desc="Calorie deficit"
              selected={goalType === "LoseWeight"}
              onPress={() => setGoalType("LoseWeight")}
            />
            <GoalCard
              emoji="📈"
              title="Gain muscle"
              desc="Calorie surplus"
              selected={goalType === "GainMass"}
              onPress={() => setGoalType("GainMass")}
            />
            <GoalCard
              emoji="⚖️"
              title="Maintain"
              desc="Stable weight"
              selected={goalType === "Maintain"}
              onPress={() => setGoalType("Maintain")}
            />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.title}>Tell us about you</Text>
            <Text style={styles.subtitle}>
              Needed to calculate calories and protein.
            </Text>

            <Text style={styles.label}>Sex</Text>
            <View style={styles.segment}>
              <SegmentOption
                label="Male"
                selected={sex === "Male"}
                onPress={() => setSex("Male")}
              />
              <SegmentOption
                label="Female"
                selected={sex === "Female"}
                onPress={() => setSex("Female")}
              />
            </View>

            <Text style={styles.label}>Date of birth</Text>
            <Pressable
              style={styles.dobField}
              onPress={() => setShowPicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.accent}
              />
              <Text
                style={[
                  styles.dobText,
                  !birthDate && { color: colors.dim },
                ]}
              >
                {birthDate
                  ? `${formatDob(birthDate)} · ${computeAge(birthDate)} yrs`
                  : "Select your date of birth"}
              </Text>
            </Pressable>
            {showPicker && (
              <DateTimePicker
                value={birthDate ?? defaultDob}
                mode="date"
                maximumDate={new Date()}
                minimumDate={new Date(1920, 0, 1)}
                onChange={onDobChange}
              />
            )}

            <Text style={styles.label}>Height (cm)</Text>
            <Input
              placeholder="Height"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Weight (kg)</Text>
            <Input
              placeholder="Weight"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Activity level</Text>
            <View style={styles.segment}>
              <SegmentOption
                label="Low"
                selected={activityLevel === "Sedentary"}
                onPress={() => setActivityLevel("Sedentary")}
              />
              <SegmentOption
                label="Medium"
                selected={activityLevel === "Moderate"}
                onPress={() => setActivityLevel("Moderate")}
              />
              <SegmentOption
                label="High"
                selected={activityLevel === "Active"}
                onPress={() => setActivityLevel("Active")}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.title}>Review</Text>
            <Text style={styles.subtitle}>Confirm your information.</Text>

            <ReviewRow label="Goal" value={goalLabel(goalType)} />
            <ReviewRow label="Sex" value={sex} />
            <ReviewRow
              label="Date of birth"
              value={
                birthDate
                  ? `${formatDob(birthDate)} (${computeAge(birthDate)} yrs)`
                  : "-"
              }
            />
            <ReviewRow label="Height" value={`${height} cm`} />
            <ReviewRow label="Weight" value={`${weight} kg`} />
            <ReviewRow label="Activity" value={activityLevel} />
          </View>
        )}

        {step === 4 && result && (
          <View>
            <Text style={styles.bigIcon}>🎯</Text>
            <Text style={styles.title}>Choose your pace</Text>
            <Text style={styles.subtitle}>
              Daily protein target: {result.protein} g
            </Text>

            {result.options.map((opt, i) => (
              <Pressable
                key={i}
                onPress={() => setSelectedIndex(i)}
                style={[
                  styles.optionCard,
                  selectedIndex === i && styles.optionCardSelected,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  <Text style={styles.optionSub}>
                    {optionSubtitle(opt, goalType)}
                  </Text>
                </View>
                <Text style={styles.optionCals}>
                  {opt.calories}
                  <Text style={styles.optionCalsUnit}> kcal</Text>
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.footer}>
        {(step === 1 || step === 2) && (
          <Button title="Continue" onPress={handleContinue} />
        )}
        {step === 3 && (
          <Button
            title={loading ? "Calculating..." : "Calculate my plan"}
            onPress={handleCalculate}
          />
        )}
        {step === 4 && (
          <Button
            title={loading ? "Saving..." : "Get started 💪"}
            onPress={handleGetStarted}
          />
        )}
        {step > 1 && (
          <>
            <View style={{ height: 10 }} />
            <Button title="Back" variant="ghost" onPress={handleBack} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function GoalCard({
  emoji,
  title,
  desc,
  selected,
  onPress,
}: {
  emoji: string;
  title: string;
  desc: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <Text style={styles.cardEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
      </View>
    </Pressable>
  );
}

function SegmentOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentOption, selected && styles.segmentOptionActive]}
    >
      <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

function goalLabel(g: GoalType | null): string {
  if (g === "LoseWeight") return "Lose weight";
  if (g === "GainMass") return "Gain muscle";
  if (g === "Maintain") return "Maintain";
  return "-";
}

function optionSubtitle(opt: PlanOption, goal: GoalType | null): string {
  if (goal === "LoseWeight") return `Lose ~${opt.weeklyChangeKg} kg / week`;
  if (goal === "GainMass") return `Gain ~${opt.weeklyChangeKg} kg / week`;
  return "Maintain your weight";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 18,
  },
  dot: {
    width: 26,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surface2,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  cardDesc: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  segment: {
    flexDirection: "row",
    gap: 8,
  },
  dobField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
  },
  dobText: { color: colors.text, fontSize: 15, fontWeight: "600", flex: 1 },
  segmentOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  segmentOptionActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  segmentText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: colors.accentText,
    fontWeight: "700",
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 15,
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  reviewValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "700",
  },
  bigIcon: {
    fontSize: 44,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 6,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  optionCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surface2,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  optionSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  optionCals: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.orange,
  },
  optionCalsUnit: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
    marginVertical: 8,
  },
  footer: {
    marginTop: 12,
  },
});
