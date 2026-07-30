import { useState } from "react";
import {
  TextInput,
  View,
  Pressable,
  Text,
  StyleSheet,
  KeyboardTypeOptions,
} from "react-native";
import { colors } from "../theme/colors";

type InputProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

export default function Input({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
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
        keyboardType={keyboardType}
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
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    height: 52,
    marginBottom: 12,
  },
  inputInner: {
    flex: 1,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    height: 52,
    justifyContent: "center",
  },
  toggleText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
});