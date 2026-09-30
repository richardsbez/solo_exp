import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { HudSheet } from '@/components/hud-sheet';
import { MissionConnectSheet } from '@/components/mission-connect-sheet';
import { MissionCountMethodSheet } from '@/components/mission-count-method-sheet';
import { Hud, HudMono } from '@/constants/hud';
import type { AttributeKey } from '@/types/game';
import {
  createDraftMission,
  formatCountConfig,
  type DailyMission,
  type MissionCategory,
} from '@/types/mission-editor';

interface MissionEditorSheetProps {
  visible: boolean;
  /** Missão sendo editada, ou null pra criar uma nova. */
  editingMission: DailyMission | null;
  /** Todas as missões já existentes — pra listar no "CONECTAR As". */
  allMissions: DailyMission[];
  onClose: () => void;
  onConfirm: (mission: DailyMission) => void;
}

const CATEGORY_TABS: { key: MissionCategory; label: string }[] = [
  { key: 'principal', label: 'PRINCIPAL' },
  { key: 'secundaria', label: 'SEGUNDARIA' },
  { key: 'diaria', label: 'DIARIA' },
];

/** Painel principal de criação/edição de missão (Imagem 1). Orquestra os
 * dois submenus (método de contagem e conectar missões) por cima de si
 * mesmo — o rascunho (`draft`) só é escrito de volta na missão real
 * quando "CONFIRMAR" é tocado. */
export function MissionEditorSheet({
  visible,
  editingMission,
  allMissions,
  onClose,
  onConfirm,
}: MissionEditorSheetProps) {
  const [draft, setDraft] = useState<DailyMission>(createDraftMission());
  const [countSheetOpen, setCountSheetOpen] = useState(false);
  const [connectSheetOpen, setConnectSheetOpen] = useState(false);

  // Toda vez que o painel abre, recarrega o rascunho — com os dados da
  // missão em edição, ou em branco pra uma nova.
  useEffect(() => {
    if (visible) setDraft(editingMission ?? createDraftMission());
  }, [visible, editingMission]);

  // Sem botões de +/- visíveis (a referência não tem nenhum) — tocar no
  // valor cicla 0 → 5 → 0. abilityPoints segue o mesmo padrão.
  const adjustAttribute = (key: AttributeKey) => {
    setDraft((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: (prev.attributes[key] + 1) % 6 },
    }));
  };

  const adjustAbilityPoints = () => {
    setDraft((prev) => ({ ...prev, abilityPoints: (prev.abilityPoints + 1) % 10 }));
  };

  const adjustReward = (key: 'coins' | 'xp') => {
    const step = key === 'coins' ? 5 : 10;
    const max = key === 'coins' ? 100 : 200;
    setDraft((prev) => ({
      ...prev,
      rewards: { ...prev.rewards, [key]: (prev.rewards[key] + step) % (max + step) },
    }));
  };

  const handleConfirmar = () => {
    if (!draft.title.trim()) return;
    onConfirm(draft);
    onClose();
  };

  const connectedTitles = draft.linkedMissionIds
    .map((id) => allMissions.find((m) => m.id === id)?.title)
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <HudSheet visible={visible} onRequestClose={onClose}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.titleBox}>
            <TextInput
              value={draft.title}
              onChangeText={(title) => setDraft((prev) => ({ ...prev, title }))}
              placeholder="NOME DA MISSAO...."
              placeholderTextColor={Hud.textMuted}
              style={styles.titleInput}
            />
          </View>
          <View style={styles.titleUnderline} />

          <View style={styles.tabsRow}>
            {CATEGORY_TABS.map((tab) => {
              const isActive = draft.category === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setDraft((prev) => ({ ...prev, category: tab.key }))}
                  style={[styles.tab, isActive && styles.tabActive]}>
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.attributesPanel}>
            <View style={styles.attributesColumns}>
              <View style={styles.attributesColumn}>
                <AttributeValue
                  label="STR"
                  value={draft.attributes.strength}
                  onPress={() => adjustAttribute('strength')}
                />
                <AttributeValue
                  label="AGI"
                  value={draft.attributes.agility}
                  onPress={() => adjustAttribute('agility')}
                />
                <AttributeValue
                  label="PER"
                  value={draft.attributes.perception}
                  onPress={() => adjustAttribute('perception')}
                />
              </View>
              <View style={styles.attributesColumn}>
                <AttributeValue
                  label="INT"
                  value={draft.attributes.intelligence}
                  onPress={() => adjustAttribute('intelligence')}
                />
                <AttributeValue
                  label="VIT"
                  value={draft.attributes.vitality}
                  onPress={() => adjustAttribute('vitality')}
                />
                <View style={styles.pointsRow}>
                  <Text style={styles.pointsLabel}>Points:</Text>
                  <Pressable onPress={adjustAbilityPoints}>
                    <Text style={styles.pointsValue}>{draft.abilityPoints}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.rewardsRow}>
            <RewardBox icon="crosshair" label="COINS" value={draft.rewards.coins} onPress={() => adjustReward('coins')} />
            <RewardBox icon="crosshair" label="XP" value={draft.rewards.xp} onPress={() => adjustReward('xp')} />
          </View>

          <SectionLabel icon="check" text="CONTAGEM" />
          <Pressable style={styles.pickerField} onPress={() => setCountSheetOpen(true)}>
            <Text style={styles.pickerFieldText}>
              {draft.count.method === 'check'
                ? '[✓]'
                : formatCountConfig(draft.count)
                  ? `[${formatCountConfig(draft.count)}]`
                  : ''}
            </Text>
          </Pressable>

          <SectionLabel icon="link" text="CONECTAR As" />
          <Pressable style={styles.pickerField} onPress={() => setConnectSheetOpen(true)}>
            <Text style={styles.pickerFieldText} numberOfLines={1}>
              {connectedTitles}
            </Text>
          </Pressable>

          <Pressable
            disabled={!draft.title.trim()}
            onPress={handleConfirmar}
            style={[styles.confirmButton, !draft.title.trim() && styles.confirmButtonDisabled]}>
            <Text style={styles.confirmText}>CONFIRMAR</Text>
          </Pressable>
        </ScrollView>
      </HudSheet>

      <MissionCountMethodSheet
        visible={countSheetOpen}
        initialMethod={draft.count.method}
        onClose={() => setCountSheetOpen(false)}
        onSelect={(count) => setDraft((prev) => ({ ...prev, count }))}
      />

      <MissionConnectSheet
        visible={connectSheetOpen}
        missions={allMissions}
        excludeMissionId={editingMission?.id}
        initialSelectedIds={draft.linkedMissionIds}
        onClose={() => setConnectSheetOpen(false)}
        onSelect={(ids) => setDraft((prev) => ({ ...prev, linkedMissionIds: ids }))}
      />
    </>
  );
}

