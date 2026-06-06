import { useRef } from "react";
import { Pressable, Text, StyleSheet, Animated } from "react-native";
import { colors } from "../theme/colors";

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
};

export default function Button({ title, onPress, variant = "primary" }: ButtonProps) {
  const isGhost = variant === "ghost";
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  }

  function pressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.base, isGhost ? styles.ghost : styles.primary]}
      >
        <Text style={[styles.text, isGhost ? styles.ghostText : styles.primaryText]}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
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
