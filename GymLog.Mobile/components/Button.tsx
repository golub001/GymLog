import { Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
};

export default function Button({ title, onPress, variant = "primary" }: ButtonProps) {
  const isGhost = variant === "ghost";

  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, isGhost ? styles.ghost : styles.primary]}
    >
      <Text style={[styles.text, isGhost ? styles.ghostText : styles.primaryText]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primary: {
    backgroundColor: colors.accent,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.line,
  },
  text: {
    fontSize: 14,
    fontWeight: "bold",
  },
  primaryText: {
    color: colors.bg,
  },
  ghostText: {
    color: colors.text,
  },
});