import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { ExerciseDetail } from "../dto/workout";
import { getExerciseById } from "../services/workout";

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const numId = parseInt(String(id), 10);
    if (isNaN(numId)) {
      setLoading(false);
      return;
    }
    getExerciseById(numId).then((e) => {
      setExercise(e);
      setLoading(false);
    });
  }, [id]);

  const media = exercise?.gifUrl || exercise?.imageUrl || null;
  const steps =
    exercise?.instructions
      ?.split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0) ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {exercise?.name ?? "Exercise"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : !exercise ? (
        <Text style={styles.empty}>Exercise not found.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {media ? (
            <Image
              source={{ uri: media }}
              style={styles.media}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.media, styles.mediaPlaceholder]}>
              <Ionicons name="barbell-outline" size={48} color={colors.muted} />
            </View>
          )}

          <Text style={styles.name}>{exercise.name}</Text>

          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{exercise.muscleGroup}</Text>
            </View>
            {exercise.equipment ? (
              <View style={[styles.tag, styles.tagAlt]}>
                <Text style={styles.tagText}>{exercise.equipment}</Text>
              </View>
            ) : null}
          </View>

          {steps.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Instructions</Text>
              {steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 8,
  },
  content: { padding: 18, paddingBottom: 50 },
  media: {
    width: "100%",
    height: 240,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  mediaPlaceholder: { alignItems: "center", justifyContent: "center" },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 18,
  },
  tagsRow: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  tag: {
    backgroundColor: colors.surface2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagAlt: { backgroundColor: colors.surface },
  tagText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  sectionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 26,
    marginBottom: 10,
  },
  stepRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  stepText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  empty: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
});
