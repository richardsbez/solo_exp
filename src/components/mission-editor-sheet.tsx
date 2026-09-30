import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { HudSheet } from '@/components/hud-sheet';
import { Stepper } from '@/components/hud-stepper';
import { MissionConnectSheet } from '@/components/mission-connect-sheet';
import { MissionCountMethodSheet } from '@/components/mission-count-method-sheet';
import { Hud, HudMono } from '@/constants/hud';
import type { AttributeKey } from '@/types/game';
import {
  clamp,
  createDraftMission,
  formatCountConfig,
  getTargetStep,
  isCounter,
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

const LEFT_ATTRIBUTES: { label: string; key: AttributeKey }[] = [
  { label: 'STR', key: 'strength' },
  { label: 'AGI', key: 'agility' },
  { label: 'PER', key: 'perception' },
];
const RIGHT_ATTRIBUTES: { label: string; key: AttributeKey }[] = [
  { label: 'INT', key: 'intelligence' },
  { label: 'VIT', key: 'vitality' },
];

const MAX_ATTRIBUTE = 5;
const MAX_ABILITY_POINTS = 9;
const MAX_TARGET = 9999;
const REWARD_LIMITS = {
  coins: { step: 5, max: 100 },
  xp: { step: 10, max: 200 },
} as const;

/** Painel principal de criação/edição de missão. Orquestra os dois
 * submenus (método de contagem e conectar missões) por cima de si mesmo —
 * o rascunho (`draft`) só é escrito de volta na missão real quando
 * "CONFIRMAR" é tocado. */
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

  const adjustAttribute = (key: AttributeKey, direction: 1 | -1) => {
    setDraft((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: clamp(prev.attributes[key] + direction, 0, MAX_ATTRIBUTE),
      },
    }));
  };

  const adjustAbilityPoints = (direction: 1 | -1) => {
    setDraft((prev) => ({
      ...prev,
      abilityPoints: clamp(prev.abilityPoints + direction, 0, MAX_ABILITY_POINTS),
    }));
  };

  const adjustReward = (key: 'coins' | 'xp', direction: 1 | -1) => {
    const { step, max } = REWARD_LIMITS[key];
    setDraft((prev) => ({
      ...prev,
      rewards: { ...prev.rewards, [key]: clamp(prev.rewards[key] + direction * step, 0, max) },
    }));
  };

  const adjustTarget = (direction: 1 | -1) => {
    setDraft((prev) => {
      const step = getTargetStep(prev.count.method);
      const target = clamp((prev.count.target ?? 0) + direction * step, 0, MAX_TARGET);
      return {
        ...prev,
        // Se a meta cair abaixo do progresso, o progresso acompanha.
        count: { ...prev.count, target, progress: Math.min(prev.count.progress ?? 0, target) },
      };
    });
  };

  const canConfirm = draft.title.trim().length > 0;

  const handleConfirmar = () => {
    if (!canConfirm) return;
    onConfirm({ ...draft, title: draft.title.trim() });
    onClose();
  };

  const connectedTitles = draft.linkedMissionIds
    .map((id) => allMissions.find((m) => m.id === id)?.title)
    .filter(Boolean)
    .join(', ');

  const isDistance = draft.count.method === 'distance';

  return (
    <>
      <HudSheet visible={visible} onRequestClose={onClose}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.titleBox}>
            <TextInput
              value={draft.title}
              onChangeText={(title) => setDraft((prev) => ({ ...prev, title }))}
              placeholder="NOME DA MISSAO...."
              placeholderTextColor={Hud.textMuted}
              maxLength={40}
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
                {LEFT_ATTRIBUTES.map(({ label, key }) => (
                  <AttributeRow
                    key={key}
                    label={label}
                    value={draft.attributes[key]}
                    max={MAX_ATTRIBUTE}
                    onChange={(direction) => adjustAttribute(key, direction)}
                  />
                ))}
              </View>
              <View style={styles.attributesColumn}>
                {RIGHT_ATTRIBUTES.map(({ label, key }) => (
                  <AttributeRow
                    key={key}
                    label={label}
                    value={draft.attributes[key]}
                    max={MAX_ATTRIBUTE}
                    onChange={(direction) => adjustAttribute(key, direction)}
                  />
                ))}
                <AttributeRow
                  label="Points:"
                  labelStyle={styles.pointsLabel}
                  value={draft.abilityPoints}
                  max={MAX_ABILITY_POINTS}
                  onChange={adjustAbilityPoints}
                />
              </View>
            </View>
          </View>

          <View style={styles.rewardsRow}>
            <RewardBox
              icon="crosshair"
              label="COINS"
              value={draft.rewards.coins}
              max={REWARD_LIMITS.coins.max}
              onChange={(direction) => adjustReward('coins', direction)}
            />
            <RewardBox
              icon="crosshair"
              label="XP"
              value={draft.rewards.xp}
              max={REWARD_LIMITS.xp.max}
              onChange={(direction) => adjustReward('xp', direction)}
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

          {/* Meta: sem isso, "numeric"/"distance" ficavam eternamente em 0. */}
          {isCounter(draft.count) && (
            <>
              <SectionLabel icon="target" text={isDistance ? 'META (KM)' : 'META'} />
              <View style={styles.targetRow}>
                <Stepper
                  value={draft.count.target ?? 0}
                  onDecrement={() => adjustTarget(-1)}
                  onIncrement={() => adjustTarget(1)}
                  canDecrement={(draft.count.target ?? 0) > 0}
                  canIncrement={(draft.count.target ?? 0) < MAX_TARGET}
                  size={26}
                  valueMinWidth={56}
                  valueStyle={styles.targetValue}
                />
              </View>
            </>
          )}

          {/* Descrição: o método "text" não tinha como ser preenchido. */}
          {draft.count.method === 'text' && (
            <>
              <SectionLabel icon="edit-3" text="DESCRIÇÃO" />
              <View style={[styles.pickerField, styles.textField]}>
                <TextInput
                  value={draft.count.text ?? ''}
                  onChangeText={(text) =>
                    setDraft((prev) => ({ ...prev, count: { ...prev.count, text } }))
                  }
                  placeholder="ex: gastar -20R"
                  placeholderTextColor={Hud.textMuted}
                  maxLength={24}
                  style={styles.pickerFieldText}
                />
              </View>
            </>
          )}

          <SectionLabel icon="link" text="CONECTAR As" />
          <Pressable style={styles.pickerField} onPress={() => setConnectSheetOpen(true)}>
            <Text style={styles.pickerFieldText} numberOfLines={1}>
              {connectedTitles}
            </Text>
          </Pressable>

          <Pressable
            disabled={!canConfirm}
            onPress={handleConfirmar}
            style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}>
            <Text style={styles.confirmText}>CONFIRMAR</Text>
          </Pressable>
        </ScrollView>
      </HudSheet>

      <MissionCountMethodSheet
        visible={countSheetOpen}
        initialCount={draft.count}
        onClose={() => setCountSheetOpen(false)}
        onSelect={(count) =>
          setDraft((prev) => ({
            ...prev,
            count,
            // Método novo = contagem nova, então a missão volta a pendente.
            completed: false,
          }))
        }
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

