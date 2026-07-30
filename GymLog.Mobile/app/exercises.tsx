import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { ExerciseSearchItem } from "../dto/workout";
import { searchExercises } from "../services/workout";

const MUSCLES = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Core",
];

const EQUIPMENT = [
  "Body weight",
  "Dumbbell",
  "Barbell",
  "Cable",
  "Kettlebell",
  "Band",
  "Smith machine",
  "Leverage machine",
];

export default function Exercises() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [results, setResults] = useState<ExerciseSearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(async () => {
      const data = await searchExercises(
        search.trim(),
        muscle ?? undefined,
        equipment ?? undefined
      );
      setResults(data);
      setLoading(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [search, muscle, equipment]);

  function toggleMuscle(m: string) {
    setMuscle((cur) => (cur === m ? null : m));
  }
  function toggleEquipment(e: string) {
    setEquipment((cur) => (cur === e ? null : e));
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Exercises</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises…"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {MUSCLES.map((m) => {
            const active = muscle === m;
            return (
              <Pressable
                key={m}
                onPress={() => toggleMuscle(m)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {m}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {EQUIPMENT.map((e) => {
            const active = equipment === e;
            return (
              <Pressable
                key={e}
                onPress={() => toggleEquipment(e)}
                style={[styles.chip, styles.chipEq, active && styles.chipEqActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipEqTextActive]}
                >
                  {e}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                router.push({
                  pathname: "/exercise-detail",
                  params: { id: String(item.id) },
                } as any)
              }
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Ionicons name="barbell-outline" size={22} color={colors.muted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.rowMeta}>
                  {item.muscleGroup}
                  {item.equipment ? ` · ${item.equipment}` : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No exercises found.</Text>
          }
        />
      )}
    </SafeAreaView>
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
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 18,
    paddingHorizontal: 14,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: colors.text,
  },
  chipRow: { paddingHorizontal: 18, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipEq: {},
  chipEqActive: { backgroundColor: colors.accent2, borderColor: colors.accent2 },
  chipText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: colors.accentText, fontWeight: "700" },
  chipEqTextActive: { color: colors.accent2Text, fontWeight: "700" },
  list: { paddingHorizontal: 18, paddingBottom: 40, paddingTop: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface2,
  },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  rowName: { color: colors.text, fontSize: 15, fontWeight: "600" },
  rowMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  empty: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 40,
  },
});
