import { useState } from "react";
import { TextInput, View, Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

type InputProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
};

export default function Input({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
}: InputProps) {
  const [hidden, setHidden] = useState(true);
  const isPassword = !!secureTextEntry;

  if (!isPassword) {
    return (
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
      />
    );
  }

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={styles.inputInner}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={hidden}
      />
      <Pressable onPress={() => setHidden((h) => !h)} style={styles.toggleBtn}>
        <Text style={styles.toggleText}>{hidden ? "Show" : "Hide"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 13,
    color: colors.text,
    marginBottom: 10,
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    marginBottom: 10,
  },
  inputInner: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 13,
    color: colors.text,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  toggleText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "600",
  },
});