function AttributeRow({
  label,
  labelStyle,
  value,
  max,
  onChange,
}: {
  label: string;
  labelStyle?: object;
  value: number;
  max: number;
  onChange: (direction: 1 | -1) => void;
}) {
  return (
    <View style={styles.attributeRow}>
      <Text style={[styles.attributeLabel, labelStyle]}>{label.includes(':') ? label : `${label}:`}</Text>
      <Stepper
        value={value}
        size={20}
        valueMinWidth={16}
        canDecrement={value > 0}
        canIncrement={value < max}
        onDecrement={() => onChange(-1)}
        onIncrement={() => onChange(1)}
      />
    </View>
  );
}

function RewardBox({
  icon,
  label,
  value,
  max,
  onChange,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: number;
  max: number;
  onChange: (direction: 1 | -1) => void;
}) {
  return (
    <View style={styles.rewardBox}>
      <View style={styles.rewardHeader}>
        <Feather name={icon} size={12} color={Hud.textLabel} />
        <Text style={styles.rewardLabel}>{label}</Text>
      </View>
      <Stepper
        value={value}
        size={22}
        valueMinWidth={38}
        valueStyle={styles.rewardValue}
        canDecrement={value > 0}
        canIncrement={value < max}
        onDecrement={() => onChange(-1)}
        onIncrement={() => onChange(1)}
      />
    </View>
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
    gap: 10,
  },
  attributesColumn: {
    flex: 1,
    gap: 10,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attributeLabel: {
    color: Hud.textLabel,
    fontSize: 12,
    fontWeight: '600',
  },
  pointsLabel: {
    color: Hud.textMuted,
    fontSize: 10,
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
    alignItems: 'flex-start',
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  rewardLabel: {
    color: Hud.textLabel,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  rewardValue: {
    fontSize: 20,
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
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  textField: {
    paddingVertical: 4,
  },
  pickerFieldText: {
    fontFamily: HudMono,
    color: Hud.textPrimary,
    fontSize: 13,
  },
  targetRow: {
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  targetValue: {
    fontFamily: HudMono,
    fontSize: 16,
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
