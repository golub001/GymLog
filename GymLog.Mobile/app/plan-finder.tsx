import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { PlanListItem } from "../dto/plan";
import { getTemplates, useTemplate } from "../services/plan";

type Experience = "new" | "experienced";
type Place = "gym" | "home";
type Focus = "overall" | "glutes";

function recommendName(
  exp: Experience,
  place: Place,
  focus: Focus,
  days: number
): string {
  if (place === "home") return "Home Bodyweight";
  if (focus === "glutes") return "Glutes & Legs";
  if (exp === "new") return "Beginner Full Body";
  if (days >= 5) return "PPL ×2";
  if (days === 4) return "Upper / Lower";
  return "Push / Pull / Legs";
}

export default function PlanFinder() {
  const router = useRouter();
  const [templates, setTemplates] = useState<PlanListItem[]>([]);
  const [exp, setExp] = useState<Experience | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [result, setResult] = useState<PlanListItem | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getTemplates().then(setTemplates);
    }, [])
  );

  const ready = exp && place && focus && days;

  function findPlan() {
    if (!ready) return;
    const name = recommendName(exp!, place!, focus!, days!);
    const match =
      templates.find((t) => t.name === name) ?? templates[0] ?? null;
    setResult(match);
  }

  async function useThis() {
    if (!result) return;
    setBusy(true);
    const newId = await useTemplate(result.id);
    setBusy(false);
    if (newId != null) {
      router.replace({
        pathname: "/plan-detail",
        params: { id: String(newId) },
      } as any);
    } else {
      Alert.alert("Error", "Could not add this plan.");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find your plan</Text>
        <Pressable onPress={() => router.replace("/" as any)} hitSlop={10}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Answer a few questions and we'll suggest a plan.
        </Text>

        <Question label="Have you trained before?">
          <Choice text="I'm new" active={exp === "new"} onPress={() => setExp("new")} />
          <Choice
            text="I've trained before"
            active={exp === "experienced"}
            onPress={() => setExp("experienced")}
          />
        </Question>

        <Question label="Where will you train?">
          <Choice text="Gym" active={place === "gym"} onPress={() => setPlace("gym")} />
          <Choice text="Home" active={place === "home"} onPress={() => setPlace("home")} />
        </Question>

        <Question label="Main focus?">
          <Choice
            text="Overall"
            active={focus === "overall"}
            onPress={() => setFocus("overall")}
          />
          <Choice
            text="Glutes & legs"
            active={focus === "glutes"}
            onPress={() => setFocus("glutes")}
          />
        </Question>

        <Question label="Days per week?">
          {[3, 4, 5].map((d) => (
            <Choice
              key={d}
              text={d === 5 ? "5+" : String(d)}
              active={days === d}
              onPress={() => setDays(d)}
            />
          ))}
        </Question>

        <Pressable
          style={[styles.findBtn, !ready && styles.findBtnDisabled]}
          onPress={findPlan}
          disabled={!ready}
        >
          <Text style={styles.findText}>See my plan</Text>
        </Pressable>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>RECOMMENDED FOR YOU</Text>
            <Text style={styles.resultName}>{result.name}</Text>
            {result.description ? (
              <Text style={styles.resultDesc}>{result.description}</Text>
            ) : null}
            <Pressable style={styles.useBtn} onPress={useThis} disabled={busy}>
              <Text style={styles.useText}>
                {busy ? "Adding…" : "Use this plan"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.aiLink}
              onPress={() => router.push("/generate-plan" as any)}
            >
              <Ionicons name="sparkles" size={16} color={colors.accent} />
              <Text style={styles.aiLinkText}>Or create your own with AI</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Question({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.question}>
      <Text style={styles.qLabel}>{label}</Text>
      <View style={styles.choiceRow}>{children}</View>
    </View>
  );
}

function Choice({
  text,
  active,
  onPress,
}: {
  text: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choice, active && styles.choiceActive]}
    >
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: "800" },
  skip: { color: colors.muted, fontSize: 15, fontWeight: "600" },
  content: { padding: 18, paddingBottom: 50 },
  intro: { color: colors.muted, fontSize: 14, marginBottom: 8 },
  question: { marginTop: 22 },
  qLabel: { color: colors.text, fontSize: 15, fontWeight: "700", marginBottom: 10 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  choiceActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  choiceText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  choiceTextActive: { color: colors.bg },
  findBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 30,
  },
  findBtnDisabled: { opacity: 0.4 },
  findText: { color: colors.bg, fontSize: 15, fontWeight: "700" },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 18,
    marginTop: 24,
  },
  resultLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  resultName: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 6 },
  resultDesc: { color: colors.muted, fontSize: 13, marginTop: 6, lineHeight: 18 },
  useBtn: {
    backgroundColor: colors.accent,
    borderRadius: 11,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  useText: { color: colors.bg, fontSize: 15, fontWeight: "700" },
  aiLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
  },
  aiLinkText: { color: colors.accent, fontSize: 14, fontWeight: "600" },
});
