import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PieChart } from "react-native-gifted-charts";
import { colors } from "../../theme/colors";
import AnimatedCard from "../../components/AnimatedCard";
import {
  DiaryDay,
  FoodSearchItem,
  MealType,
  MEAL_TYPES,
  UserProfile,
} from "../../dto/nutrition";
import {
  getDiary,
  getProfile,
  insertDiaryEntry,
  deleteDiaryEntry,
  searchFoods,
} from "../../services/nutrition";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftDay(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatHeading(iso: string): string {
  if (iso === todayIso()) return "Today";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function round(n: number): number {
  return Math.round(n);
}

export default function Nutrition() {
  const router = useRouter();
  const [date, setDate] = useState(todayIso());
  const [diary, setDiary] = useState<DiaryDay | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState<{ open: boolean; meal: MealType }>({
    open: false,
    meal: "Breakfast",
  });

  const load = useCallback(async () => {
    const d = await getDiary(date);
    setDiary(d);
    setLoading(false);
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      load();
      if (!profile) getProfile().then(setProfile);
    }, [load, profile])
  );

  async function handleDelete(id: number) {
    await deleteDiaryEntry(id);
    load();
  }

  const calorieGoal = profile?.dailyCalorieGoal ?? 0;
  const proteinGoal = profile?.dailyProteinGoal ?? 0;
  const consumed = diary ? round(diary.totalKcal) : 0;
  const protein = diary ? round(diary.totalProtein) : 0;
  const remaining = calorieGoal > 0 ? Math.max(calorieGoal - consumed, 0) : 0;
  const over = calorieGoal > 0 && consumed > calorieGoal;

  const pieData =
    calorieGoal > 0
      ? over
        ? [{ value: 1, color: colors.orange }]
        : [
            { value: consumed, color: colors.accent },
            { value: remaining, color: colors.surface2 },
          ]
      : [{ value: 1, color: colors.surface2 }];

  const proteinPct =
    proteinGoal > 0 ? Math.min((protein / proteinGoal) * 100, 100) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Nutrition</Text>
          <Pressable
            onPress={() => router.push("/nutrition-stats" as any)}
            hitSlop={8}
          >
            <Ionicons name="stats-chart" size={20} color={colors.accent} />
          </Pressable>
        </View>
        <View style={styles.dateNav}>
          <Pressable onPress={() => setDate((d) => shiftDay(d, -1))} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.dateLabel}>{formatHeading(date)}</Text>
          <Pressable
            onPress={() => setDate((d) => shiftDay(d, 1))}
            hitSlop={8}
            disabled={date >= todayIso()}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={date >= todayIso() ? colors.line : colors.text}
            />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <AnimatedCard style={styles.summaryCard}>
            <PieChart
              donut
              radius={62}
              innerRadius={48}
              data={pieData}
              backgroundColor={colors.surface}
              innerCircleColor={colors.surface}
              centerLabelComponent={() => (
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.ringValue}>{consumed}</Text>
                  <Text style={styles.ringSub}>
                    {calorieGoal > 0 ? `/ ${calorieGoal}` : "kcal"}
                  </Text>
                </View>
              )}
            />
            <View style={styles.summaryRight}>
              <Text style={styles.summaryKcal}>
                {calorieGoal > 0
                  ? over
                    ? `${consumed - calorieGoal} over`
                    : `${remaining} left`
                  : `${consumed} kcal`}
              </Text>
              <View style={styles.proteinWrap}>
                <View style={styles.proteinLabelRow}>
                  <Text style={styles.proteinLabel}>Protein</Text>
                  <Text style={styles.proteinValue}>
                    {protein}
                    {proteinGoal > 0 ? ` / ${proteinGoal}` : ""} g
                  </Text>
                </View>
                <View style={styles.proteinTrack}>
                  <View
                    style={[styles.proteinFill, { width: `${proteinPct}%` }]}
                  />
                </View>
              </View>
            </View>
          </AnimatedCard>

          {MEAL_TYPES.map((meal, mealIndex) => {
            const items =
              diary?.entries.filter((e) => e.mealType === meal) ?? [];
            const subtotal = round(items.reduce((s, e) => s + e.kcal, 0));
            return (
              <AnimatedCard
                key={meal}
                delay={60 + mealIndex * 60}
                style={styles.mealSection}
              >
                <View style={styles.mealHeader}>
                  <Text style={styles.mealTitle}>{meal}</Text>
                  <Text style={styles.mealSubtotal}>{subtotal} kcal</Text>
                </View>

                {items.map((e) => (
                  <Pressable
                    key={e.id}
                    style={styles.entryRow}
                    onLongPress={() => handleDelete(e.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryName} numberOfLines={1}>
                        {e.foodName}
                      </Text>
                      <Text style={styles.entryMeta}>
                        {round(e.grams)} g · {round(e.protein)}g protein
                      </Text>
                    </View>
                    <Text style={styles.entryKcal}>{round(e.kcal)}</Text>
                  </Pressable>
                ))}

                <Pressable
                  style={styles.addFoodBtn}
                  onPress={() => setPicker({ open: true, meal })}
                >
                  <Ionicons name="add" size={18} color={colors.accent} />
                  <Text style={styles.addFoodText}>Add food</Text>
                </Pressable>
              </AnimatedCard>
            );
          })}

          <Text style={styles.hint}>Long-press an entry to delete it.</Text>
        </ScrollView>
      )}

      <FoodPicker
        visible={picker.open}
        meal={picker.meal}
        date={date}
        onClose={() => setPicker((p) => ({ ...p, open: false }))}
        onAdded={() => {
          setPicker((p) => ({ ...p, open: false }));
          load();
        }}
      />
    </SafeAreaView>
  );
}

