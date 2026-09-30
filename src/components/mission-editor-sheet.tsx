import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { HudSheet } from '@/components/hud-sheet';
import { MissionConnectSheet } from '@/components/mission-connect-sheet';
import { MissionCountMethodSheet } from '@/components/mission-count-method-sheet';
import { ATTRIBUTE_DISPLAY_ORDER, ATTRIBUTE_SHORT_LABELS } from '@/constants/game';
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

  const adjustAttribute = (key: AttributeKey, delta: number) => {
    setDraft((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: Math.max(0, prev.attributes[key] + delta) },
    }));
  };

  const adjustAbilityPoints = (delta: number) => {
    setDraft((prev) => ({ ...prev, abilityPoints: Math.max(0, prev.abilityPoints + delta) }));
  };

  const adjustReward = (key: 'coins' | 'xp', delta: number) => {
    setDraft((prev) => ({
      ...prev,
      rewards: { ...prev.rewards, [key]: Math.max(0, prev.rewards[key] + delta) },
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
          <TextInput
            value={draft.title}
            onChangeText={(title) => setDraft((prev) => ({ ...prev, title }))}
            placeholder="NOME DA MISSAO...."
            placeholderTextColor={Hud.textMuted}
            style={styles.titleInput}
          />
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
            <View style={styles.attributesGrid}>
              {ATTRIBUTE_DISPLAY_ORDER.map((key) => (
                <AttributeStepper
                  key={key}
                  label={ATTRIBUTE_SHORT_LABELS[key]}
                  value={draft.attributes[key]}
                  onDecrement={() => adjustAttribute(key, -1)}
                  onIncrement={() => adjustAttribute(key, 1)}
                />
              ))}
            </View>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsLabel}>Points:</Text>
              <Pressable onPress={() => adjustAbilityPoints(-1)} hitSlop={8}>
                <Feather name="minus" size={11} color={Hud.textMuted} />
              </Pressable>
              <Text style={styles.pointsValue}>{draft.abilityPoints}</Text>
              <Pressable onPress={() => adjustAbilityPoints(1)} hitSlop={8}>
                <Feather name="plus" size={11} color={Hud.textMuted} />
              </Pressable>
            </View>
          </View>

          <View style={styles.rewardsRow}>
            <RewardBox
              icon="crosshair"
              label="COINS"
              value={draft.rewards.coins}
              onDecrement={() => adjustReward('coins', -1)}
              onIncrement={() => adjustReward('coins', 1)}
            />
            <RewardBox
              icon="crosshair"
              label="XP"
              value={draft.rewards.xp}
              onDecrement={() => adjustReward('xp', -1)}
              onIncrement={() => adjustReward('xp', 1)}
            />
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

function AttributeStepper({
  label,
  value,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={styles.attributeRow}>
      <Text style={styles.attributeLabel}>{label}:</Text>
      <Pressable onPress={onDecrement} hitSlop={8}>
        <Feather name="minus" size={11} color={Hud.textMuted} />
      </Pressable>
      <Text style={styles.attributeValue}>{value}</Text>
      <Pressable onPress={onIncrement} hitSlop={8}>
        <Feather name="plus" size={11} color={Hud.textMuted} />
      </Pressable>
    </View>
  );
}

function RewardBox({
  icon,
  label,
  value,
  onDecrement,
  onIncrement,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={styles.rewardBox}>
      <View style={styles.rewardHeader}>
        <Feather name={icon} size={12} color={Hud.textLabel} />
        <Text style={styles.rewardLabel}>{label}</Text>
      </View>
      <View style={styles.rewardValueRow}>
        <Pressable onPress={onDecrement} hitSlop={8}>
          <Feather name="minus" size={13} color={Hud.textMuted} />
        </Pressable>
        <Text style={styles.rewardValue}>{value}</Text>
        <Pressable onPress={onIncrement} hitSlop={8}>
          <Feather name="plus" size={13} color={Hud.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleInput: {
    color: Hud.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    paddingBottom: 10,
  },
  titleUnderline: {
    height: 2,
    backgroundColor: Hud.textPrimary,
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
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
  },
  attributeRow: {
    width: '50%',
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
    fontSize: 13,
    fontWeight: '700',
    width: 16,
    textAlign: 'center',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  pointsLabel: {
    color: Hud.textMuted,
    fontSize: 10,
  },
  pointsValue: {
    color: Hud.textPrimary,
    fontSize: 12,
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
    alignItems: 'center',
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
  rewardValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    minHeight: 36,
    paddingHorizontal: 10,
    justifyContent: 'center',
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
