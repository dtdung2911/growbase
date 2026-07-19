import { useEffect, useRef } from "react"
import { Animated, StyleSheet, View, type DimensionValue } from "react-native"
import { useTheme } from "@/lib/theme/ThemeProvider"

type SkeletonProps = {
  width?: DimensionValue
  height?: number
  radius?: number
}

export function Skeleton({ width = "100%", height = 16, radius = 8 }: SkeletonProps) {
  const { colors } = useTheme()
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return (
    <Animated.View
      style={{ width, height, borderRadius: radius, backgroundColor: colors.border, opacity }}
    />
  )
}

export function TransactionRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={44} height={44} radius={22} />
      <View style={styles.middle}>
        <Skeleton width="55%" height={14} />
        <Skeleton width="35%" height={11} />
      </View>
      <Skeleton width={72} height={14} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  middle: {
    flex: 1,
    gap: 8,
  },
})
