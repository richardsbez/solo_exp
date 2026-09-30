import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HudSheet } from '@/components/hud-sheet';
import { Hud, HudMono } from '@/constants/hud';
import { formatCountConfig, type DailyMission } from '@/types/mission-editor';

interface MissionConnectSheetProps {
  visible: boolean;
  missions: DailyMission[];
  /** Missão sendo editada — não pode se conectar a si mesma. */
  excludeMissionId?: string;
  initialSelectedIds: string[];
  onClose: () => void;
  onSelect: (missionIds: string[]) => void;
}

/** Submenu "Selecione As Missões Que Compartilharão O Mesmo Progresso".
 * Multi-seleção — uma missão pode compartilhar progresso com várias
 * outras ao mesmo tempo. */
export function MissionConnectSheet({
  visible,
  missions,
  excludeMissionId,
  initialSelectedIds,
  onClose,
  onSelect,
}: MissionConnectSheetProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  useEffect(() => {
    if (visible) setSelectedIds(initialSelectedIds);
  }, [visible, initialSelectedIds]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Uma missão nova (ainda sem id) não existe na lista de fora, então
  // não precisa de exclusão — mas uma em edição não pode apontar pra si
  // mesma.
  const candidates = missions.filter((mission) => mission.id !== excludeMissionId);

  return (
    <HudSheet visible={visible} onRequestClose={onClose}>
      <Text style={styles.title}>
        Selecione As Missões Que Compartilharão O{'\n'}Mesmo Progresso.
      </Text>

      <View style={styles.list}>
        {candidates.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma outra missão criada ainda.</Text>
        ) : (
          candidates.map((mission) => {
            const isSelected = selectedIds.includes(mission.id);
            const goalText = formatCountConfig(mission.count);
            return (
              <Pressable key={mission.id} onPress={() => toggle(mission.id)} style={styles.row}>
                <Text style={styles.rowTitle}>{mission.title}</Text>
                <View style={styles.rowRight}>
                  {mission.count.method === 'check' ? (
                    <Text style={styles.rowGoal}>
                      [<Text style={{ color: Hud.success }}>{mission.completed ? '✓' : ''}</Text>]
                    </Text>
                  ) : (
                    <Text style={styles.rowGoal}>[{goalText}]</Text>
                  )}
                  <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                    {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <Pressable
        onPress={() => {
          onSelect(selectedIds);
          onClose();
        }}
        style={styles.confirmButton}>
        <Text style={styles.confirmText}>SELECIONAR</Text>
      </Pressable>
    </HudSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: HudMono,
    color: Hud.textLabel,
    // Um pouco menor que o do outro submenu — "Compartilharão O" é uma
    // linha comprida e com 12px quebrava feio, deixando o "O" sozinho
    // numa linha própria.
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 18,
  },
  list: {
    gap: 16,
    marginBottom: 20,
  },
  emptyText: {
    color: Hud.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: {
    color: Hud.textPrimary,
    fontSize: 15,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  rowGoal: {
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
  },
  confirmButton: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Hud.textPrimary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: Hud.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 3,
    textShadowColor: Hud.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
