import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../theme/colors";
import { ProgressPhoto } from "../dto/progress";
import {
  getProgressPhotos,
  uploadProgressPhoto,
  deleteProgressPhoto,
} from "../services/progress";

const GAP = 10;
const COLUMNS = 2;
const TILE = (Dimensions.get("window").width - 18 * 2 - GAP) / COLUMNS;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProgressPhotosScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<ProgressPhoto | null>(null);

  const load = useCallback(() => {
    getProgressPhotos().then((data) => {
      setPhotos(data);
      setLoading(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function pickAndUpload() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo access to add a progress photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    const today = new Date().toISOString().slice(0, 10);
    const uploaded = await uploadProgressPhoto(result.assets[0].uri, today);
    setUploading(false);

    if (uploaded.ok) {
      load();
    } else {
      Alert.alert("Photo rejected", uploaded.error);
    }
  }

  function confirmDelete(photo: ProgressPhoto) {
    Alert.alert("Delete photo", "Remove this progress photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const ok = await deleteProgressPhoto(photo.id);
          if (ok) {
            setSelected(null);
            setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Progress Photos</Text>
        <Pressable onPress={pickAndUpload} hitSlop={10} disabled={uploading}>
          <Ionicons name="add" size={28} color={colors.accent} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : photos.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="camera-outline" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptyText}>
            Track your progress over time. Tap + to add your first photo.
          </Text>
          <Pressable style={styles.addBtn} onPress={pickAndUpload}>
            <Ionicons name="add" size={18} color={colors.bg} />
            <Text style={styles.addBtnText}>Add photo</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {photos.map((photo) => (
            <Pressable
              key={photo.id}
              style={styles.tile}
              onPress={() => setSelected(photo)}
            >
              <Image
                source={{ uri: photo.imageUrl }}
                style={styles.tileImg}
                contentFit="cover"
                transition={150}
              />
              <View style={styles.tileLabel}>
                <Text style={styles.tileDate}>{formatDate(photo.takenAt)}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {uploading && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.uploadText}>Uploading…</Text>
        </View>
      )}

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setSelected(null)} hitSlop={12}>
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>
            {selected && (
              <Pressable onPress={() => confirmDelete(selected)} hitSlop={12}>
                <Ionicons name="trash-outline" size={24} color={colors.danger} />
              </Pressable>
            )}
          </View>
          {selected && (
            <>
              <Image
                source={{ uri: selected.imageUrl }}
                style={styles.modalImg}
                contentFit="contain"
              />
              <Text style={styles.modalDate}>{formatDate(selected.takenAt)}</Text>
              {selected.note ? (
                <Text style={styles.modalNote}>{selected.note}</Text>
              ) : null}
            </>
          )}
        </View>
      </Modal>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
    padding: 18,
    paddingBottom: 50,
  },
  tile: {
    width: TILE,
    height: TILE * 1.3,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tileImg: { width: "100%", height: "100%" },
  tileLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(14,15,18,0.72)",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tileDate: { color: colors.text, fontSize: 12, fontWeight: "600" },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 8,
  },
  addBtnText: { color: colors.bg, fontSize: 15, fontWeight: "700" },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(14,15,18,0.6)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  uploadText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.94)" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  modalImg: { flex: 1, width: "100%" },
  modalDate: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 14,
  },
  modalNote: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 30,
    paddingHorizontal: 30,
  },
});
