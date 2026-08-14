import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { NeonGlow, NeonTextGlow, SoloColors, SoloSpacing } from '@/constants/solo-theme';
import { ThemedText } from '@/components/themed-text';

interface NeonXpBarProps {
  /** 0–100, já calculado pelo usePlayer(). */
  percentage: number;
  currentXP: number;
  xpToNextLevel: number;
}

/**
 * Barra "vazada" (contorno neon + trilho escuro) com preenchimento
 * interno proporcional ao XP — mesma linguagem visual das barras de HP/MP
 * das imagens de referência, só que aqui representa XP.
 *
 * O preenchimento anima com Reanimated (withTiming numa width simples, sem
 * gesto envolvido), então funciona bem tanto nativo quanto no target web.
 */
export function NeonXpBar({ percentage, currentXP, xpToNextLevel }: NeonXpBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withTiming(clamped, { duration: 500 });
  }, [clamped, fillWidth]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%`,
  }));

  return (
    <View style={styles.row}>
      <ThemedText type="smallBold" style={[styles.label, NeonTextGlow]}>
        XP
      </ThemedText>

      <View style={[styles.track, NeonGlow.soft]}>
        <Animated.View style={[styles.fill, animatedFillStyle]} />
      </View>

      <ThemedText type="small" style={styles.value}>
        {currentXP}/{xpToNextLevel}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SoloSpacing.sm,
  },
  label: {
    color: SoloColors.textPrimary,
    width: 28,
  },
  track: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: SoloColors.neonPrimary,
    backgroundColor: SoloColors.barTrack,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    minWidth: 4,
    borderRadius: 6,
    backgroundColor: SoloColors.barFillStart,
  },
  value: {
    color: SoloColors.textSecondary,
    minWidth: 68,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
