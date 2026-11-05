/**
 * Skeleton — placeholder shown while data loads. The mobile counterpart of the
 * web `~/_components/ui/skeleton`.
 *
 * Every screen that fetches data renders skeletons shaped like its content
 * while `isPending` (never a blank screen or a lone spinner), so the layout
 * appears instantly and doesn't jump when data arrives. See the `add-feature`
 * skill.
 *
 *   {isPending ? <Skeleton width="60%" height={20} /> : <Text>{title}</Text>}
 */
import type { DimensionValue, StyleProp, ViewStyle } from "react-native";
import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors } from "~/styles";

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  /** Corner radius; pass `height / 2` for a pill or a circle. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = "100%",
  height = 16,
  radius = 6,
  style,
}: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Pulse on the UI thread; stay static when the user asked for less motion.
    if (!reduceMotion) {
      opacity.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);
    }
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.gray[200],
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
