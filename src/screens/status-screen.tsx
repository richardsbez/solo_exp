import { Feather } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ATTRIBUTE_DISPLAY_ORDER, ATTRIBUTE_SHORT_LABELS } from '@/constants/game';
import { Hud } from '@/constants/hud';
import { usePlayer } from '@/hooks/usePlayer';

// ---------------------------------------------------------------------------
// Tela de Status — janela do Sistema no estilo "Solo Leveling".
//
// Lê o estado real via usePlayer(): tudo que aparece aqui vem do save
// gravado no IndexedDB do aparelho. Virou um painel do HudSwipePager (ver
// app/index.tsx), então não tem mais fundo/StatusBar/barra próprios — só
// o conteúdo mesmo.
// ---------------------------------------------------------------------------

export function StatusScreen() {
  const { player, missions, loading, xpPercentage } = usePlayer();

  // Progresso das diárias de hoje. Ocupa o lugar da segunda barra do
  // design (que era "MP" mockada) com algo que de fato existe no sistema.
  const dailyProgress = useMemo(() => {
    const daily = missions.filter((mission) => mission.isDaily);
    if (daily.length === 0) return { percent: 0, done: 0, total: 0 };
    const done = daily.filter((mission) => mission.completed).length;
    return {
      percent: Math.round((done / daily.length) * 100),
      done,
      total: daily.length,
    };
  }, [missions]);

  // Enquanto o save é lido do disco, `player` é null. Mostrar um spinner
  // no mesmo fundo evita o flash de "level 1" antes dos dados reais.
  if (loading || !player) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={Hud.glow} />
        <Text style={styles.loadingText}>CARREGANDO SISTEMA</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* Cabeçalho */}
      <View style={styles.headerBox}>
        <Text style={styles.headerText}>STATUS</Text>
        <Text style={styles.headerMenu}>•••</Text>
      </View>

      {/* Nível + identidade */}
      <View style={styles.identityRow}>
        <View style={styles.levelBlock}>
          <Text style={styles.levelNumber}>{player.level}</Text>
          <Text style={styles.levelLabel}>LEVEL</Text>
        </View>

        <View style={styles.identityDetails}>
          <View style={styles.identityLine}>
            <Text style={styles.identityLabel}>NAME:</Text>
            <Text style={styles.identityValue}>{player.name}</Text>
          </View>
          <View style={styles.identityLine}>
            <Text style={styles.identityLabel}>TITLE:</Text>
            <Text style={styles.identityValue}>{player.title}</Text>
          </View>
        </View>
      </View>

      {/* Barras: XP do nível atual e diárias concluídas hoje */}
      <View style={styles.panel}>
        <View style={styles.barsRow}>
          <StatBar
            icon="trending-up"
            label="XP"
            percent={xpPercentage}
            caption={`${player.currentXP}/${player.xpToNextLevel}`}
          />
          <StatBar
            icon="check-square"
            label="DAILY"
            percent={dailyProgress.percent}
            caption={`${dailyProgress.done}/${dailyProgress.total}`}
          />
        </View>
      </View>

      {/* Grade de atributos */}
      <View style={[styles.panel, styles.statsPanel]}>
        {chunkPairs(ATTRIBUTE_DISPLAY_ORDER).map((pair, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.statsRow}>
            {pair.map((key) => (
              <StatItem
                key={key}
                label={ATTRIBUTE_SHORT_LABELS[key]}
                value={player.attributes[key]}
              />
            ))}

            {/* A lista tem 5 atributos, então sobra uma célula na
                última linha — é exatamente onde o design põe os
                pontos livres. */}
            {pair.length === 1 && (
              <View style={styles.statItem}>
                <Text style={styles.statLabelMultiline}>
                  Available{'\n'}Ability{'\n'}Points:
                </Text>
                <Text style={styles.statValue}>{player.abilityPoints}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/** Quebra a lista de atributos em pares, pra montar a grade de 2 colunas. */
function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

function StatBar({
  icon,
  label,
  percent,
  caption,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  percent: number;
  caption: string;
}) {
  return (
    <View style={styles.barCell}>
      <View style={styles.barCellTop}>
        <Feather name={icon} size={15} color={Hud.textPrimary} />
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.max(0, Math.min(100, percent))}%` }]} />
        </View>
      </View>
      <View style={styles.barBottom}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barCaption}>{caption}</Text>
      </View>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}:</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    color: Hud.textLabel,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 20,
  },

  // Cabeçalho
  headerBox: {
    borderWidth: 1,
    borderColor: Hud.panelBorder,
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: Hud.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 8,
  },
  headerMenu: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: [{ translateY: -8 }],
    color: Hud.textLabel,
    fontSize: 14,
    letterSpacing: 1,
  },

  // Nível + identidade
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 24,
  },
  levelBlock: {
    alignItems: 'center',
  },
  levelNumber: {
    color: Hud.textPrimary,
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 66,
    textShadowColor: Hud.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  levelLabel: {
    color: Hud.textLabel,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    marginTop: 2,
  },
  identityDetails: {
    gap: 10,
  },
  identityLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  identityLabel: {
    color: Hud.textLabel,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  identityValue: {
    color: Hud.textPrimary,
    fontSize: 17,
    fontWeight: '500',
  },

  // Painéis genéricos (bordas iguais em toda a tela)
  panel: {
    borderWidth: 1,
    borderColor: Hud.panelBorder,
    borderRadius: 4,
    padding: 20,
  },

  // Barras
  barsRow: {
    flexDirection: 'row',
  },
  barCell: {
    flex: 1,
  },
  barCellTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 12,
  },
  barTrack: {
    flex: 1,
    height: 2,
    backgroundColor: Hud.barTrack,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Hud.barFill,
    borderRadius: 2,
  },
  barBottom: {
    marginTop: 10,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  barLabel: {
    color: Hud.textLabel,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  barCaption: {
    color: Hud.textLabel,
    fontSize: 10,
    fontWeight: '500',
  },

  // Grade de atributos
  statsPanel: {
    gap: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statLabel: {
    color: Hud.textLabel,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  statLabelMultiline: {
    color: Hud.textLabel,
    fontSize: 8.5,
    fontWeight: '600',
    letterSpacing: 0.8,
    lineHeight: 11,
    textTransform: 'uppercase',
  },
  statValue: {
    color: Hud.textPrimary,
    fontSize: 21,
    fontWeight: '700',
    textShadowColor: Hud.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
