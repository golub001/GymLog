import { Text, View } from "react-native";
import { colors } from "../../theme/colors";

export default function Plans() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bg,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>
        Plans
      </Text>
    </View>
  );
}