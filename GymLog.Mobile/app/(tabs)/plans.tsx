import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { PlanListItem } from "../../dto/plan";
import { getTemplates, getMyPlans } from "../../services/plan";

export default function Plans() {
  const router = useRouter();
  const [myPlans, setMyPlans] = useState<PlanListItem[]>([]);
  const [templates, setTemplates] = useState<PlanListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getMyPlans(), getTemplates()]).then(([mine, temps]) => {
        setMyPlans(mine);
        setTemplates(temps);
        setLoading(false);
      });
    }, [])
  );

  function openPlan(id: number) {
    router.push({ pathname: "/plan-detail", params: { id: String(id) } } as any);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Plans</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable
            style={styles.aiBtn}
            onPress={() => router.push("/generate-plan" as any)}
          >
            <Ionicons name="sparkles" size={20} color={colors.bg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.aiBtnText}>Generate with AI</Text>
              <Text style={styles.aiBtnSub}>
                Describe your goals — get a custom plan
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.bg} />
          </Pressable>

          {myPlans.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>My Plans</Text>
              {myPlans.map((p) => (
                <PlanCard key={p.id} plan={p} onPress={() => openPlan(p.id)} />
              ))}
            </>
          )}

          <Text style={styles.sectionLabel}>Browse Plans</Text>
          {templates.map((p) => (
            <PlanCard key={p.id} plan={p} onPress={() => openPlan(p.id)} />
          ))}

          {templates.length === 0 && myPlans.length === 0 && (
            <Text style={styles.empty}>No plans available.</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function PlanCard({
  plan,
  onPress,
}: {
  plan: PlanListItem;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardName}>{plan.name}</Text>
          {plan.isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          )}
        </View>
        {plan.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {plan.description}
          </Text>
        ) : null}
        <Text style={styles.cardMeta}>
          {plan.dayCount} {plan.dayCount === 1 ? "day" : "days"}
          {plan.source === "AI" ? " · AI" : ""}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 18, paddingVertical: 14 },
  title: { color: colors.text, fontSize: 24, fontWeight: "800" },
  content: { padding: 18, paddingBottom: 40 },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 16,
    marginBottom: 4,
  },
  aiBtnText: { color: colors.bg, fontSize: 16, fontWeight: "800" },
  aiBtnSub: { color: colors.bg, fontSize: 12, fontWeight: "500", marginTop: 2, opacity: 0.8 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 12,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardName: { color: colors.text, fontSize: 16, fontWeight: "700" },
  activeBadge: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  activeBadgeText: { color: colors.bg, fontSize: 10, fontWeight: "800" },
  cardDesc: { color: colors.muted, fontSize: 13, marginTop: 4 },
  cardMeta: { color: colors.accent, fontSize: 12, fontWeight: "600", marginTop: 8 },
  empty: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
});
