import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { colors } from "../theme/colors";
import { API_HOST } from "../services/api";

type AvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
};

export default function Avatar({ name, avatarUrl, size = 44 }: AvatarProps) {
  const radius = size / 2;
  const initial = (name?.trim()?.charAt(0) || "?").toUpperCase();

  if (avatarUrl) {
    const uri = avatarUrl.startsWith("http")
      ? avatarUrl
      : `${API_HOST}${avatarUrl}`;
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.surface2,
        }}
        contentFit="cover"
        transition={120}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <Text style={{ color: colors.accent, fontSize: size * 0.4, fontWeight: "800" }}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
});
