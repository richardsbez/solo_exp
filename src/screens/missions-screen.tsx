import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MissionEditorSheet } from '@/components/mission-editor-sheet';
import { Hud, HudMono } from '@/constants/hud';
import { createMissionId, formatCountConfig, type DailyMission } from '@/types/mission-editor';

// ---------------------------------------------------------------------------
// Tela de Missão Diária.
//
// Estado 100% local (useState) por enquanto — ainda não persiste no
// IndexedDB nem está ligada ao usePlayer()/Status. O modelo de missão
// daqui (DailyMission, em types/mission-editor.ts) é mais rico que o
// Mission antigo do usePlayer/storage.ts: categoria PRINCIPAL/SECUNDARIA/
// DIARIA, XP por atributo individual, coins, e vínculo de progresso entre
// missões. É intencional — plugar isso no save de verdade é a próxima
// etapa, depois desse modelo novo validado na tela.
// ---------------------------------------------------------------------------

const DEFAULT_MISSIONS: DailyMission[] = [
  {
    id: 'seed-situps',
    title: 'Sit-ups',
    category: 'diaria',
    attributes: { strength: 1, agility: 0, intelligence: 0, vitality: 0, perception: 0 },
    abilityPoints: 0,
    rewards: { coins: 5, xp: 20 },
    count: { method: 'numeric', target: 100, progress: 0 },
    linkedMissionIds: [],
    completed: false,
  },
  {
    id: 'seed-squats',
    title: 'Squats',
    category: 'diaria',
    attributes: { strength: 1, agility: 0, intelligence: 0, vitality: 0, perception: 0 },
    abilityPoints: 0,
    rewards: { coins: 5, xp: 20 },
    count: { method: 'check', checked: true },
    linkedMissionIds: [],
    completed: true,
  },
  {
    id: 'seed-run',
    title: 'Run',
    category: 'diaria',
    attributes: { strength: 0, agility: 1, intelligence: 0, vitality: 0, perception: 0 },
    abilityPoints: 0,
    rewards: { coins: 10, xp: 40 },
    count: { method: 'distance', target: 10, progress: 0 },
    linkedMissionIds: [],
    completed: false,
  },
  {
    id: 'seed-compras',
    title: 'Compras',
    category: 'diaria',
    attributes: { strength: 0, agility: 0, intelligence: 1, vitality: 0, perception: 0 },
    abilityPoints: 0,
    rewards: { coins: 0, xp: 10 },
    count: { method: 'text', text: 'gastar -20R' },
    linkedMissionIds: [],
    completed: false,
  },
];

export function MissionsScreen() {
  const [missions, setMissions] = useState<DailyMission[]>(DEFAULT_MISSIONS);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingMission, setEditingMission] = useState<DailyMission | null>(null);
  /** Id da missão com a barra de editar/excluir aberta (long-press de 2s). */
  const [actionRowId, setActionRowId] = useState<string | null>(null);

  const openCreate = () => {
    setActionRowId(null);
    setEditingMission(null);
    setEditorVisible(true);
  };

  const openEdit = (mission: DailyMission) => {
    setActionRowId(null);
    setEditingMission(mission);
    setEditorVisible(true);
  };

  const handleDelete = (missionId: string) => {
    setActionRowId(null);
    setMissions((prev) =>
      prev
        .filter((m) => m.id !== missionId)
        // Remove o vínculo em qualquer outra missão que apontava pra essa,
        // pra não sobrar um id órfão em linkedMissionIds.
        .map((m) => ({
          ...m,
          linkedMissionIds: m.linkedMissionIds.filter((id) => id !== missionId),
        }))
    );
  };

  const handleConfirm = (mission: DailyMission) => {
    setMissions((prev) => {
      if (mission.id) {
        return prev.map((m) => (m.id === mission.id ? mission : m));
      }
      return [...prev, { ...mission, id: createMissionId() }];
    });
  };

  /** Marca/desmarca a missão — e junto qualquer outra vinculada a ela
   * (compartilham o mesmo progresso, ver "CONECTAR As" no editor). */
  const toggleComplete = (mission: DailyMission) => {
    const completed = !mission.completed;
    const groupIds = new Set([mission.id, ...mission.linkedMissionIds]);

    setMissions((prev) =>
      prev.map((m) => {
        const inGroup = groupIds.has(m.id) || m.linkedMissionIds.includes(mission.id);
        if (!inGroup) return m;

        return {
          ...m,
          completed,
          count:
            m.count.method === 'check'
              ? { ...m.count, checked: completed }
              : { ...m.count, progress: completed ? (m.count.target ?? 0) : 0 },
        };
      })
    );
  };

  const hasOpenAction = actionRowId !== null;

  return (
    <View style={styles.container}>
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
        {missions.map((mission) => (
          <MissionRow
            key={mission.id}
            mission={mission}
            isActionMode={actionRowId === mission.id}
            hasOtherActionOpen={hasOpenAction && actionRowId !== mission.id}
            onLongPress={() => setActionRowId(mission.id)}
            onPressCheckbox={() => toggleComplete(mission)}
            onDismissActions={() => setActionRowId(null)}
            onEdit={() => openEdit(mission)}
            onDelete={() => handleDelete(mission.id)}
          />
        ))}
      </View>

      <Pressable style={styles.addRow} onPress={openCreate}>
        <Feather name="plus" size={12} color={Hud.textMuted} />
        <Text style={styles.addRowText}>ADD MISSAO DIARIA</Text>
      </Pressable>

      <View style={styles.warningBlock}>
        <Text style={styles.warningText}>
          WARNING: Failure to complete the daily quest will result in an appropriate{' '}
          <Text style={styles.warningDanger}>penalty</Text>
        </Text>
      </View>

      <MissionEditorSheet
        visible={editorVisible}
        editingMission={editingMission}
        allMissions={missions}
        onClose={() => setEditorVisible(false)}
        onConfirm={handleConfirm}
      />
    </View>
  );
}

