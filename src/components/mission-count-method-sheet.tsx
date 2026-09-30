import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

  // Reabre sempre mostrando o método atual da missão marcado.
  useEffect(() => {
    if (visible) setSelected(initialCount.method);
  }, [visible, initialCount.method]);

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
        ? { method: 'numeric', target: 0, progress: 0 }
        : selected === 'distance'
          ? { method: 'distance', target: 0, progress: 0 }
          : selected === 'text'
            ? { method: 'text', text: '' }
            : { method: 'check', checked: false };

    onSelect(next);
    onClose();
  };

  return (
    <HudSheet visible={visible} onRequestClose={onClose}>
      <Text style={styles.title}>Selecione O Método:{'\n'}Contagem Ou Descritivo.</Text>

      <View style={styles.list}>
        {METHODS.map((option) => {
          const isSelected = option.method === selected;
          return (
            <Pressable
              key={option.method}
              onPress={() => setSelected(option.method)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={[styles.option, isSelected && styles.optionSelected]}>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={handleSelecionar} style={styles.confirmButton}>
        <Text style={styles.confirmText}>SELECIONAR</Text>
      </Pressable>
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
