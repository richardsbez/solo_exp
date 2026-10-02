import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HudPressable } from '@/components/hud-pressable';
import { HudSheet } from '@/components/hud-sheet';
import { Hud, HudMono } from '@/constants/hud';
import type { CountConfig, CountMethod } from '@/types/mission-editor';

interface MethodOption {
  method: CountMethod;
  label: string;
}

const METHODS: MethodOption[] = [
  { method: 'numeric', label: '[0/00]' },
  { method: 'text', label: '[text]' },
  { method: 'check', label: '✓' },
  { method: 'distance', label: '[0/0km]' },
];

interface MissionCountMethodSheetProps {
  visible: boolean;
  /** Configuração atual da missão — o método vem pré-selecionado e, se o
   * usuário confirmar o MESMO método, a configuração é preservada. */
  initialCount: CountConfig;
  onClose: () => void;
  onSelect: (count: CountConfig) => void;
}

/** Submenu "Selecione O Método". Regra do produto: só um método de
 * contagem por missão — por isso é seleção única (radio), não checkbox. */
export function MissionCountMethodSheet({
  visible,
  initialCount,
  onClose,
  onSelect,
}: MissionCountMethodSheetProps) {
  const [selected, setSelected] = useState<CountMethod>(initialCount.method);

  // Reabre sempre mostrando o método atual marcado — no próprio render
  // da abertura, sem o frame extra de um useEffect.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setSelected(initialCount.method);
  }

  const handleSelecionar = () => {
    // Mesmo método: nada muda. Antes, reabrir e confirmar zerava a meta.
    if (selected === initialCount.method) {
      onClose();
      return;
    }

    // Trocar de método reseta o progresso anterior — "text" não deve
    // herdar um alvo numérico de quando a missão era "numeric".
    const next: CountConfig =
      selected === 'numeric'
        ? { method: 'numeric', target: 10, progress: 0 }
        : selected === 'distance'
          ? { method: 'distance', target: 5, progress: 0 }
          : selected === 'text'
            ? { method: 'text', text: '' }
            : { method: 'check', checked: false };

    onSelect(next);
    onClose();
  };

  return (
    <HudSheet visible={visible} onRequestClose={onClose} nested>
      <Text style={styles.title}>Selecione O Método:{'\n'}Contagem Ou Descritivo.</Text>

      <View style={styles.list}>
        {METHODS.map((option) => {
          const isSelected = option.method === selected;
          return (
            <HudPressable
              key={option.method}
              onPress={() => setSelected(option.method)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={[styles.option, isSelected && styles.optionSelected]}>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </HudPressable>
          );
        })}
      </View>

      <HudPressable onPress={handleSelecionar} style={styles.confirmButton}>
        <Text style={styles.confirmText}>SELECIONAR</Text>
      </HudPressable>
    </HudSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: HudMono,
    color: Hud.textLabel,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  list: {
    gap: 8,
    marginBottom: 20,
  },
  option: {
    borderWidth: 1,
    borderColor: Hud.panelBorder,
    borderRadius: 6,
    paddingVertical: 9,
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: Hud.glow,
  },
  optionText: {
    fontFamily: HudMono,
    color: Hud.textLabel,
    fontSize: 14,
  },
  optionTextSelected: {
    color: Hud.textPrimary,
    textShadowColor: Hud.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
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
