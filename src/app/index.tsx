import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AttributeCell } from '@/components/status/attribute-cell';
import { NeonPanel } from '@/components/status/neon-panel';
import { NeonXpBar } from '@/components/status/neon-xp-bar';
import { ThemedText } from '@/components/themed-text';
import { NeonTextGlow, SoloColors, SoloSpacing } from '@/constants/solo-theme';
import { MaxContentWidth } from '@/constants/theme';
import { usePlayer } from '@/hooks/usePlayer';
import type { AttributeKey } from '@/types/game';

/** Ordem de exibição na grade: pares (esquerda/direita) seguindo o padrão
 * das imagens de referência — STR/VIT na primeira linha, AGI/INT na
 * segunda, e PER sozinho (ímpar) ocupando a linha inteira por último. */
const ATTRIBUTE_DISPLAY_ORDER: AttributeKey[] = [
  'strength',
  'vitality',
  'agility',
  'intelligence',
  'perception',
];

export default function StatusScreen() {
  const { player, loading, xpPercentage } = usePlayer();

  if (loading || !player) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={SoloColors.neonPrimary} size="large" />
      </View>
    );
  }

  const xpRemaining = Math.max(0, player.xpToNextLevel - player.currentXP);

  return (
    <View style={styles.screen}>
      {/* Glow ambiente no topo — só decorativo, não interfere no layout. */}
      <View pointerEvents="none" style={styles.ambientGlow} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <NeonPanel intensity="strong" style={styles.mainPanel}>
            {/* Header: título "STATUS" com divisor, igual ao padrão das
                caixas de notificação nas imagens de referência. */}
            <View style={styles.headerRow}>
              <ThemedText style={styles.headerDot}>◆</ThemedText>
              <ThemedText type="smallBold" style={[styles.headerTitle, NeonTextGlow]}>
                STATUS
              </ThemedText>
            </View>
            <View style={styles.divider} />

            {/* Identidade: nível em destaque + nome / próxima evolução. */}
            <View style={styles.identityRow}>
              <View style={styles.levelBlock}>
                <ThemedText style={[styles.levelNumber, NeonTextGlow]}>{player.level}</ThemedText>
                <ThemedText type="small" style={styles.levelCaption}>
                  LEVEL
                </ThemedText>
              </View>

              <View style={styles.identityDetails}>
                <View style={styles.identityLine}>
                  <ThemedText type="small" style={styles.identityLabel}>
                    CAÇADOR
                  </ThemedText>
                  <ThemedText type="smallBold" style={styles.identityValue} numberOfLines={1}>
                    {player.name}
                  </ThemedText>
                </View>
                <View style={styles.identityLine}>
                  <ThemedText type="small" style={styles.identityLabel}>
                    PRÓXIMA EVOLUÇÃO
                  </ThemedText>
                  <ThemedText type="smallBold" style={styles.identityValue}>
                    {xpRemaining} XP
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Barra de XP — estilo "vazado" das barras de HP/MP de
                referência, preenchimento animado via Reanimated. */}
            <NeonXpBar
              percentage={xpPercentage}
              currentXP={player.currentXP}
              xpToNextLevel={player.xpToNextLevel}
            />

            <View style={styles.divider} />

            {/* Grade de atributos, 2 colunas. */}
            <View style={styles.attributeGrid}>
              {ATTRIBUTE_DISPLAY_ORDER.map((key, index) => (
                <AttributeCell
                  key={key}
                  attribute={key}
                  value={player.attributes[key]}
                  fullWidth={index === ATTRIBUTE_DISPLAY_ORDER.length - 1}
                />
              ))}
            </View>
          </NeonPanel>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SoloColors.backgroundBase,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    top: -120,
    left: '50%',
    marginLeft: -180,
    width: 360,
    height: 240,
    borderRadius: 180,
    backgroundColor: SoloColors.neonPrimary,
    opacity: 0.08,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SoloSpacing.md,
    paddingVertical: SoloSpacing.lg,
  },
  mainPanel: {
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: SoloSpacing.lg,
    gap: SoloSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SoloSpacing.xs,
  },
  headerDot: {
    color: SoloColors.neonPrimary,
    fontSize: 10,
  },
  headerTitle: {
    color: SoloColors.textPrimary,
    letterSpacing: 4,
  },
  divider: {
    height: 1,
    backgroundColor: SoloColors.neonPrimaryDim,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SoloSpacing.md,
  },
  levelBlock: {
    alignItems: 'center',
    minWidth: 72,
  },
  levelNumber: {
    color: SoloColors.textPrimary,
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 48,
  },
  levelCaption: {
    color: SoloColors.textSecondary,
    letterSpacing: 2,
  },
  identityDetails: {
    flex: 1,
    gap: SoloSpacing.xs,
  },
  identityLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  identityLabel: {
    color: SoloColors.textMuted,
    letterSpacing: 0.5,
  },
  identityValue: {
    color: SoloColors.textPrimary,
  },
  attributeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: '4%',
  },
});
