import { Feather } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { HudPressable } from '@/components/hud-pressable';
import { StepButton } from '@/components/hud-stepper';
import { MissionEditorSheet } from '@/components/mission-editor-sheet';
import { Hud, HudMono } from '@/constants/hud';
import { useDailyMissions } from '@/hooks/useDailyMissions';
import {
  clamp,
  createMissionId,
  formatCountConfig,
  getLinkedGroup,
  getProgressStep,
  isCounter,
  type DailyMission,
} from '@/types/mission-editor';

// ---------------------------------------------------------------------------
// Tela de Missão Diária.
//
// As missões são salvas no storage do aparelho (IndexedDB no PWA) a cada
// alteração — criar, editar, excluir, marcar e mexer no +/-. Ver
// hooks/useDailyMissions.ts. O modelo (DailyMission, em
// types/mission-editor.ts) ainda é separado do Mission antigo usado pelo
// Status/usePlayer.
// ---------------------------------------------------------------------------

export function MissionsScreen() {
  const { missions, setMissions, loaded } = useDailyMissions();
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

    setMissions((prev) => {
      const group = getLinkedGroup(prev, mission);
      return prev.map((m) => {
        if (!group.has(m.id)) return m;

        if (m.count.method === 'check') {
          return { ...m, completed, count: { ...m.count, checked: completed } };
        }
        if (isCounter(m.count)) {
          const progress = completed ? (m.count.target ?? 0) : 0;
          return { ...m, completed, count: { ...m.count, progress } };
        }
        // "text": só o status muda — não tem progresso pra mexer.
        return { ...m, completed };
      });
    });
  };

  /** +/- do progresso. Missões vinculadas andam juntas; bater na meta
   * conclui sozinho, e voltar abaixo dela reabre. */
  const adjustProgress = (mission: DailyMission, direction: 1 | -1) => {
    const target = mission.count.target ?? 0;
    const step = getProgressStep(mission.count);
    const nextProgress = clamp((mission.count.progress ?? 0) + direction * step, 0, target);
    const done = target > 0 && nextProgress >= target;

    setMissions((prev) => {
      const group = getLinkedGroup(prev, mission);
      return prev.map((m) => {
        if (!group.has(m.id)) return m;

        if (isCounter(m.count)) {
          const ownTarget = m.count.target ?? 0;
          const progress = Math.min(nextProgress, ownTarget);
          return {
            ...m,
            completed: ownTarget > 0 && progress >= ownTarget,
            count: { ...m.count, progress },
          };
        }
        if (m.count.method === 'check') {
          return { ...m, completed: done, count: { ...m.count, checked: done } };
        }
        return { ...m, completed: done };
      });
    });
  };

  const hasOpenAction = actionRowId !== null;

  // Enquanto o save é lido do disco, evita mostrar a lista vazia (e deixar
  // o usuário criar uma missão que o load logo em seguida sobrescreveria).
  if (!loaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Hud.glow} />
      </View>
    );
  }

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
            onAdjustProgress={(direction) => adjustProgress(mission, direction)}
            onDismissActions={() => setActionRowId(null)}
            onEdit={() => openEdit(mission)}
            onDelete={() => handleDelete(mission.id)}
          />
        ))}
      </View>

      <HudPressable style={styles.addRow} onPress={openCreate}>
        <Feather name="plus" size={12} color={Hud.textMuted} />
        <Text style={styles.addRowText}>ADD MISSAO DIARIA</Text>
      </HudPressable>

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
  onAdjustProgress,
  onDismissActions,
  onEdit,
  onDelete,
}: {
  mission: DailyMission;
  isActionMode: boolean;
  hasOtherActionOpen: boolean;
  onLongPress: () => void;
  onPressCheckbox: () => void;
  onAdjustProgress: (direction: 1 | -1) => void;
  onDismissActions: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // A barra de editar/excluir substitui a linha inteira, no lugar dela.
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

  const isCheck = mission.count.method === 'check';
  const counter = isCounter(mission.count);
  const target = mission.count.target ?? 0;
  const progress = mission.count.progress ?? 0;

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={2000}
      onPress={hasOtherActionOpen ? onDismissActions : undefined}
      style={styles.missionRow}>
      <Text style={styles.missionTitle} numberOfLines={1}>
        {mission.title}
      </Text>

      <View style={styles.missionGoalGroup}>
        {counter && !hasOtherActionOpen && (
          <StepButton
            kind="minus"
            size={18}
            disabled={progress <= 0}
            onPress={() => onAdjustProgress(-1)}
          />
        )}
        {!isCheck && <Text style={styles.bracketText}>[{formatCountConfig(mission.count)}]</Text>}
        {counter && !hasOtherActionOpen && (
          <StepButton
            kind="plus"
            size={18}
            disabled={progress >= target}
            onPress={() => onAdjustProgress(1)}
          />
        )}
        <Checkbox
          checked={mission.completed}
          onPress={hasOtherActionOpen ? onDismissActions : onPressCheckbox}
        />
      </View>
    </Pressable>
  );
}

/** Checkbox com um "pulinho" (escala 1 → 1.25 → 1) ao mudar de estado —
 * confirma o toque na hora, sem esperar nada re-renderizar. Não anima na
 * primeira montagem. */
function Checkbox({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.25,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [checked, scale]);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}>
      <Animated.View
        style={[styles.checkbox, checked && styles.checkboxChecked, { transform: [{ scale }] }]}>
        {checked && <Text style={styles.checkboxMark}>✓</Text>}
      </Animated.View>
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

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    // Altura mínima fixa: a linha não "pula" quando os botões +/- somem
    // (ao abrir a barra de ações de outra missão).
    minHeight: 22,
  },
  missionTitle: {
    flexShrink: 1,
    color: Hud.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    marginRight: 8,
  },
  missionGoalGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
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
    marginLeft: 2,
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
