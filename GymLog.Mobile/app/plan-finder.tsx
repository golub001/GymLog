import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { PlanListItem } from "../dto/plan";
import { getTemplates, useTemplate } from "../services/plan";

type Experience = "new" | "some" | "advanced";
type Equipment = "gym" | "dumbbells" | "bodyweight";
type Goal = "muscle" | "strength" | "fat" | "glutes";
type InjuryType = "knee" | "shoulder" | "back" | "other";

type Result =
  | { kind: "preset"; plan: PlanListItem }
  | {
      kind: "ai";
      reason: string;
      prompt: string;
      days: number;
      equipment: string;
    };

const EXP_TEXT: Record<Experience, string> = {
  new: "beginner",
  some: "intermediate lifter",
  advanced: "advanced lifter",
};
const GOAL_TEXT: Record<Goal, string> = {
  muscle: "muscle-building",
  strength: "strength",
  fat: "fat-loss",
  glutes: "glute- and leg-focused",
};
const EQUIP_WORD: Record<Equipment, string> = {
  gym: "a full gym",
  dumbbells: "dumbbells",
  bodyweight: "just bodyweight",
};
const INJURY_WORD: Record<InjuryType, string> = {
  knee: "knee",
  shoulder: "shoulder",
  back: "lower-back",
  other: "other",
};

function joinWords(words: string[]): string {
  if (words.length <= 1) return words[0] ?? "";
  return words.slice(0, -1).join(", ") + " and " + words[words.length - 1];
}

function equipParam(equip: Equipment[]): string {
  if (equip.includes("gym")) return ""; // full gym → any equipment
  const tokens: string[] = [];
  if (equip.includes("dumbbells")) tokens.push("Dumbbell");
  if (equip.includes("bodyweight")) tokens.push("Body weight");
  return tokens.join(",");
}

function pickPresetName(
  exp: Experience,
  equip: Equipment[],
  goal: Goal,
  days: number
): string {
  const hasGym = equip.includes("gym");
  const hasDb = equip.includes("dumbbells");
  const hasBw = equip.includes("bodyweight");

  if (!hasGym && !hasDb && hasBw) return "Home Bodyweight";
  if (!hasGym && hasDb) return "Dumbbell Only";

  // full gym available
  if (goal === "glutes") return "Glutes & Legs";
  if (goal === "strength") return "Strength 5×5";
  if (exp === "new") return "Beginner Full Body";
  if (days >= 5) return "PPL ×2";
  if (days === 4) return "Upper / Lower";
  if (goal === "muscle") return "Push / Pull / Legs";
  return "Full Body";
}

