import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Hud, HudMono } from '@/constants/hud';

// ---------------------------------------------------------------------------
// Tela de Missão Diária — ainda só o design (Figma), sem nenhuma lógica.
// Os valores abaixo são fixos só pra bater com a imagem de referência; a
// próxima etapa é ligar isso ao usePlayer()/missions de verdade (contador
// que soma, checkbox que marca, "+ ADD MISSÃO DIÁRIA" que de fato adiciona
// uma missão).
// ---------------------------------------------------------------------------

/** Uma linha da lista. `checkComplete` é o caso especial de "Squats" no
 * design: mostra um "[✓]" verde decorativo ANTES do checkbox vazio — sim,
 * os dois juntos, exatamente como está no Figma. */
interface MissionRowData {
  title: string;
  goal: string;
  checkComplete?: boolean;
}

const STATIC_MISSIONS: MissionRowData[] = [
  { title: 'Push-ups', goal: '0/100' },
  { title: 'Sit-ups', goal: '0/100' },
  { title: 'Squats', goal: '', checkComplete: true },
  { title: 'Run', goal: '0/10km' },
  { title: 'Compras', goal: 'gastar -20R' },
];

export function MissionsScreen() {
  return (
    <View style={styles.container}>
      {/* Cabeçalho — mesma linguagem visual do header do Status, mas sem
          o "•••" (não tem no design desta tela). */}
      <View style={styles.headerBox}>
        <Text style={styles.headerText}>MISSÃO DIARIA</Text>
      </View>

      <Text style={styles.questLine}>[Daily Quest: Strength Training has arrived.]</Text>

      <View style={styles.goalWrap}>
        <Text style={styles.goalText}>GOAL</Text>
        <View style={styles.goalUnderlinePrimary} />
        <View style={styles.goalUnderlineSecondary} />
      </View>

      <View style={styles.missionsList}>
        {STATIC_MISSIONS.map((mission) => (
          <View key={mission.title} style={styles.missionRow}>
            <Text style={styles.missionTitle}>{mission.title}</Text>

            <View style={styles.missionGoalGroup}>
              {mission.checkComplete ? (
                <Text style={styles.bracketText}>
                  [<Text style={styles.checkGlyph}>✓</Text>]
                </Text>
              ) : (
                <Text style={styles.bracketText}>[{mission.goal}]</Text>
              )}
              <View style={styles.checkbox} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.addRow}>
        <Feather name="plus" size={12} color={Hud.textMuted} />
        <Text style={styles.addRowText}>ADD MISSAO DIARIA</Text>
      </View>

      <View style={styles.warningBlock}>
        <Text style={styles.warningText}>
          WARNING: Failure to complete the daily quest will result in an appropriate{' '}
          <Text style={styles.warningDanger}>penalty</Text>
        </Text>
      </View>
    </View>
  );
}

const QUOTE_COLOR = '#aab6d9';
const WARNING_COLOR = '#c7d0ea';

const styles = StyleSheet.create({
  // Sem ScrollView de propósito: essa tela não deve rolar (nem pra cima
  // nem pra baixo) — o conteúdo precisa caber inteiro na área visível.
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
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
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: 4,
    textShadowColor: Hud.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },

  // Linha de "quest recebida"
  questLine: {
    fontFamily: HudMono,
    color: QUOTE_COLOR,
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 28,
    paddingHorizontal: 8,
  },

  // "GOAL" com sublinhado duplo
  goalWrap: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 30,
  },
  goalText: {
    color: Hud.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 6,
    textShadowColor: Hud.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  goalUnderlinePrimary: {
    marginTop: 5,
    width: 86,
    height: 2,
    backgroundColor: Hud.textPrimary,
  },
  goalUnderlineSecondary: {
    marginTop: 2,
    width: 86,
    height: 1,
    backgroundColor: Hud.panelBorderStrong,
  },

  // Lista de missões
  missionsList: {
    gap: 27,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  missionTitle: {
    color: Hud.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  missionGoalGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  bracketText: {
    fontFamily: HudMono,
    color: Hud.textLabel,
    fontSize: 13,
  },
  checkGlyph: {
    color: Hud.success,
    textShadowColor: Hud.success,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  checkbox: {
    width: 15,
    height: 15,
    borderWidth: 1.3,
    borderColor: Hud.textLabel,
    borderRadius: 2,
  },

  // "+ ADD MISSÃO DIÁRIA"
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 34,
    paddingVertical: 8,
  },
  addRowText: {
    color: Hud.textMuted,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  // Aviso final
  warningBlock: {
    marginTop: 60,
    // Antes usava marginLeft: '30%', que empurrava o bloco pro canto
    // direito. alignSelf + width fixa centraliza a CAIXA na tela,
    // mantendo o texto alinhado à esquerda só dentro dela — igual ao
    // design original.
    alignSelf: 'center',
    width: 230,
  },
  warningText: {
    fontFamily: HudMono,
    color: WARNING_COLOR,
    fontSize: 12.5,
    lineHeight: 19,
  },
  warningDanger: {
    color: Hud.danger,
  },
});