function SectionLabel({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <Feather name={icon} size={11} color={Hud.textLabel} />
      <Text style={styles.sectionLabelText}>{text}</Text>
    </View>
  );
}

function AttributeValue({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.attributeRow} hitSlop={6}>
      <Text style={styles.attributeLabel}>{label}:</Text>
      <Text style={styles.attributeValue}>{value}</Text>
    </Pressable>
  );
}

function RewardBox({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.rewardBox} onPress={onPress}>
      <View style={styles.rewardHeader}>
        <Feather name={icon} size={12} color={Hud.textLabel} />
        <Text style={styles.rewardLabel}>{label}</Text>
      </View>
      <Text style={styles.rewardValue}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleInput: {
    color: Hud.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  titleBox: {
    borderWidth: 1,
    borderColor: Hud.panelBorder,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  titleUnderline: {
    height: 2,
    backgroundColor: Hud.textPrimary,
    marginTop: 10,
    marginBottom: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderColor: Hud.panelBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: Hud.glow,
  },
  tabText: {
    color: Hud.textLabel,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: Hud.textPrimary,
  },
  attributesPanel: {
    borderWidth: 1,
    borderColor: Hud.panelBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },
  attributesColumns: {
    flexDirection: 'row',
  },
  attributesColumn: {
    flex: 1,
    gap: 12,
  },
  // Sem Feather aqui de propósito — a referência não mostra nenhum
  // controle visível de +/-. Tocar no número incrementa (ver
  // adjustAttribute), sem poluir a tela com botões extras.
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attributeLabel: {
    color: Hud.textLabel,
    fontSize: 12,
    fontWeight: '600',
    width: 30,
  },
  attributeValue: {
    color: Hud.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsLabel: {
    color: Hud.textMuted,
    fontSize: 10,
  },
  pointsValue: {
    color: Hud.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  rewardBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: Hud.panelBorder,
    borderRadius: 8,
    padding: 12,
    // Alinhado à esquerda — a referência não centraliza o conteúdo
    // dessas caixas.
    alignItems: 'flex-start',
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  rewardLabel: {
    color: Hud.textLabel,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  rewardValue: {
    color: Hud.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textShadowColor: Hud.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionLabelText: {
    color: Hud.textLabel,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  pickerField: {
    borderWidth: 1,
    borderColor: Hud.panelBorder,
    borderRadius: 6,
    // Mais fino que antes — a referência é uma linha só, não uma caixa alta.
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  pickerFieldText: {
    fontFamily: HudMono,
    color: Hud.textPrimary,
    fontSize: 13,
  },
  confirmButton: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Hud.textPrimary,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    color: Hud.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
    textShadowColor: Hud.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