export default function PlanFinder() {
  const router = useRouter();
  const [templates, setTemplates] = useState<PlanListItem[]>([]);
  const [exp, setExp] = useState<Experience | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [equip, setEquip] = useState<Equipment[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [injuries, setInjuries] = useState<InjuryType[]>([]);
  const [noInjury, setNoInjury] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getTemplates().then(setTemplates);
    }, [])
  );

  const injuryAnswered = noInjury || injuries.length > 0;
  const ready = exp && days && equip.length > 0 && goal && injuryAnswered;

  function pickSingle<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setResult(null);
    };
  }

  function toggleEquip(e: Equipment) {
    setResult(null);
    setEquip((cur) =>
      cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]
    );
  }

  function toggleInjury(i: InjuryType) {
    setResult(null);
    setNoInjury(false);
    setInjuries((cur) =>
      cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]
    );
  }

  function selectNoInjury() {
    setResult(null);
    setInjuries([]);
    setNoInjury(true);
  }

  function findPlan() {
    if (!ready) return;

    if (injuries.length > 0) {
      const injuryText = joinWords(injuries.map((i) => INJURY_WORD[i]));
      const equipText = joinWords(equip.map((e) => EQUIP_WORD[e]));
      const plural = injuries.length > 1;
      const prompt =
        `${days}-day ${GOAL_TEXT[goal!]} plan for a ${EXP_TEXT[exp!]} ` +
        `training with ${equipText}. I have ${injuryText} ` +
        `${plural ? "injuries" : "issues"} — please avoid movements that ` +
        `stress ${plural ? "them" : "it"} and suggest safer alternatives.`;
      setResult({
        kind: "ai",
        reason:
          "Because of your injury, a ready-made plan can't adapt safely — so we'll let AI build one around it.",
        prompt,
        days: days!,
        equipment: equipParam(equip),
      });
      return;
    }

    const name = pickPresetName(exp!, equip, goal!, days!);
    const match =
      templates.find((t) => t.name === name) ?? templates[0] ?? null;
    if (match) setResult({ kind: "preset", plan: match });
  }

  async function usePreset(plan: PlanListItem) {
    setBusy(true);
    const newId = await useTemplate(plan.id);
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

  function goAi(prompt: string, d: number, equipment: string) {
    router.push({
      pathname: "/generate-plan",
      params: { prompt, days: String(d), equipment },
    } as any);
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
          Answer a few questions and we'll suggest the best plan — a ready-made
          one, or an AI-built plan if your case needs it.
        </Text>

        <Question label="How experienced are you?">
          <Choice text="New" active={exp === "new"} onPress={() => pickSingle(setExp)("new")} />
          <Choice text="Some experience" active={exp === "some"} onPress={() => pickSingle(setExp)("some")} />
          <Choice text="Advanced" active={exp === "advanced"} onPress={() => pickSingle(setExp)("advanced")} />
        </Question>

        <Question label="Days per week?">
          {[3, 4, 5].map((d) => (
            <Choice
              key={d}
              text={d === 5 ? "5+" : String(d)}
              active={days === d}
              onPress={() => pickSingle(setDays)(d)}
            />
          ))}
        </Question>

        <Question label="What can you train with?" hint="Pick all that apply">
          <Choice text="Full gym" active={equip.includes("gym")} onPress={() => toggleEquip("gym")} />
          <Choice text="Dumbbells" active={equip.includes("dumbbells")} onPress={() => toggleEquip("dumbbells")} />
          <Choice text="Bodyweight (home)" active={equip.includes("bodyweight")} onPress={() => toggleEquip("bodyweight")} />
        </Question>

        <Question label="Main goal?">
          <Choice text="Build muscle" active={goal === "muscle"} onPress={() => pickSingle(setGoal)("muscle")} />
          <Choice text="Get stronger" active={goal === "strength"} onPress={() => pickSingle(setGoal)("strength")} />
          <Choice text="Lose fat" active={goal === "fat"} onPress={() => pickSingle(setGoal)("fat")} />
          <Choice text="Glutes & legs" active={goal === "glutes"} onPress={() => pickSingle(setGoal)("glutes")} />
        </Question>

        <Question label="Any injuries or limitations?" hint="Pick all that apply">
          <Choice text="None" active={noInjury} onPress={selectNoInjury} />
          <Choice text="Knee" active={injuries.includes("knee")} onPress={() => toggleInjury("knee")} />
          <Choice text="Shoulder" active={injuries.includes("shoulder")} onPress={() => toggleInjury("shoulder")} />
          <Choice text="Lower back" active={injuries.includes("back")} onPress={() => toggleInjury("back")} />
          <Choice text="Other" active={injuries.includes("other")} onPress={() => toggleInjury("other")} />
        </Question>

        <Pressable
          style={[styles.findBtn, !ready && styles.findBtnDisabled]}
          onPress={findPlan}
          disabled={!ready}
        >
          <Text style={styles.findText}>See my recommendation</Text>
        </Pressable>

        {result?.kind === "preset" && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>RECOMMENDED FOR YOU</Text>
            <Text style={styles.resultName}>{result.plan.name}</Text>
            {result.plan.description ? (
              <Text style={styles.resultDesc}>{result.plan.description}</Text>
            ) : null}
            <Pressable
              style={styles.useBtn}
              onPress={() => usePreset(result.plan)}
              disabled={busy}
            >
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

        {result?.kind === "ai" && (
          <View style={styles.aiCard}>
            <View style={styles.aiBadgeRow}>
              <Ionicons name="sparkles" size={16} color={colors.accent} />
              <Text style={styles.resultLabel}>AI-DESIGNED PLAN</Text>
            </View>
            <Text style={styles.aiReason}>{result.reason}</Text>
            <Pressable
              style={styles.useBtn}
              onPress={() =>
                goAi(result.prompt, result.days, result.equipment)
              }
            >
              <Ionicons name="sparkles" size={17} color={colors.accentText} />
              <Text style={styles.useText}>Build my plan with AI</Text>
            </Pressable>
            <Text style={styles.aiHint}>
              You can edit the request on the next screen before generating.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Question({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.question}>
      <View style={styles.qLabelRow}>
        <Text style={styles.qLabel}>{label}</Text>
        {hint ? <Text style={styles.qHint}>{hint}</Text> : null}
      </View>
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
  intro: { color: colors.muted, fontSize: 14, marginBottom: 8, lineHeight: 20 },
  question: { marginTop: 22 },
  qLabelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  qLabel: { color: colors.text, fontSize: 15, fontWeight: "700" },
  qHint: { color: colors.muted, fontSize: 12, fontWeight: "500" },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  choiceActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  choiceText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  choiceTextActive: { color: colors.accentText, fontWeight: "700" },
  findBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 30,
  },
  findBtnDisabled: { opacity: 0.4 },
  findText: { color: colors.accentText, fontSize: 15, fontWeight: "700" },
  resultCard: {
    backgroundColor: colors.accentDim,
    borderRadius: 20,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  useText: { color: colors.accentText, fontSize: 15, fontWeight: "700" },
  aiLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
  },
  aiLinkText: { color: colors.accent, fontSize: 14, fontWeight: "600" },
  aiCard: {
    backgroundColor: colors.accentDim,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 18,
    marginTop: 24,
  },
  aiBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  aiReason: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
    marginTop: 8,
  },
  aiHint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },
});
