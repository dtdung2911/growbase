import { formatVND } from "@growbase/shared/rules/currency"
import { StyleSheet, Text, View } from "react-native"

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>GrowBase Mobile</Text>
      <Text style={styles.amount}>{formatVND(1_250_000)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  amount: {
    fontSize: 16,
    fontVariant: ["tabular-nums"],
  },
})