function FoodPicker({
  visible,
  meal,
  date,
  onClose,
  onAdded,
}: {
  visible: boolean;
  meal: MealType;
  date: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<FoodSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<FoodSearchItem | null>(null);
  const [grams, setGrams] = useState("100");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      const data = await searchFoods(q);
      setResults(data);
      setSearching(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [term]);

  function reset() {
    setTerm("");
    setResults([]);
    setSelected(null);
    setGrams("100");
  }

  function close() {
    reset();
    onClose();
  }

  async function save() {
    if (!selected) return;
    const g = parseFloat(grams.replace(",", "."));
    if (isNaN(g) || g < 1 || g > 5000) return;
    setSaving(true);
    const id = await insertDiaryEntry(selected.id, date, meal, g);
    setSaving(false);
    if (id != null) {
      reset();
      onAdded();
    }
  }

  const g = parseFloat(grams.replace(",", ".")) || 0;
  const previewKcal = selected
    ? Math.round((selected.kcalPer100g * g) / 100)
    : 0;
  const previewProtein = selected
    ? Math.round((selected.proteinPer100g * g) / 100)
    : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.pickerHeader}>
          {selected ? (
            <Pressable onPress={() => setSelected(null)} hitSlop={10}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          ) : (
            <Pressable onPress={close} hitSlop={10}>
              <Ionicons name="close" size={26} color={colors.text} />
            </Pressable>
          )}
          <Text style={styles.pickerTitle}>{meal}</Text>
          <View style={{ width: 26 }} />
        </View>

        {!selected ? (
          <>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                style={styles.searchInput}
                value={term}
                onChangeText={setTerm}
                placeholder="Search foods…"
                placeholderTextColor={colors.muted}
                autoFocus
                autoCorrect={false}
              />
              {searching && (
                <ActivityIndicator size="small" color={colors.accent} />
              )}
            </View>
            <FlatList
              data={results}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 18 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.resultRow}
                  onPress={() => setSelected(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.resultMeta}>
                      {round(item.kcalPer100g)} kcal ·{" "}
                      {round(item.proteinPer100g)}g protein / 100g
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={colors.accent} />
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {term.trim().length < 2
                    ? "Type at least 2 letters to search."
                    : searching
                    ? "Searching…"
                    : "No foods found."}
                </Text>
              }
            />
          </>
        ) : (
          <View style={styles.gramsStep}>
            <Text style={styles.selectedName}>{selected.name}</Text>
            <Text style={styles.selectedMeta}>
              {round(selected.kcalPer100g)} kcal / 100g
            </Text>

            <Text style={styles.gramsLabel}>Amount (grams)</Text>
            <TextInput
              style={styles.gramsInput}
              value={grams}
              onChangeText={setGrams}
              keyboardType="decimal-pad"
              autoFocus
            />

            <View style={styles.previewRow}>
              <View style={styles.previewBox}>
                <Text style={styles.previewValue}>{previewKcal}</Text>
                <Text style={styles.previewLabel}>kcal</Text>
              </View>
              <View style={styles.previewBox}>
                <Text style={styles.previewValue}>{previewProtein}</Text>
                <Text style={styles.previewLabel}>protein (g)</Text>
              </View>
            </View>

            <Pressable style={styles.saveBtn} onPress={save} disabled={saving}>
              <Text style={styles.saveBtnText}>
                {saving ? "Adding…" : `Add to ${meal}`}
              </Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </Modal>
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
  title: { color: colors.text, fontSize: 24, fontWeight: "800" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dateNav: { flexDirection: "row", alignItems: "center", gap: 10 },
  dateLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    minWidth: 70,
    textAlign: "center",
  },
  content: { padding: 18, paddingBottom: 60 },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
  },
  ringValue: { color: colors.text, fontSize: 22, fontWeight: "800" },
  ringSub: { color: colors.muted, fontSize: 12 },
  summaryRight: { flex: 1, gap: 14 },
  summaryKcal: { color: colors.text, fontSize: 16, fontWeight: "700" },
  proteinWrap: { gap: 6 },
  proteinLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  proteinLabel: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  proteinValue: { color: colors.text, fontSize: 12, fontWeight: "600" },
  proteinTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface2,
    overflow: "hidden",
  },
  proteinFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent2,
  },
  mealSection: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginTop: 16,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  mealTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  mealSubtotal: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  entryName: { color: colors.text, fontSize: 14, fontWeight: "500" },
  entryMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  entryKcal: { color: colors.text, fontSize: 14, fontWeight: "700" },
  addFoodBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    marginTop: 4,
  },
  addFoodText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  hint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 18,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  pickerTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 18,
    marginVertical: 14,
    paddingHorizontal: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  resultName: { color: colors.text, fontSize: 15, fontWeight: "600" },
  resultMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 40,
  },
  gramsStep: { padding: 22 },
  selectedName: { color: colors.text, fontSize: 20, fontWeight: "700" },
  selectedMeta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  gramsLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 26,
    marginBottom: 8,
  },
  gramsInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  previewRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  previewBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  previewValue: { color: colors.accent, fontSize: 22, fontWeight: "800" },
  previewLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 28,
  },
  saveBtnText: { color: colors.bg, fontSize: 15, fontWeight: "700" },
});
