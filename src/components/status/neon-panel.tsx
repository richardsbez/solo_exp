import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { NeonGlow, SoloColors } from '@/constants/solo-theme';

const BRACKET_SIZE = 16;
const BRACKET_THICKNESS = 2;

type Corner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

/** Um "L" neon no canto do painel — é isso que dá a sensação de HUD
 * holográfico recortado, em vez de uma caixa comum com borda. */
function CornerBracket({ corner }: { corner: Corner }) {
  const isTop = corner === 'topLeft' || corner === 'topRight';
  const isLeft = corner === 'topLeft' || corner === 'bottomLeft';

  return (
    <View
      pointerEvents="none"
      style={[
        styles.bracket,
        isTop ? { top: -1 } : { bottom: -1 },
        isLeft ? { left: -1 } : { right: -1 },
      ]}>
      <View
        style={[
          styles.bracketLine,
          { width: BRACKET_SIZE, height: BRACKET_THICKNESS },
          isTop ? { top: 0 } : { bottom: 0 },
          isLeft ? { left: 0 } : { right: 0 },
        ]}
      />
      <View
        style={[
          styles.bracketLine,
          { width: BRACKET_THICKNESS, height: BRACKET_SIZE },
          isTop ? { top: 0 } : { bottom: 0 },
          isLeft ? { left: 0 } : { right: 0 },
        ]}
      />
    </View>
  );
}

interface NeonPanelProps extends PropsWithChildren {
  style?: ViewStyle | ViewStyle[];
  /** Painel "cheio" tem glow mais forte — usado no card principal. */
  intensity?: 'soft' | 'strong';
}

/** Container base reutilizado por toda a tela de Status: fundo translúcido,
 * borda fina neon, glow externo e cantos em bracket estilo HUD. */
export function NeonPanel({ children, style, intensity = 'soft' }: NeonPanelProps) {
  return (
    <View style={[styles.panel, NeonGlow[intensity], style]}>
      <CornerBracket corner="topLeft" />
      <CornerBracket corner="topRight" />
      <CornerBracket corner="bottomLeft" />
      <CornerBracket corner="bottomRight" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: SoloColors.neonPrimaryDim,
    backgroundColor: SoloColors.panelFill,
    borderRadius: 6,
    position: 'relative',
  },
  bracket: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
  },
  bracketLine: {
    position: 'absolute',
    backgroundColor: SoloColors.neonPrimary,
  },
});
