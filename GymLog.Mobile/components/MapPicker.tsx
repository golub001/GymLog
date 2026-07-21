import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { colors } from "../theme/colors";

type Pin = { lat: number; lng: number };

type Props = {
  visible: boolean;
  title?: string;
  readOnly?: boolean;
  initial?: Pin | null;
  onClose: () => void;
  onPick?: (pin: Pin) => void;
};

const DEFAULT_CENTER: Pin = { lat: 44.0128, lng: 20.9114 };

function buildHtml(initial: Pin | null, readOnly: boolean): string {
  const center = initial ?? DEFAULT_CENTER;
  const zoom = initial ? 15 : 13;
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; background: #0E0F12; }
  .leaflet-control-attribution { font-size: 9px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: true }).setView([${center.lat}, ${center.lng}], ${zoom});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  var marker = null;
  ${initial ? `marker = L.marker([${initial.lat}, ${initial.lng}]).addTo(map);` : ""}

  ${
    readOnly
      ? ""
      : `map.on('click', function(e) {
    if (marker) { marker.setLatLng(e.latlng); }
    else { marker = L.marker(e.latlng).addTo(map); }
    window.ReactNativeWebView.postMessage(JSON.stringify({
      lat: e.latlng.lat, lng: e.latlng.lng
    }));
  });`
  }
</script>
</body>
</html>`;
}

export default function MapPicker({
  visible,
  title,
  readOnly = false,
  initial = null,
  onClose,
  onPick,
}: Props) {
  const [pin, setPin] = useState<Pin | null>(initial);

  useEffect(() => {
    if (visible) setPin(initial ?? null);
  }, [visible]);

  function openExternal() {
    if (!pin) return;
    const geo = `geo:${pin.lat},${pin.lng}?q=${pin.lat},${pin.lng}`;
    Linking.openURL(geo).catch(() =>
      Linking.openURL(
        `https://www.openstreetmap.org/?mlat=${pin.lat}&mlon=${pin.lng}#map=16/${pin.lat}/${pin.lng}`
      ).catch(() => {})
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {title ?? (readOnly ? "Location" : "Pick a location")}
          </Text>
          <View style={{ width: 26 }} />
        </View>

        {!readOnly && (
          <Text style={styles.hint}>Tap the map to drop a pin.</Text>
        )}

        <WebView
          key={visible ? "open" : "closed"}
          style={styles.map}
          originWhitelist={["*"]}
          source={{ html: buildHtml(initial, readOnly) }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (typeof data.lat === "number" && typeof data.lng === "number") {
                setPin({ lat: data.lat, lng: data.lng });
              }
            } catch {}
          }}
        />

        <View style={styles.footer}>
          {readOnly ? (
            <Pressable style={styles.confirmBtn} onPress={openExternal}>
              <Ionicons name="navigate" size={16} color={colors.bg} />
              <Text style={styles.confirmText}>Open in Maps</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.confirmBtn, !pin && { opacity: 0.45 }]}
              disabled={!pin}
              onPress={() => pin && onPick?.(pin)}
            >
              <Ionicons name="checkmark" size={17} color={colors.bg} />
              <Text style={styles.confirmText}>
                {pin ? "Use this location" : "Tap the map first"}
              </Text>
            </Pressable>
          )}
        </View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  hint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 6,
  },
  map: { flex: 1 },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
  },
  confirmText: { color: colors.bg, fontSize: 15, fontWeight: "700" },
});
