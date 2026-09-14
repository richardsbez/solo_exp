import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ---------------------------------------------------------------------------
// Tela de Status — reproduz o design do Figma (janela de status estilo
// "Solo Leveling"). Escopo puramente visual: os dados abaixo são mockados,
// sem nenhuma leitura do usePlayer() ainda. Isso entra numa próxima etapa,
// quando ligarmos esse componente ao hook real.
// ---------------------------------------------------------------------------

const mockPlayer = {
  level: 18,
  name: 'Steve',
  title: 'Romano',
  strBarPercent: 15,
  mpBarPercent: 70,
  stats: {
    str: 17,
    agi: 3,
    per: 3,
    vit: 2,
    int: 333,
  },
  abilityPoints: 3,
};

// Paleta fixa desse HUD — intencionalmente não segue o Colors claro/escuro
// do app (constants/theme.ts). É a "janela do sistema", sempre escura,
// igual no anime, independente do tema do dispositivo.
const Hud = {
  background: '#05070d',
  panelBorder: 'rgba(150, 190, 255, 0.28)',
  textPrimary: '#e7edff',
  textLabel: '#8ea0c9',
  glow: '#6fa8ff',
  barTrack: 'rgba(150, 190, 255, 0.16)',
  barFill: '#e7edff',
};

export default function StatusScreen() {
  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
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
              <Text style={styles.levelNumber}>{mockPlayer.level}</Text>
              <Text style={styles.levelLabel}>LEVEL</Text>
            </View>

            <View style={styles.identityDetails}>
              <View style={styles.identityLine}>
                <Text style={styles.identityLabel}>NAME:</Text>
                <Text style={styles.identityValue}>{mockPlayer.name}</Text>
              </View>
              <View style={styles.identityLine}>
                <Text style={styles.identityLabel}>TITLE:</Text>
                <Text style={styles.identityValue}>{mockPlayer.title}</Text>
              </View>
            </View>
          </View>

          {/* Barras STR / MP */}
          <View style={styles.panel}>
            <View style={styles.barsRow}>
              <StatBar icon="plus" label="STR" percent={mockPlayer.strBarPercent} />
              <StatBar icon="zap" label="MP" percent={mockPlayer.mpBarPercent} />
            </View>
          </View>

          {/* Grade de atributos */}
          <View style={[styles.panel, styles.statsPanel]}>
            <View style={styles.statsRow}>
              <StatItem label="STR" value={mockPlayer.stats.str} />
              <StatItem label="VIT" value={mockPlayer.stats.vit} />
            </View>
            <View style={styles.statsRow}>
              <StatItem label="AGI" value={mockPlayer.stats.agi} />
              <StatItem label="INT" value={mockPlayer.stats.int} />
            </View>
            <View style={styles.statsRow}>
              <StatItem label="PER" value={mockPlayer.stats.per} />
              <View style={styles.statItem}>
                <Text style={styles.statLabelMultiline}>
                  Available{'\n'}Ability{'\n'}Points:
                </Text>
                <Text style={styles.statValue}>{mockPlayer.abilityPoints}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Barra inferior — só visual por enquanto, sem navegação real */}
        <View style={styles.bottomNav}>
          <Feather name="square" size={22} color={Hud.textPrimary} style={styles.diamondIcon} />
          <Feather name="check-square" size={22} color={Hud.textPrimary} />
          <Feather name="calendar" size={22} color={Hud.textPrimary} />
          <Feather name="message-circle" size={22} color={Hud.textPrimary} />
          <Feather name="shopping-cart" size={22} color={Hud.textPrimary} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function StatBar({
  icon,
  label,
  percent,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  percent: number;
}) {
  return (
    <View style={styles.barCell}>
      <View style={styles.barCellTop}>
        <Feather name={icon} size={15} color={Hud.textPrimary} />
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${percent}%` }]} />
        </View>
      </View>
      <Text style={styles.barLabel}>{label}</Text>
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
  screen: {
    flex: 1,
    backgroundColor: Hud.background,
  },
  safeArea: {
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

  // Barras STR / MP
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
  barLabel: {
    marginTop: 10,
    color: Hud.textLabel,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
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

  // Barra de navegação inferior
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  diamondIcon: {
    transform: [{ rotate: '45deg' }],
  },
});