function MissionRow({
  mission,
  isActionMode,
  hasOtherActionOpen,
  onLongPress,
  onPressCheckbox,
  onDismissActions,
  onEdit,
  onDelete,
}: {
  mission: DailyMission;
  isActionMode: boolean;
  hasOtherActionOpen: boolean;
  onLongPress: () => void;
  onPressCheckbox: () => void;
  onDismissActions: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // A barra de editar/excluir substitui a linha inteira, no lugar dela —
  // não abre por cima, é a própria linha que muda de conteúdo.
  if (isActionMode) {
    return (
      <View style={styles.actionBar}>
        <Pressable style={styles.actionButton} onPress={onEdit} hitSlop={8}>
          <Feather name="edit-2" size={16} color={Hud.textPrimary} />
        </Pressable>
        <View style={styles.actionDivider} />
        <Pressable style={styles.actionButton} onPress={onDelete} hitSlop={8}>
          <Feather name="x" size={18} color={Hud.danger} />
        </Pressable>
      </View>
    );
  }

  // Método "check" já é o próprio checkbox — sem o "[✓]" decorativo
  // duplicado que aparecia antes.
  const isCheck = mission.count.method === 'check';

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={2000}
      onPress={hasOtherActionOpen ? onDismissActions : undefined}
      style={styles.missionRow}>
      <Text style={styles.missionTitle}>{mission.title}</Text>

      <View style={styles.missionGoalGroup}>
        {!isCheck && <Text style={styles.bracketText}>[{formatCountConfig(mission.count)}]</Text>}
        <Pressable
          onPress={hasOtherActionOpen ? onDismissActions : onPressCheckbox}
          style={[styles.checkbox, mission.completed && styles.checkboxChecked]}>
          {mission.completed && <Text style={styles.checkboxMark}>✓</Text>}
        </Pressable>
      </View>
    </Pressable>
  );
}

const QUOTE_COLOR = '#aab6d9';
const WARNING_COLOR = '#c7d0ea';

const styles = StyleSheet.create({
  // Sem ScrollView de propósito: essa tela não deve rolar — o conteúdo
  // precisa caber inteiro na área visível.
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
  checkbox: {
    width: 15,
    height: 15,
    borderWidth: 1.3,
    borderColor: Hud.textLabel,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: Hud.success,
  },
  checkboxMark: {
    color: Hud.success,
    fontSize: 11,
    lineHeight: 12,
    textShadowColor: Hud.success,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },

  // Barra de editar/excluir (substitui a linha durante o long-press)
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Hud.panelBorder,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDivider: {
    width: 1,
    height: '70%',
    backgroundColor: Hud.panelBorder,
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
